import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '../../../../../shared/date/date-formats';
import { ChapterAwareDateAdapter } from '../../../../../shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from '../../../../../core/utils/date-adapter.util';
import { HeaderService } from '@shared/services/header.service';
import { integerValidator, numericalValueValidator, requiredTrimmedValidator, trimmedMaxLengthValidator } from '@shared/validators';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

export interface CodeTypeDialogData {
  mode: 'add' | 'edit';
  codeType?: string;
  codeTypeDescription?: string;
  code?: string;
  description?: string;
  effectiveDate?: Date;
  termDate?: Date | null;
  status?: string;
  numberalValue?: number | null;
  sequence1?: number | null;
  sequence2?: number | null;
  sequence3?: number | null;
}

export interface CodeTypeDialogResult {
  codeType: string;
  code: string;
  description: string;
  effectiveDate: string;
  termDate?: string | null;
  numberalValue?: number | null;
  sequence1?: number | null;
  sequence2?: number | null;
  sequence3?: number | null;
}

@Component({
  selector: 'app-add-update-code-type',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-update-code-type.html',
  styleUrls: ['./add-update-code-type.scss']
})
export class AddUpdateCodeType implements OnDestroy {
  dialogTitle: string;
  mode: 'add' | 'edit' = 'add';
  isSaving = false;
  form!: FormGroup;

  codeType: string = '';
  codeTypeDescription: string = '';

  saveRequest = new Subject<CodeTypeDialogResult>();

  minDate: moment.Moment;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  /** Termination date filter: not before today and not before Effective Date */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.minDate.startOf('day');

    // Prevent dates before today
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Prevent dates before effective date
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private headerService: HeaderService,
    public dialogRef: MatDialogRef<AddUpdateCodeType>,
    @Inject(MAT_DIALOG_DATA) public data: CodeTypeDialogData
  ) {
    this.mode = data.mode;
    this.dialogTitle = data.mode === 'add' ? 'Add New Code' : 'Edit Code';
    this.codeType = data.codeType || '';
    this.codeTypeDescription = data.codeTypeDescription || '';
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      code: [
        { value: this.data.code || '', disabled: this.mode === 'edit' },
        [
          Validators.required,
          requiredTrimmedValidator(),
          trimmedMaxLengthValidator(5),
          Validators.pattern(/^[a-zA-Z0-9]+$/)
        ]
      ],
      description: [this.data.description || '', [Validators.required, requiredTrimmedValidator(), trimmedMaxLengthValidator(240)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null],
      numberalValue: [
        this.data.numberalValue ?? 0,
        [numericalValueValidator()]
      ],
      sequence1: [
        this.data.sequence1 ?? 0,
        [integerValidator()]
      ],
      sequence2: [
        this.data.sequence2 ?? 0,
        [integerValidator()]
      ],
      sequence3: [
        this.data.sequence3 ?? 0,
        [integerValidator()]
      ]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    if (this.mode === 'edit' && this.data) {
      this.form.patchValue({
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.headerService.chapterTimeZone());
      // Override termination date validators to include past date validation in edit mode
      this.setupTerminationDateValidatorsForEdit();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  /**
   * Setup termination date validators for edit mode
   * Business Rule: Terminated records can be edited, but if user touches termination date field,
   * show "date is in past" error and disable save
   */
  private setupTerminationDateValidatorsForEdit(): void {
    const termDateControl = this.form.get('terminationDate');
    if (termDateControl) {
      termDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())
      ]);
      termDateControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Store termination date touched state before markAllAsTouched
    const termDateControl = this.form.get('terminationDate');
    const wasTermDateTouched = termDateControl?.touched || false;

    this.form.markAllAsTouched();

    // Clear errors on empty optional termination date without marking pristine
    // (markAsPristine would cascade to the parent form and block save)
    if (termDateControl && !termDateControl.value) {
      termDateControl.setErrors(null);
    }

    if (!wasTermDateTouched && termDateControl) {
      termDateControl.markAsUntouched();
    }

    // Check for visible validation errors (not hidden termination date errors)
    if (!this.isFormValid()) {
      return;
    }

    const formValue = this.form.getRawValue();

    const result: CodeTypeDialogResult = {
      codeType: this.codeType,
      code: formValue.code,
      description: formValue.description,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      numberalValue: formValue.numberalValue,
      sequence1: formValue.sequence1,
      sequence2: formValue.sequence2,
      sequence3: formValue.sequence3
    };

    this.isSaving = true;
    this.saveRequest.next(result);
  }

  isFormValid(): boolean {
    if (this.mode === 'edit' && !this.form.dirty) {
      return false;
    }

    // Check for visible errors (only errors on touched fields)
    // This allows saving when other fields are changed but termination date is untouched
    const termDateControl = this.form.get('terminationDate');
    const hasTermDateError = termDateControl?.touched && termDateControl?.hasError('terminationDatePast');

    // Check for cross-field date range errors
    const hasDateRangeError = this.form.hasError('dateRangeInvalid');

    // Check for real date format errors (always visible)
    const termHasFormatError = termDateControl &&
      (termDateControl.hasError('invalidDate') || termDateControl.hasError('invalidDateFormat') || termDateControl.hasError('matDatepickerParse'));

    if (hasTermDateError || termHasFormatError) {
      return false;
    }

    // Check validity of other controls
    const otherControlsValid = Object.keys(this.form.controls)
      .filter(key => key !== 'terminationDate')
      .every(key => {
        const control = this.form.get(key);
        return !control || control.disabled || control.valid;
      });

    return otherControlsValid && !hasDateRangeError;
  }

  /** Format effective date for display in edit mode */
  get editEffectiveDateDisplay(): string {
    const effDate = this.form?.get('effectiveDate')?.value;
    if (!effDate) return '-';
    return DateFieldValidationUtility.formatDateForUI(effDate)?.toUpperCase() || '-';
  }

  getCodeError(): string {
    const control = this.form.get('code');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required') || control.hasError('whitespaceOnly')) return 'Code is required';
    if (control.hasError('trimmedMaxLength')) return 'Code cannot exceed 5 characters';
    if (control.hasError('pattern')) return 'Code must be alphanumeric (special characters are not allowed)';
    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required') || control.hasError('whitespaceOnly')) return 'Description is required';
    if (control.hasError('trimmedMaxLength')) return 'Description cannot exceed 240 characters';
    return '';
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');

    // Field-level error: Termination date is in the past (only shown if field is touched)
    if (control?.touched && control?.hasError('terminationDatePast')) {
      return 'Termination Date cannot be in the past';
    }

    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      control, 'Termination Date', 'Effective Date', formErrors
    );
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

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (input.value !== newValue) {
      this.form.get('code')?.setValue(newValue, { emitEvent: false });
      input.value = newValue;
    }
  }

  get descriptionRemainingChars(): number {
    return 240 - (this.form.get('description')?.value?.length || 0);
  }

  get codeRemainingChars(): number {
    return 5 - (this.form.get('code')?.value?.length || 0);
  }

  onNumericInput(event: Event, controlName: string, maxLength: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove 'e'/'E' if pasted
    value = value.replace(/[eE]/g, '');

    // Truncate total length (including '-' and '.') to maxLength
    if (value.length > maxLength) {
      value = value.substring(0, maxLength);
    }

    if (input.value !== value) {
      input.value = value;
      this.form.get(controlName)?.setValue(value === '' || value === '-' ? null : Number(value), { emitEvent: false });
    }
  }

  onNumericKeydown(event: KeyboardEvent): void {
    if (event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  // Blocks e/E and decimal point — used by Sequence 1/2/3 (integer-only fields)
  onIntegerKeydown(event: KeyboardEvent): void {
    if (event.key === 'e' || event.key === 'E' || event.key === '.') {
      event.preventDefault();
    }
  }

  // Strips e/E and decimal, enforces max digit count excluding minus sign — for Sequence 1/2/3
  onIntegerInput(event: Event, controlName: string, maxDigits: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/[eE]/g, '').replace(/\..*/, '');
    const digits = value.startsWith('-') ? value.slice(1) : value;
    if (digits.length > maxDigits) {
      value = (value.startsWith('-') ? '-' : '') + digits.substring(0, maxDigits);
    }
    if (input.value !== value) {
      input.value = value;
      this.form.get(controlName)?.setValue(value === '' || value === '-' ? null : Number(value), { emitEvent: false });
    }
  }

  // Strips e/E, enforces NUMBER(10,3): max 7 integer digits, max 3 decimal digits — for Numerical Value
  onDecimalInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[eE]/g, '');

    const dotIndex = value.indexOf('.');
    if (dotIndex !== -1) {
      const intPart = value.substring(0, dotIndex);
      const decPart = value.substring(dotIndex + 1);
      const sign = intPart.startsWith('-') ? '-' : '';
      const intDigits = intPart.replace('-', '');
      const clampedInt = intDigits.length > 7 ? intDigits.substring(0, 7) : intDigits;
      const clampedDec = decPart.length > 3 ? decPart.substring(0, 3) : decPart;
      value = sign + clampedInt + '.' + clampedDec;
    } else {
      const sign = value.startsWith('-') ? '-' : '';
      const intDigits = value.replace('-', '');
      if (intDigits.length > 7) {
        value = sign + intDigits.substring(0, 7);
      }
    }

    if (input.value !== value) {
      input.value = value;
      this.form.get(controlName)?.setValue(
        value === '' || value === '-' || value === '-.' ? null : Number(value),
        { emitEvent: false }
      );
    }
  }

  getNumericalValueError(): string {
    const control = this.form.get('numberalValue');
    if (!control || !control.touched) return '';
    if (control.hasError('numericalValue')) {
      return 'Must be a valid number up to 7 integer digits and 3 decimal digits (e.g. 9999999 or 1234567.890)';
    }
    return '';
  }

  getSequenceError(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !control.touched) return '';
    if (control.hasError('integer')) {
      return 'Must be a whole number (e.g. 123 or -124)';
    }
    return '';
  }
}
