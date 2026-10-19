import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AddUpdateDialogData, ProcedureCodeCreateRequest } from '../models/procedure-code.model';
import { ProcedureCodeApiService } from '../services/procedure-code-api.service';

@Component({
  selector: 'app-add-update-procedure-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-update-procedure-code.html',
  styleUrls: ['./add-update-procedure-code.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class AddUpdateProcedureCodeComponent implements OnInit, OnDestroy {
  dialogTitle: string;
  isEditMode: boolean;
  form: FormGroup;
  isSubmitting = false;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private destroy$ = new Subject<void>();

  // Date constraints
  minDate: moment.Moment;

  // Error state matchers for showing form-level errors
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

  constructor(
    private fb: FormBuilder,
    private headerService: HeaderService,
    private snackbarService: SnackbarService,
    private apiService: ProcedureCodeApiService,
    public dialogRef: MatDialogRef<AddUpdateProcedureCodeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddUpdateDialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.dialogTitle = this.isEditMode ? 'Edit Procedure Code' : 'Add Procedure Code';
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

    // Initialize form with cross-field date range validator
    this.form = this.fb.group({
      procedureCode: ['', [Validators.required, Validators.maxLength(5)]],
      description: ['', [Validators.required, Validators.maxLength(50)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null],
      deferralDays: [null, [Validators.required, Validators.min(0)]],
      achievementCredits: [null, [Validators.required, Validators.min(0)]],
      procedureDuration: [null, [Validators.min(1)]],
      sequence: [null, [Validators.required, Validators.min(1)]],
      standardRbcLoss: [0, [Validators.min(0)]],
      standardPlasmaLoss: [0, [Validators.min(0)]],
      extracorporealRbcLoss: [0, [Validators.min(0)]],
      extracorporealPlasmaLoss: [0, [Validators.min(0)]],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  ngOnInit(): void {
    this.setupModeValidators();

    if (this.isEditMode && this.data) {
      this.populateFormForEdit();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupModeValidators(): void {
    if (this.isEditMode) {
      DateFieldValidationUtility.setupEditModeValidators(this.form);

      // Add termination date past validator for edit mode
      const termControl = this.form.get('terminationDate');
      if (termControl) {
        termControl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone()));
        termControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }
  }

  private populateFormForEdit(): void {
    this.form.patchValue({
      procedureCode: this.data.procedureCode || '',
      description: this.data.description || '',
      effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
      terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null,
      deferralDays: this.data.deferralDays ?? null,
      achievementCredits: this.data.achievementCredits ?? null,
      procedureDuration: this.data.procedureDuration ?? null,
      sequence: this.data.sequence ?? null,
      standardRbcLoss: this.data.standardRbcLoss ?? 0,
      standardPlasmaLoss: this.data.standardPlasmaLoss ?? 0,
      extracorporealRbcLoss: this.data.extracorporealRbcLoss ?? 0,
      extracorporealPlasmaLoss: this.data.extracorporealPlasmaLoss ?? 0,
    }, { emitEvent: false });
  }

  /** Format effective date for display in edit mode */
  get editEffectiveDateDisplay(): string {
    const effDate = this.form?.get('effectiveDate')?.value;
    if (!effDate) return '-';
    return DateFieldValidationUtility.formatDateForUI(effDate)?.toUpperCase() || '-';
  }

  // Error message getters
  getProcedureCodeError(): string {
    const control = this.form.get('procedureCode');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Procedure code is required';
    if (control.hasError('maxlength')) return 'Procedure code must be at most 5 characters';
    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Description is required';
    if (control.hasError('maxlength')) return 'Description must be at most 50 characters';
    return '';
  }

  getSequenceError(): string {
    const control = this.form.get('sequence');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Sequence is required';
    if (control.hasError('min')) return 'Sequence must be greater than 0';
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

  getDeferralDaysError(): string {
    const control = this.form.get('deferralDays');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Deferral days is required';
    if (control.hasError('min')) return 'Must be 0 or greater';
    return '';
  }

  getAchievementCreditsError(): string {
    const control = this.form.get('achievementCredits');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Achievement credits is required';
    if (control.hasError('min')) return 'Must be 0 or greater';
    return '';
  }

  getProcedureDurationError(): string {
    const control = this.form.get('procedureDuration');
    if (!control || !control.touched) return '';
    if (control.hasError('min')) return 'Procedure duration must be greater than 0';
    return '';
  }

  getStandardRbcLossError(): string {
    const control = this.form.get('standardRbcLoss');
    if (!control || !control.touched) return '';
    if (control.hasError('min')) return 'Must be 0 or greater';
    return '';
  }

  getStandardPlasmaLossError(): string {
    const control = this.form.get('standardPlasmaLoss');
    if (!control || !control.touched) return '';
    if (control.hasError('min')) return 'Must be 0 or greater';
    return '';
  }

  getExtracorporealRbcLossError(): string {
    const control = this.form.get('extracorporealRbcLoss');
    if (!control || !control.touched) return '';
    if (control.hasError('min')) return 'Must be 0 or greater';
    return '';
  }

  getExtracorporealPlasmaLossError(): string {
    const control = this.form.get('extracorporealPlasmaLoss');
    if (!control || !control.touched) return '';
    if (control.hasError('min')) return 'Must be 0 or greater';
    return '';
  }

  // Input handlers for date fields
  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.isEditMode
    );
  }

  // Prevent invalid characters in numeric fields (e, E, +, -, .)
  onNumericKeydown(event: KeyboardEvent): void {
    const invalidChars = ['e', 'E', '+', '-', '.'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
    }
  }

  // Prevent exceeding max digits for numeric fields
  onNumericInput(event: Event, maxDigits: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remove leading zeros and non-numeric characters except for empty string
    if (value && value !== '0') {
      let numericValue = value.replace(/\D/g, '');
      // Strip leading zeros
      numericValue = numericValue.replace(/^0+/, '') || '0';
      if (numericValue !== '0' && numericValue.length > maxDigits) {
        input.value = numericValue.substring(0, maxDigits);
        // Trigger change detection
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
      } else {
        input.value = numericValue;
      }
    }
  }

  onDescriptionInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const trimmed = input.value.replace(/^\s+/, '');
    if (trimmed !== input.value) {
      input.value = trimmed;
      this.form.get('description')?.setValue(trimmed, { emitEvent: false });
    }
  }

  // Allow only alphanumeric characters in procedure code
  onProcedureCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/[^A-Za-z0-9]/g, '');
    if (cleaned !== input.value) {
      input.value = cleaned;
      this.form.get('procedureCode')?.setValue(cleaned);
    }
  }

  get isFormValid(): boolean {
    if (this.isEditMode && !this.form.dirty) {
      return false;
    }

    if (this.isEditMode) {
      // For edit mode, check for visible errors (matches warehouse pattern)
      const hasVisibleErrors =
        this.getEffectiveDateError() !== '' ||
        this.getTerminationDateError() !== '';
      return !hasVisibleErrors;
    }

    // Add mode: use standard form validation
    // Check terminationDate for real errors (not just 'required' since it's optional)
    const termControl = this.form.get('terminationDate');
    const termHasRealError = termControl &&
      (termControl.hasError('invalidDate') ||
       termControl.hasError('invalidDateFormat') ||
       termControl.hasError('matDatepickerParse'));

    if (termHasRealError) {
      return false;
    }

    // Check for cross-field date range errors
    if (this.form.hasError('dateRangeInvalid')) {
      return false;
    }

    // Check validity of other controls (exclude termination date errors from form.valid check)
    const otherControlsValid = Object.keys(this.form.controls)
      .filter(key => key !== 'terminationDate')
      .every(key => {
        const control = this.form.get(key);
        return !control || control.disabled || control.valid;
      });

    return otherControlsValid;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // In edit mode, only mark termination date as touched if user actually touched it
    const termControl = this.form.get('terminationDate');
    const termWasTouched = this.isEditMode && termControl ? termControl.touched : false;

    this.form.markAllAsTouched();

    // In edit mode, restore untouched state for termination date if user didn't touch it
    if (this.isEditMode && !termWasTouched && termControl) {
      termControl.markAsUntouched();
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.isEditMode) {
      // For edit mode: check for visible errors (matches warehouse pattern)
      const hasVisibleErrors =
        this.getEffectiveDateError() !== '' ||
        this.getTerminationDateError() !== '';

      if (hasVisibleErrors) {
        return;
      }
    } else {
      // For add mode: use standard form validation
      if (this.form.invalid || this.form.hasError('dateRangeInvalid')) {
        return;
      }
    }

    this.isSubmitting = true;
    const formValue = this.form.getRawValue();

    if (this.isEditMode) {
      // For UPDATE - exclude procedureCode, description, and effDate (immutable)
      const updateRequest = {
        duration: formValue.deferralDays || 0,
        creditCount: formValue.achievementCredits || 0,
        schViewInterval: formValue.procedureDuration,
        sortSequence: formValue.sequence || 0,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
        standardRbcLoss: formValue.standardRbcLoss || 0,
        standardPlasmaLoss: formValue.standardPlasmaLoss || 0,
        ecvRbcLoss: formValue.extracorporealRbcLoss || 0,
        ecvPlasmaLoss: formValue.extracorporealPlasmaLoss || 0,
      };

      this.apiService.updateProcedureCode(this.data.procedureCode!, updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.snackbarService.showSuccess(response.message || `Procedure code "${this.data.procedureCode}" updated successfully`);
            this.dialogRef.close({ success: true });
          },
          error: () => {
            this.isSubmitting = false;
          }
        });
    } else {
      // For CREATE - include all fields
      const createRequest: ProcedureCodeCreateRequest = {
        procedureCode: formValue.procedureCode.trim(),
        description: formValue.description?.trim() || '',
        duration: formValue.deferralDays || 0,
        creditCount: formValue.achievementCredits || 0,
        schViewInterval: formValue.procedureDuration,
        sortSequence: formValue.sequence || 0,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
        standardRbcLoss: formValue.standardRbcLoss || 0,
        standardPlasmaLoss: formValue.standardPlasmaLoss || 0,
        ecvRbcLoss: formValue.extracorporealRbcLoss || 0,
        ecvPlasmaLoss: formValue.extracorporealPlasmaLoss || 0,
      };

      this.apiService.createProcedureCode(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.snackbarService.showSuccess(response.message || `Procedure code "${createRequest.procedureCode}" created successfully`);
            this.dialogRef.close({ success: true });
          },
          error: () => {
            this.isSubmitting = false;
          }
        });
    }
  }
}
