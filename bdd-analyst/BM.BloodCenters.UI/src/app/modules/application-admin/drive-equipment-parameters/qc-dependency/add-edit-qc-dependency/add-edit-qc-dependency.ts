import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { QcDependencyCreateDto, QcDependencyUpdateDto } from '../../models/drive-equipment-parameters.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from '@core/utils/date-adapter.util';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

/**
 * Add/Edit QC Dependency Side Panel Component
 * Side panel for creating and editing QC dependency records
 */
@Component({
  selector: 'app-add-edit-qc-dependency',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-qc-dependency.html',
  styleUrls: ['./add-edit-qc-dependency.scss']
})
export class AddEditQcDependency implements OnInit, OnDestroy {
  @Input() mode!: 'add' | 'edit';
  @Input() data: any;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form!: FormGroup;
  minDate: moment.Moment;
  // Minimum date for termination date picker (set to past date in Edit mode if applicable)
  minTermDate: moment.Moment;
  chapterToday: moment.Moment; // Current chapter date for calendar display

  // Store existing records for duplicate validation
  private existingRecords: any[] = [];
  // Error state matchers for mat-form-field error display
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Store edit mode values to allow original past dates in Edit mode
  private editModeValues: {
    effectiveDate: string | null;
    terminationDate: string | null;
  } = {
    effectiveDate: null,
    terminationDate: null
  };

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private driveEquipmentService: DriveEquipmentParametersService,
    private headerService: HeaderService
  ) {
    this.minDate = this.getChapterMinDate();
    this.minTermDate = this.getChapterMinDate();
    this.chapterToday = this.getChapterMinDate();

    effect(() => {
      this.minDate = this.getChapterMinDate();
      // Don't reset minTermDate here - it's set conditionally in ngOnInit based on mode
      this.chapterToday = this.getChapterMinDate();
    });
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  private getChapterMinDate(): moment.Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  // Search controls for ngx-mat-select-search
  readonly sourceParamCodeSearchCtrl = new FormControl('');
  readonly dependentCodeSearchCtrl = new FormControl('');

  // Search signals
  private readonly sourceParamCodeSearch = signal('');
  private readonly dependentCodeSearch = signal('');

  // State signals
  private isSubmitting = signal<boolean>(false);
  private sourceParamCodeOptions = signal<any[]>([]);
  private dependentCodeOptions = signal<any[]>([]);

  // Computed values
  submitting = computed(() => this.isSubmitting());
  title = computed(() => this.mode === 'add' ? 'Add New QC Dependency' : 'Edit QC Dependency');

  get isSaveButtonDisabled(): boolean {
    return this.form.invalid || this.form.pristine || this.submitting();
  }

  // Filtered dropdown options (searchable)
  filteredSourceParamCodes = computed(() => {
    const search = this.sourceParamCodeSearch().toLowerCase();
    const items = this.sourceParamCodeOptions();
    if (!search) return items;
    return items.filter(c => c.code?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
  });

  filteredDependentCodes = computed(() => {
    const search = this.dependentCodeSearch().toLowerCase();
    const items = this.dependentCodeOptions();
    if (!search) return items;
    return items.filter(c => c.code?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
  });

  ngOnInit(): void {
    if (!this.mode) {
      this.mode = this.data?.mode || 'add';
    }
    const record = this.data?.record || {};

    // Extract existing records for duplicate validation in add mode
    if (this.mode === 'add' && this.data?.existingRecords) {
      this.existingRecords = this.data.existingRecords;
    }

    // CRITICAL: Set minTermDate BEFORE creating form to prevent Material validation errors
    if (this.mode === 'edit') {
      // Store original dates to allow them even if they're in the past
      this.editModeValues.effectiveDate = record.effectiveDate
        ? moment(record.effectiveDate).format('YYYY-MM-DD')
        : null;
      this.editModeValues.terminationDate = record.terminationDate
        ? moment(record.terminationDate).format('YYYY-MM-DD')
        : null;

      // Set minTermDate for edit mode: allow existing past termination date
      if (record.effectiveDate) {
        const eff = moment(record.effectiveDate);
        if (record.terminationDate) {
          const existingTermDate = moment(record.terminationDate);
          // Set min to the lesser of effective date and existing termination date
          // This allows the existing value to load without error
          this.minTermDate = existingTermDate.isBefore(eff) ? existingTermDate : eff;
        } else {
          this.minTermDate = eff;  // No existing termination date - enforce >= effective
        }
      }

      // Set chapterToday for calendar display - always show current chapter month
      this.chapterToday = this.getChapterMinDate();
    }

    this.form = this.fb.group({
      deviceType: [{ value: record.deviceType || this.data?.deviceType || '', disabled: this.mode === 'edit' }, [Validators.required]],
      equipmentSupplyCode: [{ value: record.equipmentSupplyCode || this.data?.equipmentSupplyCode || '', disabled: this.mode === 'edit' }, [Validators.required]],
      sourceParamCode: [record.sourceParamCode || '', [Validators.required]],
      sourceParamDescription: [{ value: record.sourceParamDescription || '', disabled: true }],
      dependentCode: [record.dependentCode || '', [Validators.required]],
      dependentDescription: [{ value: record.dependentDescription || '', disabled: true }],
      effectiveDate: [record.effectiveDate ? moment(record.effectiveDate) : null],
      terminationDate: [record.terminationDate ? moment(record.terminationDate) : null],
      auditKey: [record.auditKey || null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });

    // Setup mode-specific validators using utility with chapter timezone
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      // Re-enable effective date (FMB allows editing EFF_DATE on existing QC Dependency records)
      const effDateControl = this.form.get('effectiveDate');
      if (effDateControl) {
        effDateControl.enable();
        effDateControl.setValidators([
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          this.editModeEffectiveDateValidator()
        ]);
        effDateControl.updateValueAndValidity({ emitEvent: false });
      }

      // Apply edit-mode-aware termination date validator
      // This allows the original past termination date but blocks manually entering NEW past dates
      // NOTE: editModeValues.terminationDate is already populated at lines 154-156 above
      // The validator captures this value in a closure at creation time
      const termControl = this.form.get('terminationDate');
      if (termControl) {
        termControl.addValidators(
          DateFieldValidationUtility.editModeTerminationDateValidator(
            this.editModeValues.terminationDate,  // Already set at line 154-156
            this.chapterOffset
          )
        );
        termControl.updateValueAndValidity({ emitEvent: false });
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    // Add duplicate validator in add mode
    if (this.mode === 'add') {
      this.addDuplicateValidators();
    }

    // Load dropdown options
    this.loadDropdownOptions();
    this.setupSearchSubscriptions();

    // Track which date field changes for cross-field validation
    this.setupDateFieldTracking();

    // Watch sourceParamCode changes to update description
    this.form.get('sourceParamCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(sourceParamCode => {
      const selectedSource = this.sourceParamCodeOptions().find(s => s.code === sourceParamCode);
      this.form.patchValue({
        sourceParamDescription: selectedSource?.description || ''
      });
    });

    // Watch dependentCode changes to update description
    this.form.get('dependentCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(dependentCode => {
      const selectedDependent = this.dependentCodeOptions().find(d => d.code === dependentCode);
      this.form.patchValue({
        dependentDescription: selectedDependent?.description || ''
      });
    });

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Track which date field was last changed for cross-field error display
   */
  private setupDateFieldTracking(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          // Only emit if date value actually changed
          if (!prev && !curr) return true;  // Both null/undefined - no change
          if (!prev || !curr) return false;  // One is null - changed
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        setTimeout(() => {
          this.lastChangedDateField = 'effective';
        }, 0);
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        setTimeout(() => {
          this.lastChangedDateField = 'termination';
        }, 0);
      });
  }

  /** Setup search subscriptions for searchable dropdowns */
  private setupSearchSubscriptions(): void {
    this.sourceParamCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.sourceParamCodeSearch.set(v || ''));
    this.dependentCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.dependentCodeSearch.set(v || ''));
  }

  /** Reset search when dropdown closes so all items show on next open */
  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  /**
   * Loads dropdown options from API
   */
  loadDropdownOptions(): void {
    // Load source parameter codes
    this.driveEquipmentService.getQcDependencySourceParamCodes().subscribe({
      next: (response) => {
        this.sourceParamCodeOptions.set(response.data);
      },
      error: () => {
        // Silent fail
      }
    });

    // Load dependent parameter codes
    this.driveEquipmentService.getQcDependencyDependentParamCodes().subscribe({
      next: (response) => {
        this.dependentCodeOptions.set(response.data);
      },
      error: () => {
        // Silent fail
      }
    });
  }

  onSave(): void {
    this.refreshChapterDates();
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      // If there's a date range error and no field has been marked as last changed,
      // default to showing the error on termination date
      if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
        this.lastChangedDateField = 'termination';
      }
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const operation$ = this.mode === 'add'
      ? this.driveEquipmentService.createQcDependency({
          deviceType: raw.deviceType,
          equipmentSupplyCode: raw.equipmentSupplyCode,
          sourceParamCode: raw.sourceParamCode,
          dependentCode: raw.dependentCode,
          effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
          terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
        } as QcDependencyCreateDto)
      : this.driveEquipmentService.updateQcDependency({
          auditKey: raw.auditKey,
          sourceParamCode: raw.sourceParamCode,
          dependentCode: raw.dependentCode,
          effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
          terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
        } as QcDependencyUpdateDto);

    operation$.subscribe({
      next: () => {
        const message = this.mode === 'add'
          ? `New dependency "${raw.sourceParamCode}" added successfully`
          : `Dependency "${raw.sourceParamCode}" updated successfully`;

        this.snackBar.open(message, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        this.saveSuccess.emit();
        this.closePanel.emit();
      },
      error: (error) => {
        this.isSubmitting.set(false);

        // Extract error message from API response
        let errorMessage = error?.error?.message;

        if (!errorMessage) {
          errorMessage = this.mode === 'add'
            ? 'Failed to create QC dependency.'
            : 'Failed to update QC dependency.';
        }

        this.snackBar.open(errorMessage, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Handles Add & Create Another action
   */
  onSaveAndCreateAnother(): void {
    this.refreshChapterDates();
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      this.snackBar.open('Please correct the highlighted errors before saving.', 'DISMISS', {
        duration: 5000
      });
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const payload: QcDependencyCreateDto = {
      deviceType: raw.deviceType,
      equipmentSupplyCode: raw.equipmentSupplyCode,
      sourceParamCode: raw.sourceParamCode,
      dependentCode: raw.dependentCode,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
    };

    this.driveEquipmentService.createQcDependency(payload).subscribe({
      next: () => {
        this.snackBar.open(`New dependency "${raw.sourceParamCode}" added successfully`, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        // Reset form for next entry - pass emitEvent: false to avoid triggering validations
        this.form.reset({
          deviceType: raw.deviceType,
          equipmentSupplyCode: raw.equipmentSupplyCode,
          sourceParamCode: '',
          sourceParamDescription: '',
          dependentCode: '',
          dependentDescription: '',
          effectiveDate: null,
          terminationDate: null
        }, { emitEvent: false });

        // Clear all validation states
        Object.keys(this.form.controls).forEach(key => {
          const control = this.form.get(key);
          control?.setErrors(null);
          control?.markAsUntouched();
          control?.markAsPristine();
        });

        // Clear form-level errors
        this.form.setErrors(null);
        this.form.markAsUntouched();
        this.form.markAsPristine();

        // Re-run validators so required fields properly disable the save buttons
        Object.keys(this.form.controls).forEach(key => {
          this.form.get(key)?.updateValueAndValidity({ emitEvent: false });
        });

        this.isSubmitting.set(false);
        this.saveSuccess.emit();
      },
      error: (error) => {
        this.isSubmitting.set(false);

        // Extract error message from API response
        let errorMessage = error?.error?.message;

        if (!errorMessage) {
          errorMessage = 'Failed to create QC dependency.';
        }

        this.snackBar.open(errorMessage, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Closes the panel without saving
   */
  onCancel(): void {
    this.closePanel.emit();
  }

  onEffDatePickerOpened(): void {
    this.refreshChapterDates();
  }

  onTermDatePickerOpened(): void {
    this.refreshChapterDates();
  }

  private refreshChapterDates(): void {
    const fresh = this.getChapterMinDate();
    if (!fresh.isSame(this.minDate, 'day')) {
      this.minDate = fresh;
      this.chapterToday = fresh;
      if (this.mode === 'add') {
        this.minTermDate = fresh;
        DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
      }
    }
  }

  private editModeEffectiveDateValidator(): ValidatorFn {
    const originalEffDate = this.editModeValues.effectiveDate;

    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selected = moment(control.value);
      if (!selected.isValid()) return null;

      const selectedStr = selected.format('YYYY-MM-DD');

      if (originalEffDate && selectedStr === originalEffDate) return null;

      const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
      if (selected.isBefore(today, 'day')) {
        return { effectiveDatePast: true };
      }
      return null;
    };
  }

  /**
   * Handle keyboard input for Effective Date
   */
  /**
   * Get the minimum date for Termination Date picker.
   * Returns max(effectiveDate, chapterToday) to prevent past dates in both Add and Edit modes.
   */
  getTerminationDateMin(): moment.Moment | null {
    const effValue = this.form.get('effectiveDate')?.value;
    if (this.mode === 'add') {
      if (effValue && moment.isMoment(effValue) && effValue.isValid()) {
        return effValue.isAfter(this.minDate) ? effValue : this.minDate;
      }
      return this.minDate;
    }
    // Edit mode: prevent selecting past termination dates by returning minDate if effective date is in the past
    if (effValue && moment.isMoment(effValue) && effValue.isValid()) {
      return effValue.isAfter(this.minDate) ? effValue : this.minDate;
    }
    return this.minDate;
  }

  /**
   * Custom date filter for termination date picker.
   * In edit mode, allows the original termination date even if it's in the past.
   * For new selections, enforces >= today and >= effective date.
   */
  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = DateFieldValidationUtility.getMinDate(this.chapterOffset).startOf('day');

    if (this.mode === 'edit' && this.editModeValues.effectiveDate) {
      const originalEffDate = moment(this.editModeValues.effectiveDate).startOf('day');
      if (checkDate.isSame(originalEffDate)) {
        return true;
      }
    }

    if (checkDate.isBefore(chapterToday)) {
      return false;
    }

    return true;
  };

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = DateFieldValidationUtility.getMinDate(this.chapterOffset).startOf('day');

    // In edit mode: allow the original termination date even if it's in the past
    if (this.mode === 'edit' && this.editModeValues.terminationDate) {
      const originalTermDate = moment(this.editModeValues.terminationDate).startOf('day');
      if (checkDate.isSame(originalTermDate)) {
        return true;
      }
    }

    // For new selections: must be >= today
    if (checkDate.isBefore(chapterToday)) {
      return false;
    }

    // Must be >= effective date if set (use getRawValue for disabled controls)
    const effectiveDate = this.form?.getRawValue().effectiveDate;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  /**
   * Handle keyboard input for Termination Date
   */
  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  /**
   * Get error message for effective date field
   */
  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control) return '';

    // Check if control is touched or dirty before showing any errors
    if (!(control.touched || control.dirty)) return '';

    if (control.hasError('effectiveDatePast')) {
      return 'Effective Date cannot be in the past';
    }

    // Check for cross-field date range error ONLY if effective date was changed last
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    if (formErrors?.['dateRangeInvalid']) {
      return 'Effective Date must be less than or equal to Termination Date';
    }

    // Delegate other error checks to utility
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      control, 'Effective Date', 'Termination Date', null
    );
  }

  /**
   * Get error message for termination date field
   */
  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';

    // Custom error message for Drive Equipment Parameters module
    if (control.hasError('terminationDatePast')) {
      return 'Termination Date cannot be past';
    }

    // Check for cross-field date range error ONLY if termination date was changed last
    // Pass non-null value when termination was last changed to show errors, null to suppress
    const formErrors = this.lastChangedDateField === 'termination' ? (this.form.errors || {}) : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      control, 'Termination Date', 'Effective Date', formErrors
    );
  }

  /**
   * Get effective date display for edit mode
   */
  get editEffectiveDateDisplay(): string {
    const date = this.form.get('effectiveDate')?.value;
    if (!date) return '-';
    return DateFieldValidationUtility.formatDateForUI(date)?.toUpperCase() || '-';
  }

  /**
   * Adds duplicate validators to relevant fields
   */
  private addDuplicateValidators(): void {
    // Add validator to dependentCode (it's the last field that completes the unique combination)
    const dependentCodeControl = this.form.get('dependentCode');
    if (dependentCodeControl) {
      dependentCodeControl.setValidators([
        Validators.required,
        this.duplicateValidator.bind(this)
      ]);
      dependentCodeControl.updateValueAndValidity();
    }

    // Watch field changes to revalidate
    this.form.get('sourceParamCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.form.get('dependentCode')?.updateValueAndValidity();
    });

    this.form.get('effectiveDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.form.get('dependentCode')?.updateValueAndValidity();
    });
  }

  /**
   * Custom validator to check for duplicate QC dependency
   */
  private duplicateValidator(control: any): { [key: string]: any } | null {
    if (!control.value || this.mode === 'edit') {
      return null;
    }

    const deviceType = this.form?.get('deviceType')?.value;
    const equipmentSupplyCode = this.form?.get('equipmentSupplyCode')?.value;
    const sourceParamCode = this.form?.get('sourceParamCode')?.value;
    const dependentCode = control.value;
    const effectiveDate = this.form?.get('effectiveDate')?.value;

    if (!deviceType || !equipmentSupplyCode || !sourceParamCode || !effectiveDate) {
      return null;
    }

    // Format dates for comparison (compare date only, not time)
    const formEffectiveDate = moment(effectiveDate).format('YYYY-MM-DD');

    const isDuplicate = this.existingRecords.some(record => {
      const recordEffectiveDate = moment(record.effectiveDate).format('YYYY-MM-DD');
      return record.deviceType === deviceType &&
        record.equipmentSupplyCode === equipmentSupplyCode &&
        record.sourceParamCode === sourceParamCode &&
        record.dependentCode === dependentCode &&
        recordEffectiveDate === formEffectiveDate;
    });

    return isDuplicate ? { duplicate: true } : null;
  }

  /**
   * Get error message for Source Param Code field
   */
  getSourceParamCodeError(): string {
    const control = this.form.get('sourceParamCode');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Source Param Code is required';
    }

    return '';
  }

  /**
   * Get error message for Dependent Code field
   */
  getDependentCodeError(): string {
    const control = this.form.get('dependentCode');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Dependent Param Code is required';
    }

    if (control.hasError('duplicate')) {
      return 'QC dependency with these values already exists';
    }

    return '';
  }
}
