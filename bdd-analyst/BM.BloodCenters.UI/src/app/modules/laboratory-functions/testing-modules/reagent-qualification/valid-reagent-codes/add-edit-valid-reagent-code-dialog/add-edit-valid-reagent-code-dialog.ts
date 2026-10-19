import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  HostListener,
  signal,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import moment, { Moment } from 'moment';

import { ValidReagentCodeService } from '../services/valid-reagent-code.service';
import {
  ValidReagentCode,
  CreateValidReagentCodeDto,
  UpdateValidReagentCodeDto,
  ReagentTypeLov,
  ControlFlagLov,
  PreparationFlagLov
} from '../models/valid-reagent-code.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-add-edit-valid-reagent-code-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSnackBarModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-valid-reagent-code-dialog.html',
  styleUrls: ['./add-edit-valid-reagent-code-dialog.scss']
})
export class AddEditValidReagentCodeDialog implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidReagentCode | null = null;
  @Input() testId!: string; // Required for add mode
  @Input() testDesc!: string; // For display

  @Output() close = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<boolean>(); // boolean = true means "add another"
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  saving = false;
  savingAddAnother = false;

  form!: FormGroup;
  isLoadingDropdowns = signal(false);

  // Dropdown options from API
  reagentTypes: ReagentTypeLov[] = [];
  controlFlags: ControlFlagLov[] = [];
  preparationFlags: PreparationFlagLov[] = [];

  // Static dropdown options
  yesNoOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  // Date validation - initialized in constructor
  minDate!: moment.Moment;
  terminationMinDate!: moment.Moment;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError() || '');
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError() || '');

  /** Effective date filter: Cannot select dates before chapter's local date (today) in both Add and Edit modes */
  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    // Both Add and Edit mode: not before chapter's local date (today)
    // FMB VALIDATE_FIELD shows error 2312 if :eff_date <= (trunc(v_sysdate) -1)
    const checkDate = date.clone().startOf('day');
    const today = this.minDate.clone().startOf('day');
    return !checkDate.isBefore(today);
  };

  /** Termination date filter: not before effective date and not before today */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = date.clone().startOf('day');

    // FMB: term_date < trunc(v_sysdate) shows error 3115 with no edit-mode exception
    const today = this.minDate.clone().startOf('day');
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Both Add and Edit mode: termination date must be >= effective date
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
    private service: ValidReagentCodeService,
    private snackBar: MatSnackBar,
    private dateAdapter: DateAdapter<Moment>,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize date validators
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.terminationMinDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  @HostListener('keydown.escape')
  onEscapeKey(): void {
    this.onCancel();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownOptions();
    this.setupFormListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mode'] || changes['data']) && !changes['mode']?.firstChange) {
      this.initializeForm();
      this.loadDropdownOptions();
      this.setupFormListeners();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load dropdown options from API
   */
  private loadDropdownOptions(): void {
    this.isLoadingDropdowns.set(true);

    forkJoin({
      reagentTypes: this.service.getReagentTypesLov(),
      controlFlags: this.service.getControlFlagsLov(),
      preparationFlags: this.service.getPreparationFlagsLov()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.reagentTypes = result.reagentTypes;
          this.controlFlags = result.controlFlags;
          this.preparationFlags = result.preparationFlags;
          this.isLoadingDropdowns.set(false);
        },
        error: (error) => {
          console.error('Error loading dropdown options:', error);
          this.isLoadingDropdowns.set(false);
        }
      });
  }

  private initializeForm(): void {
    const isEdit = this.mode === 'edit';
    const formData = this.data;

    // Check if effective date is in the past (< chapter local date)
    const today = this.minDate.clone().startOf('day');
    const existingEffDate = formData?.effDate ? moment(formData.effDate).startOf('day') : null;
    const isEffDateInPast = isEdit && existingEffDate && existingEffDate.isBefore(today);

    this.form = this.fb.group({
      reagentType: [
        formData?.reagentType || '',
        [Validators.required]
      ],
      controlFlag: [
        { value: formData?.controlFlag || '', disabled: formData?.reagentType !== 'C' }
      ],
      reagentCode: [
        { value: formData?.reagentCode || '', disabled: isEdit },
        [Validators.required, Validators.maxLength(5)]
      ],
      reagentName: [
        formData?.reagentName || '',
        [Validators.required, Validators.maxLength(50)]
      ],
      masterLotRequired: [
        formData?.masterLotRequired || '',
        [Validators.required]
      ],
      effDate: [
        { value: formData?.effDate ? moment(formData.effDate) : null, disabled: isEffDateInPast },
        [Validators.required]
      ],
      termDate: [
        formData?.termDate ? moment(formData.termDate) : null
      ],
      preparationFlag: [
        formData?.preparationFlag || '',
        [Validators.required]
      ],
      prequalificationFlag: [
        formData?.prequalificationFlag || '',
        [Validators.required]
      ]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    // Always set up validators for both dates
    // FMB: eff_date past-date check has edit-mode exception (field disabled), term_date does not
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

    // Re-disable effDate if it was in the past — setupAddModeValidators re-enables it
    if (isEffDateInPast) {
      this.form.get('effDate')?.disable();
    }

    // Mark form as pristine after initialization
    // This allows reset() to revert to these initial values
    this.form.markAsPristine();
  }

  private setupFormListeners(): void {
    // Unsubscribe from any existing subscriptions before setting up new ones
    this.destroy$.next();

    // Enable/disable Control Flag based on Reagent Type
    this.form.get('reagentType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((reagentType) => {
        const controlFlagControl = this.form.get('controlFlag');
        if (reagentType === 'C') {
          controlFlagControl?.setValidators([Validators.required]);
          controlFlagControl?.enable();
        } else {
          controlFlagControl?.clearValidators();
          controlFlagControl?.setValue('');
          controlFlagControl?.disable();
        }
        controlFlagControl?.updateValueAndValidity();
      });

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

    // Auto-uppercase reagent code
    this.form.get('reagentCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && typeof value === 'string') {
          const uppercased = value.toUpperCase();
          if (uppercased !== value) {
            this.form.get('reagentCode')?.setValue(uppercased, { emitEvent: false });
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
   * Handle reagent code input - strip invalid characters and uppercase
   */
  onReagentCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (sanitized !== input.value) {
      input.value = sanitized;
    }
    this.form.get('reagentCode')?.setValue(sanitized, { emitEvent: false });
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

    // Set the appropriate saving flag based on which button was clicked
    if (addAnother) {
      this.savingAddAnother = true;
    } else {
      this.saving = true;
    }

    const formValue = this.form.getRawValue();

    // Convert dates to YYYY-MM-DD format for API
    const effDate = DateFieldValidationUtility.serializeDateForApi(formValue.effDate);
    const termDate = DateFieldValidationUtility.serializeDateForApi(formValue.termDate);

    if (this.isAddMode) {
      const dto: CreateValidReagentCodeDto = {
        testId: this.testId,
        reagentType: formValue.reagentType,
        controlFlag: formValue.controlFlag || null,
        reagentCode: formValue.reagentCode.toUpperCase(),
        reagentName: formValue.reagentName,
        masterLotRequired: formValue.masterLotRequired,
        effDate: effDate!,
        termDate: termDate,
        preparationFlag: formValue.preparationFlag,
        prequalificationFlag: formValue.prequalificationFlag
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
            this.savingAddAnother = false;
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
            this.savingAddAnother = false;

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
            this.savingAddAnother = false;
            this.handleError(error);
          }
        });
    } else {
      const dto: UpdateValidReagentCodeDto = {
        reagentType: formValue.reagentType,
        controlFlag: formValue.controlFlag || null,
        reagentName: formValue.reagentName,
        masterLotRequired: formValue.masterLotRequired,
        effDate: effDate!,
        termDate: termDate,
        preparationFlag: formValue.preparationFlag,
        prequalificationFlag: formValue.prequalificationFlag
      };

      this.service.update(this.testId, formValue.reagentCode, dto)
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
            this.savingAddAnother = false;
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
            this.savingAddAnother = false;
            this.saveSuccess.emit(false);
          },
          error: (error) => {
            this.saving = false;
            this.savingAddAnother = false;
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

    // Re-enable reagent code field (in case it was disabled)
    this.form.get('reagentCode')?.enable();

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
      // Edit mode - clear editable fields only, keep readonly/disabled fields
      // Keep reagentCode (always disabled in edit mode)
      // Keep effDate if it's disabled (when it's in the past)
      const effDateControl = this.form.get('effDate');
      const keepEffDate = effDateControl?.disabled;

      this.form.patchValue({
        reagentType: '',
        controlFlag: '',
        reagentName: '',
        masterLotRequired: '',
        effDate: keepEffDate ? effDateControl?.value : null,
        termDate: null,
        preparationFlag: '',
        prequalificationFlag: ''
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
    console.error('Error saving valid reagent code:', error);

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
