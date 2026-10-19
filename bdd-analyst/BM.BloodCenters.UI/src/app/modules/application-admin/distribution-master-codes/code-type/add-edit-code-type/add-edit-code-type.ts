import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { requiredTrimmedValidator, trimmedMaxLengthValidator } from '@shared/validators';

export interface CodeTypeDialogData {
  mode: 'add' | 'edit';
  codeType?: string;
  codeTypeDescription?: string;
  code?: string;
  description?: string;
  effectiveDate?: Date;
  termDate?: Date | null;
  status?: string;
  modificationDate?: Date;
  numericalValue?: number | null;
  sequence1?: number | null;
  sequence2?: number | null;
  sequence3?: number | null;
  codeBehavior?: string;
}

export interface CodeTypeDialogResult {
  codeType: string;
  code: string;
  description: string;
  effectiveDate: string;
  termDate?: string | null;
  numericalValue?: number | null;
  sequence1?: number | null;
  sequence2?: number | null;
  sequence3?: number | null;
  codeBehavior: string;
}

@Component({
  selector: 'app-add-edit-code-type',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatIconModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-code-type.html',
  styleUrls: ['./add-edit-code-type.scss']
})
export class AddEditCodeType implements OnInit, OnDestroy {
  dialogTitle: string;
  mode: 'add' | 'edit' = 'add';
  isSaving = false;
  codeType: string = '';
  codeTypeDescription: string = '';
  form!: FormGroup;
  modificationDate: Date | null = null;

  codeBehaviorOptions = [
    { value: 'D', label: 'Customer-Controlled (Fully Editable)' },
    { value: 'S', label: 'Admin-Controlled (Non Editable)' }
  ];

  // Minimum date for datepicker restrictions (based on chapter timezone)
  minDate!: moment.Moment;

  // Edit mode values for display
  editModeValues = {
    effectiveDate: ''
  };

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');
    if (checkDate.isBefore(today)) return false;
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  /** Emits save data without closing the dialog — parent decides when to close */
  saveRequest = new Subject<CodeTypeDialogResult>();

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private headerService: HeaderService,
    public dialogRef: MatDialogRef<AddEditCodeType>,
    @Inject(MAT_DIALOG_DATA) public data: CodeTypeDialogData
  ) {
    this.mode = data.mode;
    this.dialogTitle = data.mode === 'add' ? 'Add New Code' : 'Edit Code';
    this.codeType = data.codeType || '';
    this.codeTypeDescription = data.codeTypeDescription || '';

    // Get chapter timezone and set minDate based on chapter date
    const chapterTimezone = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const chapterTimezone = this.headerService.chapterTimeZone();

    if (this.mode === 'edit') {
      this.form = this.fb.group({
        code: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(5), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
        description: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(240)]],
        codeBehavior: [''],
        effectiveDate: [null, Validators.required],
        terminationDate: [null],
        numericalValue: [0, [AddEditCodeType.numericalValueValidator()]],
        sequence1: [0, [AddEditCodeType.sequenceValidator()]],
        sequence2: [0, [AddEditCodeType.sequenceValidator()]],
        sequence3: [0, [AddEditCodeType.sequenceValidator()]]
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
      });
      // Setup edit mode validators (allows past dates for effective date)
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    } else {
      this.form = this.fb.group({
        code: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(5), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
        description: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(240)]],
        codeBehavior: ['', Validators.required],
        effectiveDate: [null, [Validators.required]],
        terminationDate: [null],
        numericalValue: [0, [AddEditCodeType.numericalValueValidator()]],
        sequence1: [0, [AddEditCodeType.sequenceValidator()]],
        sequence2: [0, [AddEditCodeType.sequenceValidator()]],
        sequence3: [0, [AddEditCodeType.sequenceValidator()]]
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
      });
      // Setup add mode validators (effective date cannot be in the past)
      DateFieldValidationUtility.setupAddModeValidators(this.form, chapterTimezone);
    }

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

    if (this.mode === 'edit' && this.data) {
      this.form.patchValue({
        code: this.data.code || '',
        description: this.data.description || '',
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null,
        numericalValue: this.data.numericalValue ?? 0,
        sequence1: this.data.sequence1 ?? 0,
        sequence2: this.data.sequence2 ?? 0,
        sequence3: this.data.sequence3 ?? 0,
        codeBehavior: this.data.codeBehavior || ''
      });

      this.modificationDate = this.data.modificationDate ? new Date(this.data.modificationDate) : null;

      // Format effective date for display in edit mode
      this.editModeValues.effectiveDate = this.formatDateForDisplay(this.data.effectiveDate);

      // Disable code and effective date in edit mode
      this.form.get('code')?.disable({ emitEvent: false });
      this.form.get('effectiveDate')?.disable({ emitEvent: false });

      this.form.markAsPristine();
    }
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.mode === 'add') {
      this.form.markAllAsTouched();
      DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
      if (this.form.invalid) {
        return;
      }
    }

    const formValue = this.form.getRawValue();

    const result: CodeTypeDialogResult = {
      codeType: this.codeType,
      code: formValue.code,
      description: formValue.description,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      numericalValue: formValue.numericalValue,
      sequence1: formValue.sequence1,
      sequence2: formValue.sequence2,
      sequence3: formValue.sequence3,
      codeBehavior: formValue.codeBehavior || ''
    };

    this.isSaving = true;
    this.saveRequest.next(result);
  }

  isFormValid(): boolean {
    if (this.mode === 'edit') {
      if (!this.form.dirty) return false;
      const hasVisibleErrors =
        this.getCodeError() !== '' ||
        this.getDescriptionError() !== '' ||
        this.getEffectiveDateError() !== '' ||
        this.getTerminationDateError() !== '';
      return !hasVisibleErrors;
    }
    return !this.form.invalid;
  }

  convertToUppercase(controlName: string): void {
    const control = this.form.get(controlName);
    if (control?.value) {
      control.setValue(control.value.toUpperCase(), { emitEvent: false });
    }
  }

  getCodeError(): string {
    const control = this.form.get('code');
    if (!control || !control.touched) return '';
    if (control.hasError('required') || control.hasError('whitespaceOnly')) return 'Code Type is required';
    if (control.hasError('trimmedMaxLength')) return 'Code cannot exceed 5 characters';
    if (control.hasError('pattern')) return 'Code Type must be alphanumeric (special characters are not allowed)';
    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !control.touched) return '';
    if (control.hasError('required') || control.hasError('whitespaceOnly')) return 'Description is required';
    if (control.hasError('trimmedMaxLength')) return 'Description cannot exceed 240 characters';
    return '';
  }

  getCodeBehaviorError(): string {
    const control = this.form.get('codeBehavior');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Code Behavior is required';
    return '';
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  get codeRemainingChars(): number {
    const code = this.form.get('code')?.value || '';
    return 5 - code.length;
  }

  get descriptionRemainingChars(): number {
    const description = this.form.get('description')?.value || '';
    return 50 - description.length;
  }

  // Format date to DD-MMM-YYYY
  formatDate(date: Date | null): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  onNumericalValueInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9.\-]/g, '');
    const match = value.match(/^-?\d{0,7}(\.\d{0,3})?/);
    value = match ? match[0] : '';
    if (input.value !== value) {
      input.value = value;
      this.form.get('numericalValue')?.setValue(value, { emitEvent: false });
    }
  }

  onSequenceInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9\-]/g, '');
    const match = value.match(/^-?\d{0,3}/);
    value = match ? match[0] : '';
    if (input.value !== value) {
      input.value = value;
      this.form.get(controlName)?.setValue(value, { emitEvent: false });
    }
  }

  onNumericalValueKeydown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/^[0-9.\-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onSequenceKeydown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/^[0-9\-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  getNumericalValueError(): string {
    const control = this.form.get('numericalValue');
    if (!control || !control.touched) return '';
    if (control.hasError('numericalValueInvalid')) return 'Max 7 digits with up to 3 decimal places';
    return '';
  }

  getSequenceError(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !control.touched) return '';
    if (control.hasError('sequenceInvalid')) return 'Max 3 digits, no decimals';
    return '';
  }

  private static numericalValueValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '' || value === 0 || value === '0') return null;
      const str = String(value);
      if (!/^-?\d{1,7}(\.\d{1,3})?$/.test(str)) return { numericalValueInvalid: true };
      return null;
    };
  }

  private static sequenceValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '' || value === 0 || value === '0') return null;
      const str = String(value);
      if (!/^-?\d{1,3}$/.test(str)) return { sequenceInvalid: true };
      return null;
    };
  }
}
