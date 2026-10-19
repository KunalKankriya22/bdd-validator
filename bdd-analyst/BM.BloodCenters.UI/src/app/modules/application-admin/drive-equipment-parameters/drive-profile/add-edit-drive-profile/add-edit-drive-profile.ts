import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { DriveProfileCreateDto, DriveProfileUpdateDto } from '../../models/drive-equipment-parameters.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

/**
 * Add/Edit Drive Profile Dialog Component
 * Side panel dialog for creating and editing drive profile records
 */
@Component({
  selector: 'app-add-edit-drive-profile',
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
  templateUrl: './add-edit-drive-profile.html',
  styleUrls: ['./add-edit-drive-profile.scss']
})
export class AddEditDriveProfile implements OnInit, OnDestroy {
  @Input() mode!: 'add' | 'edit';
  @Input() data: any;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() refreshData = new EventEmitter<void>();

  form!: FormGroup;

  // Minimum date for effective date picker (today based on chapter timezone)
  minDate: moment.Moment;

  // Edit mode values for display
  editModeValues = {
    effectiveDate: '',
    terminationDate: null as string | null
  };

  // Store original values for update operations
  private originalValues = {
    deviceType: '',
    driveProfileType: '',
    code: '',
    effectiveDate: '',
    terminationDate: null as string | null
  };
  // Error state matchers for mat-form-field error display
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Search controls for ngx-mat-select-search
  readonly deviceTypeSearchCtrl = new FormControl('');
  readonly driveProfileTypeSearchCtrl = new FormControl('');
  readonly codeSearchCtrl = new FormControl('');

  // Search signals
  private readonly deviceTypeSearch = signal('');
  private readonly driveProfileTypeSearch = signal('');
  private readonly codeSearch = signal('');

  // State signals
  private isSubmitting = signal<boolean>(false);
  private deviceTypeOptions = signal<string[]>([]);
  private driveProfileTypeOptions = signal<any[]>([]);
  private codeOptions = signal<any[]>([]);

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  private destroy$ = new Subject<void>();

  // Computed values
  submitting = computed(() => this.isSubmitting());
  title = computed(() => this.mode === 'add' ? 'Add New Drive Profile' : 'Edit Drive Profile');

  get isSaveDisabled(): boolean {
    return this.form.invalid || this.form.pristine || this.submitting();
  }

  // Filtered dropdown options (searchable)
  filteredDeviceTypes = computed(() => {
    const search = this.deviceTypeSearch().toLowerCase();
    const items = this.deviceTypeOptions();
    if (!search) return items;
    return items.filter(type => type.toLowerCase().includes(search));
  });

  filteredDriveProfileTypes = computed(() => {
    const search = this.driveProfileTypeSearch().toLowerCase();
    const items = this.driveProfileTypeOptions();
    if (!search) return items;
    return items.filter(t => t.code?.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search));
  });

  filteredCodes = computed(() => {
    const search = this.codeSearch().toLowerCase();
    const items = this.codeOptions();
    if (!search) return items;
    return items.filter(c => c.code?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
  });

  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  private getChapterMinDate(): moment.Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  constructor(
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private driveEquipmentService: DriveEquipmentParametersService
  ) {
    this.minDate = this.getChapterMinDate();

    effect(() => {
      this.minDate = this.getChapterMinDate();
    });
  }

  ngOnInit(): void {
    if (!this.mode) {
      this.mode = this.data?.mode || 'add';
    }
    const record = this.data?.record || {};

    // Store original values for update operation
    if (this.mode === 'edit' && record) {
      this.originalValues = {
        deviceType: record.deviceType || '',
        driveProfileType: record.driveProfileType || '',
        code: record.code || '',
        effectiveDate: record.effectiveDate || '',
        terminationDate: record.terminationDate || null
      };

      // Store edit mode display values (format to YYYY-MM-DD for consistent comparison)
      this.editModeValues.terminationDate = record.terminationDate
        ? moment(record.terminationDate).format('YYYY-MM-DD')
        : null;

    }

    this.form = this.fb.group({
      deviceType: [
        { value: record.deviceType || '', disabled: this.mode === 'edit' },
        [Validators.required]
      ],
      driveProfileType: [
        { value: record.driveProfileType || '', disabled: this.mode === 'edit' },
        [Validators.required]
      ],
      driveProfileTypeDescription: [
        { value: record.driveProfileTypeDescription || '', disabled: true }
      ],
      code: [
        record.code || '',
        [Validators.required]
      ],
      codeDescription: [
        { value: record.codeDescription || '', disabled: true }
      ],
      effectiveDate: [
        record.effectiveDate ? moment(record.effectiveDate) : null
      ],
      terminationDate: [
        record.terminationDate ? moment(record.terminationDate) : null
      ]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });

    // Setup mode-specific validators using utility
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      // Apply edit-mode-aware termination date validator
      // This allows the original past termination date but blocks manually entering NEW past dates
      // NOTE: editModeValues.terminationDate is already populated at lines 175-177 above
      // The validator captures this value in a closure at creation time
      const termControl = this.form.get('terminationDate');
      if (termControl) {
        termControl.addValidators(
          DateFieldValidationUtility.editModeTerminationDateValidator(
            this.editModeValues.terminationDate,  // Already set at line 175-177
            this.chapterOffset
          )
        );
        termControl.updateValueAndValidity({ emitEvent: false });
      }

      // Format effective date for display in edit mode
      this.editModeValues.effectiveDate = DateFieldValidationUtility.formatDateForUI(record.effectiveDate)?.toUpperCase() || '';

    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    // Load dropdown options
    this.loadDropdownOptions();

    // Setup search subscriptions for searchable dropdowns
    this.setupSearchSubscriptions();

    // Track which date field changes for cross-field validation
    this.setupDateFieldTracking();

    // Watch deviceType changes to update codes dropdown
    this.form.get('deviceType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(deviceType => {
      if (deviceType) {
        this.loadCodes(deviceType);
        // Clear code and description when device type changes
        this.form.patchValue({
          code: '',
          codeDescription: ''
        });
      } else {
        this.codeOptions.set([]);
        this.form.patchValue({
          code: '',
          codeDescription: ''
        });
      }
    });

    // Watch driveProfileType changes to update description
    this.form.get('driveProfileType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(driveProfileType => {
      const selectedType = this.driveProfileTypeOptions().find(t => t.code === driveProfileType);
      this.form.patchValue({
        driveProfileTypeDescription: selectedType?.description || ''
      });
    });

    // Watch code changes to update description
    this.form.get('code')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(code => {
      const selectedCode = this.codeOptions().find(c => c.code === code);
      this.form.patchValue({
        codeDescription: selectedCode?.description || ''
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

  /**
   * Date filter for termination date picker.
   * In edit mode: allows original past termination date but disables past dates for new selections.
   * In add mode: disables all past dates.
   */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = DateFieldValidationUtility.getMinDate(this.chapterOffset).startOf('day');

    // In edit mode: allow the original termination date even if it's in the past
    if (this.mode === 'edit' && this.editModeValues.terminationDate) {
      const originalTermDate = moment(this.editModeValues.terminationDate).startOf('day');
      // If this is the original date, allow it
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

  /** Setup search subscriptions for searchable dropdowns */
  private setupSearchSubscriptions(): void {
    this.deviceTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.deviceTypeSearch.set(v || ''));
    this.driveProfileTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.driveProfileTypeSearch.set(v || ''));
    this.codeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.codeSearch.set(v || ''));
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
    // Load device types
    this.driveEquipmentService.getDeviceTypes().subscribe({
      next: (types) => {
        this.deviceTypeOptions.set(types);
      },
      error: () => {
        // Use default values on error
        this.deviceTypeOptions.set(['EQUIP', 'SUPLY']);
      }
    });

    // Load drive profile types
    this.driveEquipmentService.getDriveProfileTypes().subscribe({
      next: (types) => {
        this.driveProfileTypeOptions.set(types);
      },
      error: () => {
        // Silent fail
      }
    });

    // Load codes if device type is already selected (use getRawValue for disabled controls)
    const deviceType = this.form.getRawValue().deviceType;
    if (deviceType) {
      this.loadCodes(deviceType);
    }
  }

  /**
   * Loads codes dropdown filtered by device type
   */
  loadCodes(deviceType: string): void {
    this.driveEquipmentService.getCodes(deviceType).subscribe({
      next: (codes) => {
        this.codeOptions.set(codes);
      },
      error: () => {
        // Silent fail
      }
    });
  }

  /**
   * Handles form submission
   */
  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      // If there's a date range error and no field has been marked as last changed,
      // default to showing the error on termination date
      if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
        this.lastChangedDateField = 'termination';
      }
      this.snackBar.open('Please correct the highlighted errors before saving.', 'DISMISS', {
        duration: 5000
      });
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const operation$ = this.mode === 'add'
      ? this.driveEquipmentService.createDriveProfile({
          deviceType: raw.deviceType,
          driveProfileType: raw.driveProfileType,
          code: raw.code,
          effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
          terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
        } as DriveProfileCreateDto)
      : this.driveEquipmentService.updateDriveProfile({
          OriginalCode: this.originalValues.code,  // Original code value
          originalEffectiveDate: this.originalValues.effectiveDate,  // Original effective date value
          deviceType: this.originalValues.deviceType,  // Use original value (field is disabled in edit mode)
          driveProfileType: this.originalValues.driveProfileType,  // Use original value (field is disabled in edit mode)
          code: raw.code,  // Current/new code value
          effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
          terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
        } as DriveProfileUpdateDto);

    operation$.subscribe({
      next: () => {
        const message = this.mode === 'add'
          ? `Drive profile "${raw.driveProfileType}" added successfully.`
          : `Drive profile "${raw.driveProfileType}" updated successfully.`;

        this.snackBar.open(message, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        this.saveSuccess.emit();
      },
      error: (error) => {
        this.isSubmitting.set(false);

        // Handle 409 Conflict (duplicate) error
        if (error?.status === 409) {
          const errorMessage = error?.error?.message ||
            `Drive profile with Type=${raw.deviceType}, ProfileType=${raw.driveProfileType}, Code=${raw.code} already exists`;
        } else {
          const message = this.mode === 'add'
            ? 'Failed to create drive profile.'
            : 'Failed to update drive profile.';

        }
      }
    });
  }

  /**
   * Handles Add & Create Another action
   */
  onSaveAndCreateAnother(): void {
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

    const payload: DriveProfileCreateDto = {
      deviceType: raw.deviceType,
      driveProfileType: raw.driveProfileType,
      code: raw.code,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
    };

    this.driveEquipmentService.createDriveProfile(payload).subscribe({
      next: () => {
        this.snackBar.open(`Drive profile "${raw.driveProfileType}" added successfully.`, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        // Reset form for next entry - pass emitEvent: false to avoid triggering validations
        this.form.reset({
          deviceType: '',
          driveProfileType: '',
          driveProfileTypeDescription: '',
          code: '',
          codeDescription: '',
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

        this.isSubmitting.set(false);

        this.refreshData.emit();
      },
      error: (error) => {
        this.isSubmitting.set(false);

        // Handle 409 Conflict (duplicate) error
        if (error?.status === 409) {
          const errorMessage = error?.error?.message ||
            `Drive profile with Type=${raw.deviceType}, ProfileType=${raw.driveProfileType}, Code=${raw.code} already exists`;
        } else {
        }
      }
    });
  }

  /**
   * Closes the panel without saving
   */
  onCancel(): void {
    this.closePanel.emit();
  }

  /**
   * Handle code dropdown opened/closed
   */
  onCodeOpenedChange(opened: boolean): void {
    if (opened) {
      this.form.get('code')?.markAsTouched();
    }
  }

  /**
   * Get error message for code field
   */
  getCodeError(): string {
    const control = this.form.get('code');
    const deviceTypeControl = this.form.get('deviceType');

    if (!control || !control.touched) return '';

    if (!deviceTypeControl?.value) {
      return 'Please select Type first';
    }

    if (control.hasError('required')) {
      return 'Code is required';
    }

    return '';
  }

  /**
   * Handle keyboard input for Effective Date
   */
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
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  /** Returns the minimum selectable date for the termination date picker.
   *  Result is the later of today (minDate) and the selected effective date. */
  getTerminationDateMin(): moment.Moment {
    const effDate = this.form.get('effectiveDate')?.value;
    if (effDate && moment.isMoment(effDate)) {
      const effDay = moment(effDate).startOf('day');
      return effDay.isAfter(this.minDate) ? effDay : this.minDate;
    }
    return this.minDate;
  }

  /**
   * Get error message for termination date field
   */
  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');

    if (control?.touched && control?.hasError('terminationDatePast')) {
      return 'Termination Date cannot be in the past';
    }

    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
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
}
