import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '../../../../shared/date/date-formats';
import { ChapterAwareDateAdapter } from '../../../../shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from '../../../../core/utils/date-adapter.util';
import { requiredTrimmedValidator, trimmedMaxLengthValidator } from '@shared/validators';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

export interface MasterCodeDialogData {
  mode: 'add' | 'edit';
  codeType?: string;
  code?: string;
  description?: string;
  effDate?: Date;
  termDate?: Date | null;
  status?: string;
  modificationDate?: Date;
}

export interface CodeDialogResult {
  codeType: string;
  code: string;
  description: string;
  effDate: string;
  terminationDate?: string | null;
}

@Component({
  selector: 'app-add-update-donor-master-codes',
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
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-update-donor-master-codes.html',
  styleUrls: ['./add-update-donor-master-codes.scss']
})
export class AddUpdateDonorMasterCodes implements OnInit {
  dialogTitle: string;
  mode: 'add' | 'edit' = 'add';
  isSaving = false;
  form!: FormGroup;
  minDate: moment.Moment;
  modificationDate: Date | null = null;

  saveRequest = new Subject<CodeDialogResult>();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
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
    public dialogRef: MatDialogRef<AddUpdateDonorMasterCodes>,
    @Inject(MAT_DIALOG_DATA) public data: MasterCodeDialogData
  ) {
    this.mode = data.mode;
    this.dialogTitle = data.mode === 'add' ? 'Add New Code Type' : 'Edit Code Type';
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.modificationDate = data.modificationDate ? new Date(data.modificationDate) : null;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      codeType: [
        '',
        [
          Validators.required,
          requiredTrimmedValidator(),
          trimmedMaxLengthValidator(5),
          Validators.pattern(/^[a-zA-Z0-9]+$/)
        ]
      ],
      code: [
        '',
        (this.mode === 'add' && this.data.codeType) ? [
          requiredTrimmedValidator(),
          trimmedMaxLengthValidator(5),
          Validators.pattern(/^[a-zA-Z0-9]+$/)
        ] : []
      ],
      description: ['', [Validators.required, requiredTrimmedValidator(), trimmedMaxLengthValidator(240)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null],
      sequence1: [0],
      sequence2: [0],
      sequence3: [0],
      numericalValue: [0]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    if (this.mode === 'edit' && this.data) {
      this.form.patchValue({
        codeType: this.data.codeType || '',
        code: this.data.code || '',
        description: this.data.description || '',
        effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.headerService.chapterTimeZone());
      // Override termination date validators to include past date validation in edit mode
      this.setupTerminationDateValidatorsForEdit();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

      if (this.data.codeType) {
        this.form.patchValue({ codeType: this.data.codeType });
        this.form.get('codeType')?.disable();
      }
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

    const result: CodeDialogResult = {
      codeType: formValue.codeType,
      code: formValue.code || '',
      description: formValue.description,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
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

  getCodeTypeError(): string {
    const control = this.form.get('codeType');
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return 'Code Type is required';
    }

    if (control.hasError('trimmedMaxLength')) {
      return 'Code Type cannot exceed 5 characters';
    }

    if (control.hasError('pattern')) {
      return 'Code Type must be alphanumeric (special characters are not allowed)';
    }

    return '';
  }

  getCodeError(): string {
    const control = this.form.get('code');
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return 'Code is required';
    }

    if (control.hasError('trimmedMaxLength')) {
      return 'Code cannot exceed 5 characters';
    }

    if (control.hasError('pattern')) {
      return 'Code must be alphanumeric (special characters are not allowed)';
    }

    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return 'Description is required';
    }

    if (control.hasError('trimmedMaxLength')) {
      return 'Description cannot exceed 240 characters';
    }

    return '';
  }

  /** Format effective date for display in edit mode */
  get editEffectiveDateDisplay(): string {
    if (!this.data?.effDate) return '-';
    return DateFieldValidationUtility.formatDateForUI(moment(this.data.effDate))?.toUpperCase() || '-';
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

  formatDate(date: Date | null): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  get descriptionRemainingChars(): number {
    const description = this.form.get('description')?.value || '';
    return 240 - description.length;
  }

  onCodeTypeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const newValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (value !== newValue) {
      this.form.patchValue({ codeType: newValue }, { emitEvent: false });
      input.value = newValue;
    }
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const newValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (value !== newValue) {
      this.form.patchValue({ code: newValue }, { emitEvent: false });
      input.value = newValue;
    }
  }
}
