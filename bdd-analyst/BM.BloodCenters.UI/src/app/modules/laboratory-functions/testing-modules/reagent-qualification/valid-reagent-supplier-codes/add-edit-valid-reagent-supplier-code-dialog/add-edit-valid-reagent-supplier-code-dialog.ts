import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { ValidReagentSupplierCodeService } from '../services/valid-reagent-supplier-code.service';
import {
  ValidReagentSupplierCode,
  CreateValidReagentSupplierCodeDto,
  UpdateValidReagentSupplierCodeDto
} from '../models/valid-reagent-supplier-code.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-add-edit-valid-reagent-supplier-code-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSnackBarModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-valid-reagent-supplier-code-dialog.html',
  styleUrls: ['./add-edit-valid-reagent-supplier-code-dialog.scss']
})
export class AddEditValidReagentSupplierCodeDialog implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidReagentSupplierCode | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<boolean>(); // boolean = true means "add another"
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  saving = false;

  form!: FormGroup;

  // Date validation - initialized in constructor
  minDate!: moment.Moment;
  terminationMinDate!: moment.Moment;

  private originalEffDate: string | null = null;
  private originalTermDate: string | null = null;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError() || '');
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError() || '');

  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = date.clone().startOf('day');
    const today = this.minDate.clone().startOf('day');

    if (this.mode === 'edit' && this.originalEffDate) {
      const originalDay = moment(this.originalEffDate).startOf('day');
      if (checkDate.isSame(originalDay)) {
        return true;
      }
    }

    return !checkDate.isBefore(today);
  };

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = date.clone().startOf('day');
    const today = this.minDate.clone().startOf('day');

    // Allow original term date in edit mode even if past
    if (this.mode === 'edit' && this.originalTermDate) {
      const originalDay = moment(this.originalTermDate).startOf('day');
      if (checkDate.isSame(originalDay)) {
        return true;
      }
    }

    // Both modes: termination date must be >= today
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Both modes: termination date must be >= effective date
    const eff = this.form?.get('effDate')?.value;
    if (eff && eff.isValid && eff.isValid()) {
      const effDay = eff.clone().startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private destroy$ = new Subject<void>();

  get isAddMode(): boolean {
    return this.mode === 'add';
  }

  get dialogTitle(): string {
    return this.isAddMode ? 'Add New Code' : 'Edit Record';
  }

  get lastModified(): string {
    if (!this.data || !this.data.lastModifyDate) return '';
    const formatted = DateFieldValidationUtility.formatDateTimeForUI(this.data.lastModifyDate);
    return formatted ? `Last Modified: ${formatted} PST` : '';
  }

  constructor(
    private fb: FormBuilder,
    private service: ValidReagentSupplierCodeService,
    private snackBar: MatSnackBar,
    private dateAdapter: DateAdapter<Moment>,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize date validators
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.terminationMinDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mode'] || changes['data']) && !changes['mode']?.firstChange) {
      this.initializeForm();
      this.setupFormListeners();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const formData = this.data;

    this.form = this.fb.group({
      supplierCode: [
        formData?.supplierCode || '',
        [Validators.required, Validators.maxLength(5)]
      ],
      supplierName: [
        formData?.supplierName || '',
        [Validators.required, Validators.maxLength(50)]
      ],
      effDate: [
        formData?.effDate ? moment(formData.effDate) : null,
        [Validators.required]
      ],
      termDate: [
        formData?.termDate ? moment(formData.termDate) : null
      ]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    if (this.mode === 'add') {
      this.originalEffDate = null;
      this.originalTermDate = null;
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      this.originalEffDate = formData?.effDate
        ? moment(formData.effDate).format('YYYY-MM-DD')
        : null;
      this.originalTermDate = formData?.termDate
        ? moment(formData.termDate).format('YYYY-MM-DD')
        : null;

      const effDateControl = this.form.get('effDate');
      if (effDateControl) {
        effDateControl.clearValidators();
        effDateControl.setValidators([
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          this.editModeEffectiveDateValidator()
        ]);
        effDateControl.updateValueAndValidity();
      }

      const termDateControl = this.form.get('termDate');
      if (termDateControl) {
        termDateControl.clearValidators();
        termDateControl.setValidators([
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          this.editModeTerminationDateValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    }

    // Mark form as pristine after initialization
    // This allows reset() to revert to these initial values
    this.form.markAsPristine();
  }

  private setupFormListeners(): void {
    // Unsubscribe from any existing subscriptions before setting up new ones
    this.destroy$.next();

    // Track which date field was last changed
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();

        // Re-validate termination date when effective date changes
        const termDateControl = this.form.get('termDate');
        if (termDateControl && termDateControl.value) {
          termDateControl.updateValueAndValidity({ emitEvent: false });
        }
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });

    // Auto-uppercase supplier code
    this.form.get('supplierCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && typeof value === 'string') {
          const uppercased = value.toUpperCase();
          if (uppercased !== value) {
            this.form.get('supplierCode')?.setValue(uppercased, { emitEvent: false });
          }
        }
      });
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effDate')?.value;

    if (effectiveValue && effectiveValue.isValid && effectiveValue.isValid()) {
      // If effective date is after the global minDate, use effective date as min
      // Otherwise, use the global minDate
      // This works for both Add and Edit mode because:
      // - Add mode: minDate = today, so it becomes max(today, effective)
      // - Edit mode: minDate = 01-JAN-1753, so it becomes effective date
      this.terminationMinDate = effectiveValue.isAfter(this.minDate)
        ? effectiveValue.clone()
        : this.minDate.clone();
    } else {
      // If no valid effective date, reset to global minDate
      this.terminationMinDate = this.minDate.clone();
    }

    // Re-validate termination date when effective date changes
    const termDateControl = this.form.get('termDate');
    if (termDateControl && termDateControl.value) {
      termDateControl.updateValueAndValidity({ emitEvent: false });
    }

    // Trigger change detection to update the date picker min constraint
    this.cdr.markForCheck();
  }

  /** Get effective date error message */
  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  /** Get termination date error message */
  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  /**
   * Handle effective date input for validation
   */
  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  /**
   * Handle termination date input for validation
   */
  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.mode === 'edit'
    );
  }

  private editModeEffectiveDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const selectedDate = moment.isMoment(value) ? value : moment(value);
      if (!selectedDate.isValid()) return null;

      const selectedDateStr = selectedDate.format('YYYY-MM-DD');

      if (this.originalEffDate && selectedDateStr === this.originalEffDate) {
        return null;
      }

      const today = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
      if (selectedDateStr < today.format('YYYY-MM-DD')) {
        return { effectiveDatePast: true };
      }

      return null;
    };
  }

  private editModeTerminationDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const selectedDate = moment.isMoment(value) ? value : moment(value);
      if (!selectedDate.isValid()) return null;

      const selectedDateStr = selectedDate.format('YYYY-MM-DD');

      if (this.originalTermDate && selectedDateStr === this.originalTermDate) {
        return null;
      }

      const today = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
      if (selectedDateStr < today.format('YYYY-MM-DD')) {
        return { terminationDatePast: true };
      }

      return null;
    };
  }

  onSave(addAnother: boolean = false): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    // Default to showing cross-field error on Effective Date if no field was changed yet
    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      return;
    }

    // Check for cross-field date validation errors
    if (this.form.hasError('dateRangeInvalid')) {
      this.form.get('termDate')?.markAsTouched();
      return;
    }

    this.saving = true;

    const formValue = this.form.getRawValue();

    // Convert dates to YYYY-MM-DD format for API
    const effDate = DateFieldValidationUtility.serializeDateForApi(formValue.effDate);
    const termDate = DateFieldValidationUtility.serializeDateForApi(formValue.termDate);

    if (this.isAddMode) {
      const dto: CreateValidReagentSupplierCodeDto = {
        supplierCode: formValue.supplierCode,
        supplierName: formValue.supplierName,
        effDate: effDate!,
        termDate: termDate
      };

      this.service.create(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            // Check if backend returned success: false
            if (response?.success === false) {
              const errorCode = response?.errorResponse?.errorCode;
              const errorMessage = response?.errorResponse?.error || response?.message || 'Failed to create record';
              const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;

              this.snackBar.open(displayMessage, 'DISMISS', {
                duration: 7000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              });
              this.saving = false;
              return;
            }

            // Show success message - always use custom message instead of backend message
            this.snackBar.open('New Code has been Saved successfully', 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });

            this.saving = false;

            if (addAnother) {
              // Emit saveSuccess with true to indicate "add another" (don't close panel)
              this.saveSuccess.emit(true);
              // Reset form for adding another record
              this.resetFormForAddMode();
            } else {
              // Emit saveSuccess with false to indicate regular save (close panel)
              this.saveSuccess.emit(false);
            }
          },
          error: (error) => {
            this.saving = false;
            this.handleError(error);
          }
        });
    } else {
      const dto: UpdateValidReagentSupplierCodeDto = {
        supplierCode: formValue.supplierCode,
        supplierName: formValue.supplierName,
        effDate: effDate!,
        termDate: termDate
      };

      // Use original supplier code from data as the identifier (URL param)
      this.service.update(this.data!.supplierCode, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            // Check if backend returned success: false
            if (response?.success === false) {
              const errorCode = response?.errorResponse?.errorCode;
              const errorMessage = response?.errorResponse?.error || response?.message || 'Failed to update record';
              const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;

              this.snackBar.open(displayMessage, 'DISMISS', {
                duration: 7000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              });
              this.saving = false;
              return;
            }

            // Show success message - always use custom message instead of backend message
            this.snackBar.open('Changes has been saved successfully', 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });

            this.saving = false;
            this.saveSuccess.emit(false);
          },
          error: (error) => {
            this.saving = false;
            this.handleError(error);
          }
        });
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onAddAndCreateAnother(): void {
    this.onSave(true);
  }

  private resetFormForAddMode(): void {
    // Clear all form values
    this.form.reset();

    // Reset form validation state
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Reset all individual control states
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.setErrors(null);
      control?.markAsUntouched();
      control?.markAsPristine();
    });

    // Reset last changed field tracker
    this.lastChangedDateField = null;

    // Reset termination min date to global min date
    this.terminationMinDate = this.minDate.clone();

    // Trigger change detection
    this.cdr.markForCheck();
  }

  onClearAll(): void {
    if (this.isAddMode) {
      // Add mode - clear all fields to empty
      this.form.reset();
    } else {
      // Edit mode - reset all fields to their original values
      this.form.patchValue({
        supplierCode: this.data?.supplierCode || '',
        supplierName: '',
        effDate: null,
        termDate: null
      });
    }

    // Reset form validation state for all controls
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.setErrors(null);
      control?.markAsUntouched();
      control?.markAsPristine();
    });

    // Reset last changed field tracker
    this.lastChangedDateField = null;

    // Reset termination min date to global min date
    this.terminationMinDate = this.minDate.clone();

    // Trigger change detection to update the view
    this.cdr.markForCheck();
  }

  private handleError(error: any): void {
    console.error('Error saving valid reagent supplier code:', error);

    const errorResponse = error?.error?.errorResponse || error?.error;
    const errorCode = errorResponse?.errorCode || '';
    const errorMessage = errorResponse?.error || error?.error?.message || error?.message || 'An error occurred while saving';

    const displayMessage = errorCode
      ? `Error ${errorCode}: ${errorMessage}`
      : errorMessage;

    this.snackBar.open(displayMessage, 'DISMISS', {
      duration: 7000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
