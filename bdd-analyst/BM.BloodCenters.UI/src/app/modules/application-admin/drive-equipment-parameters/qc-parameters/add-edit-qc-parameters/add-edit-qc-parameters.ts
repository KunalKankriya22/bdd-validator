import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize, distinctUntilChanged } from 'rxjs';
import moment from 'moment';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { QcParametersCreateDto, QcParametersUpdateDto, QcParametersModel, MasterCodeModel } from '../../models/drive-equipment-parameters.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from '@core/utils/date-adapter.util';
import { HeaderService } from '@shared/services/header.service';

export interface QcParametersFormData {
  deviceType: string;
  equipmentSupply: string;
  qcParameterCode: string;
  qcCheckCode: string;
  dataType: string;
  qcTargetValue?: string;
  childSequence?: number;
  rangeFlag: string;
  rangeDetailsValue?: number;
  scanRequest: string;
  scanWhat?: string;
  equipmentType?: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

/**
 * Add/Edit QC Parameters Side Panel Component
 * Side panel for creating and editing QC parameter records
 */
@Component({
  selector: 'app-add-edit-qc-parameters',
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
    MatAutocompleteModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatRadioModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-qc-parameters.html',
  styleUrls: ['./add-edit-qc-parameters.scss']
})
export class AddEditQcParameters implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: QcParametersModel | Partial<Pick<QcParametersModel, 'deviceType' | 'equipmentSupply'>> | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<QcParametersFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  // Store existing records for duplicate validation
  private existingRecords: QcParametersModel[] = [];

  form!: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  editModeValues: {
    deviceType: string;
    equipmentSupply: string;
    effectiveDate: string | null;
    terminationDate: string | null;
  } = {
    deviceType: '',
    equipmentSupply: '',
    effectiveDate: null,
    terminationDate: null
  };

  // State signals
  private isSubmitting = signal<boolean>(false);
  private deviceTypeOptions = signal<string[]>([]);
  private qcParameterCodeOptions = signal<any[]>([]);
  private qcCheckCodeOptions = signal<any[]>([]);
  private dataTypeOptions = signal<MasterCodeModel[]>([]);
  private qcTargetValueOptions = signal<any[]>([]);
  private valueTypeOptions = signal<any[]>([]);
  private equipmentTypeOptions = signal<any[]>([]);

  // Computed values
  submitting = computed(() => this.isSubmitting());
  deviceTypes = computed(() => this.deviceTypeOptions());
  qcParameterCodes = computed(() => this.qcParameterCodeOptions());
  qcCheckCodes = computed(() => this.qcCheckCodeOptions());
  dataTypes = computed(() => this.dataTypeOptions());
  qcTargetValues = computed(() => this.qcTargetValueOptions());
  valueTypes = computed(() => this.valueTypeOptions());
  equipmentTypes = computed(() => this.equipmentTypeOptions());

  // Computed signal to determine QC Target Value field type based on Data Type
  qcTargetValueFieldType = signal<'dropdown' | 'text' | 'none' | 'both'>('none');

  // Search controls for ngx-mat-select-search
  readonly qcParameterCodeSearchCtrl = new FormControl('');
  readonly qcCheckCodeSearchCtrl = new FormControl('');
  readonly dataTypeSearchCtrl = new FormControl('');
  readonly scanWhatSearchCtrl = new FormControl('');
  readonly equipmentTypeSearchCtrl = new FormControl('');

  // Search signals
  private readonly qcParameterCodeSearch = signal('');
  private readonly qcCheckCodeSearch = signal('');
  private readonly dataTypeSearch = signal('');
  private readonly scanWhatSearch = signal('');
  private readonly equipmentTypeSearch = signal('');

  // Filtered dropdown options (searchable)
  filteredQcParameterCodes = computed(() => {
    const search = this.qcParameterCodeSearch().toLowerCase();
    const items = this.qcParameterCodeOptions();
    if (!search) return items;
    return items.filter(c => c.code?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
  });

  filteredQcCheckCodes = computed(() => {
    const search = this.qcCheckCodeSearch().toLowerCase();
    const items = this.qcCheckCodeOptions();
    if (!search) return items;
    return items.filter(c => c.code?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
  });

  filteredDataTypes = computed(() => {
    const search = this.dataTypeSearch().toLowerCase();
    const items = this.dataTypeOptions();
    if (!search) return items;
    return items.filter(t => t.code?.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search));
  });

  displayDataTypeDescription = (code: string): string => {
    if (!code) return '';
    const dataType = this.dataTypes().find(dt => dt.code === code);
    return dataType?.description || code;
  };

  filteredScanWhatTypes = computed(() => {
    const search = this.scanWhatSearch().toLowerCase();
    const items = this.valueTypeOptions();
    if (!search) return items;
    return items.filter(t => t.code?.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search));
  });

  filteredEquipmentTypes = computed(() => {
    const search = this.equipmentTypeSearch().toLowerCase();
    const items = this.equipmentTypeOptions();
    if (!search) return items;
    return items.filter(t => t.code?.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search));
  });

  // Get current data type value
  get currentDataType(): string {
    return this.form?.get('dataType')?.value || '';
  }

  isSaving = false;
  minDate: moment.Moment;
  // Minimum date for termination date picker (set to past date in Edit mode if applicable)
  minTermDate: moment.Moment;
  // Current chapter date for calendar display
  chapterToday: moment.Moment;

  get isSaveButtonDisabled(): boolean {
    return this.form.invalid || this.form.pristine || this.isSaving;
  }

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  private destroy$ = new Subject<void>();
  // Error state matchers for mat-form-field error display
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  private getChapterMinDate(): moment.Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  // Store original values for edit mode (needed for update API)
  private originalValues: {
    deviceType: string;
    equipmentSupply: string;
    auditKey?: number;
  } = {
    deviceType: '',
    equipmentSupply: ''
  };

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

    // Form will be created in ngOnInit after minTermDate is set correctly for edit mode
  }

  ngOnInit(): void {
    // FIRST: Setup panel metadata and set minTermDate for edit mode
    this.setupPanel();

    // SECOND: Create form with correct minTermDate (now set by setupPanel for edit mode)
    const record: Partial<QcParametersModel> = this.mode === 'edit' && this.data && 'auditKey' in this.data
      ? this.data as QcParametersModel
      : {};

    this.form = this.fb.group({
      deviceType: [record.deviceType || this.data?.deviceType || ''],
      equipmentSupply: [record.equipmentSupply || this.data?.equipmentSupply || ''],
      sortSequence: [record.sortSequence || null, [Validators.required]],
      qcParameterCode: [record.qcParameterCode || '', [Validators.required]],
      qcParameterDescription: [{ value: record.qcParameterDescription || '', disabled: true }],
      qcCheckCode: [record.qcCheckCode || null, [Validators.required]],
      qcCheckCodeDescription: [{ value: record.qcCheckDescription || '', disabled: true }],
      dataType: [record.dataType || '', [Validators.required]],
      qcTargetValue: [record.qcTargetValue || ''],
      qcTargetValueDescription: [{ value: record.qcTargetValueDescription || '', disabled: true }],
      childSequence: [record.childSequence || null],
      rangeFlag: [record.rangeFlag || ''],
      rangeDetailsValue: [record.rangeDetailsValue || null],
      scanRequest: [record.scanRequest || ''],
      scanWhat: [record.scanWhat || ''],
      scanWhatDescription: [{ value: record.scanWhatDescription || '', disabled: true }],
      equipmentType: [record.equipmentType || ''],
      effectiveDate: [record.effectiveDate ? moment(record.effectiveDate) : null, [Validators.required]],
      terminationDate: [record.terminationDate ? moment(record.terminationDate) : null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });

    // THIRD: Setup mode-specific validators and field states
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      // Re-enable effective date for QC Parameters (FMB allows editing EFF_DATE on existing records)
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
      // NOTE: editModeValues.terminationDate is already populated in populateFormForEdit() above
      // The validator captures this value in a closure at creation time
      const termControl = this.form.get('terminationDate');
      if (termControl) {
        termControl.addValidators(
          DateFieldValidationUtility.editModeTerminationDateValidator(
            this.editModeValues.terminationDate,  // Already set in populateFormForEdit()
            this.chapterOffset
          )
        );
        termControl.updateValueAndValidity({ emitEvent: false });
      }

      // Disable non-editable fields in edit mode
      this.form.get('deviceType')?.disable();
      this.form.get('equipmentSupply')?.disable();
      this.form.get('deviceType')?.clearValidators();
      this.form.get('equipmentSupply')?.clearValidators();
      this.form.get('deviceType')?.updateValueAndValidity();
      this.form.get('equipmentSupply')?.updateValueAndValidity();

      // Update field type based on dataType from record
      if (record.dataType) {
        this.updateQcTargetValueFieldType(record.dataType);
      }

      // Mark form as pristine after loading data
      this.form.markAsPristine();
      this.form.markAsUntouched();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);

      // Auto-populate Sort Sequence for add mode
      this.setNextSortSequence();
    }

    this.loadDropdownOptions();
    this.setupSearchSubscriptions();

    // Track which date field changes for cross-field validation
    this.setupDateFieldTracking();

    // Watch qcParameterCode changes to update description
    this.form.get('qcParameterCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(code => {
      const selectedCode = this.qcParameterCodeOptions().find(c => c.code === code);
      this.form.patchValue({
        qcParameterDescription: selectedCode?.description || ''
      }, { emitEvent: false });
    });

    // Watch qcCheckCode changes to update description
    this.form.get('qcCheckCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(code => {
      const selectedCheckCode = this.qcCheckCodeOptions().find(c => c.code === code);
      this.form.patchValue({
        qcCheckCodeDescription: selectedCheckCode?.description || ''
      }, { emitEvent: false });
    });

    // Watch scanWhat changes to update description
    this.form.get('scanWhat')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(scanWhat => {
      const selectedType = this.valueTypeOptions().find(t => t.code === scanWhat);
      this.form.patchValue({
        scanWhatDescription: selectedType?.description || ''
      }, { emitEvent: false });
    });

    // Watch qcTargetValue changes to update description (only for dropdown mode)
    this.form.get('qcTargetValue')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(targetValue => {
      // Only update description when in dropdown mode (C or D)
      if (this.qcTargetValueFieldType() === 'dropdown') {
        const selectedValue = this.qcTargetValueOptions().find(t => t.code === targetValue);
        this.form.patchValue({
          qcTargetValueDescription: selectedValue?.description || ''
        }, { emitEvent: false });
      } else {
        // Clear description for text input mode
        this.form.patchValue({
          qcTargetValueDescription: ''
        }, { emitEvent: false });
      }
    });

    // Watch dataType changes to apply validation on qcTargetValue and update field type
    this.form.get('dataType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(dataType => {
      this.updateQcTargetValueFieldType(dataType);
      this.applyQcTargetValueValidation(dataType);
    });

    // Apply initial validation and field type based on current dataType value
    const initialDataType = this.form.get('dataType')?.value;
    if (initialDataType) {
      this.updateQcTargetValueFieldType(initialDataType);
      this.applyQcTargetValueValidation(initialDataType);
    }

    // Watch rangeFlag changes to conditionally require rangeDetailsValue
    this.form.get('rangeFlag')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      const rangeDetailsValueControl = this.form.get('rangeDetailsValue');
      if (value === 'Y') {
        rangeDetailsValueControl?.setValidators([Validators.required]);
      } else {
        rangeDetailsValueControl?.clearValidators();
        rangeDetailsValueControl?.setValue(null);
      }
      rangeDetailsValueControl?.updateValueAndValidity();
    });

    // Watch sortSequence changes to validate childSequence
    this.form.get('sortSequence')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.form.get('childSequence')?.updateValueAndValidity();
    });

    // Watch qcParameterCode changes to revalidate qcCheckCode for duplicates
    this.form.get('qcParameterCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.form.get('qcCheckCode')?.updateValueAndValidity();
    });

    // Add child sequence validator
    const childSequenceControl = this.form.get('childSequence');
    childSequenceControl?.setValidators([this.childSequenceValidator.bind(this)]);
    childSequenceControl?.updateValueAndValidity();

    // Add duplicate validator to qcCheckCode
    const qcCheckCodeControl = this.form.get('qcCheckCode');
    qcCheckCodeControl?.setValidators([
      Validators.required,
      this.duplicateQcParameterValidator()
    ]);
    qcCheckCodeControl?.updateValueAndValidity();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
      }
    }
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

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New QC Parameter';
      this.lastUpdated = '';
      // Extract existing records for duplicate validation
      if (this.data && 'existingRecords' in this.data) {
        this.existingRecords = (this.data as any).existingRecords || [];
      }
      // Form creation in ngOnInit will handle pre-filling deviceType and equipmentSupply
      // setNextSortSequence will be called from ngOnInit after form is created
    } else {
      this.panelTitle = 'Edit QC Parameter';
      this.lastUpdated = `Last Updated: ${this.formatDateTime(new Date())}`;
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    // Preserve deviceType and equipmentSupply from parent table selection
    const deviceType = this.data?.deviceType || this.form.get('deviceType')?.value || '';
    const equipmentSupply = this.data?.equipmentSupply || this.form.get('equipmentSupply')?.value || '';

    this.editModeValues = {
      deviceType: '',
      equipmentSupply: '',
      effectiveDate: null,
      terminationDate: null
    };

    // Reset form without emitting events to prevent validation errors during reset
    this.form.reset({
      deviceType: deviceType,
      equipmentSupply: equipmentSupply,
      sortSequence: null,
      qcParameterCode: '',
      qcParameterDescription: '',
      qcCheckCode: null,
      qcCheckCodeDescription: '',
      dataType: '',
      qcTargetValue: '',
      qcTargetValueDescription: '',
      childSequence: null,
      rangeFlag: '',
      rangeDetailsValue: null,
      scanRequest: '',
      scanWhat: '',
      scanWhatDescription: '',
      equipmentType: '',
      effectiveDate: null,
      terminationDate: null
    }, { emitEvent: false });

    // Explicitly mark all controls as untouched and pristine
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
      control?.setErrors(null);
    });

    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.form.setErrors(null);

    this.form.get('deviceType')?.enable();
    this.form.get('equipmentSupply')?.enable();

    // Clear validators for add mode (these are pre-filled from table selection)
    this.form.get('deviceType')?.clearValidators();
    this.form.get('equipmentSupply')?.clearValidators();

    // Setup add mode validators with chapter timezone
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);

    // Auto-populate Sort Sequence with next available number
    this.setNextSortSequence();
  }

  /**
   * Sets the next available Sort Sequence value based on existing records
   */
  private setNextSortSequence(): void {
    if (this.existingRecords.length === 0) {
      this.form.patchValue({ sortSequence: 1 });
      return;
    }

    // Find the maximum sortSequence value
    const maxSortSequence = Math.max(
      ...this.existingRecords.map(record => record.sortSequence || 0)
    );

    // Set the next sequence number
    this.form.patchValue({ sortSequence: maxSortSequence + 1 });
  }

  private populateFormForEdit(): void {
    if (this.data && 'auditKey' in this.data) {
      const record = this.data as QcParametersModel;

      // Store original values for update API
      this.originalValues = {
        deviceType: record.deviceType || '',
        equipmentSupply: record.equipmentSupply || '',
        auditKey: record.auditKey
      };

      this.editModeValues = {
        deviceType: record.deviceType || '',
        equipmentSupply: record.equipmentSupply || '',
        effectiveDate: record.effectiveDate
          ? moment(record.effectiveDate).format('YYYY-MM-DD')
          : null,
        terminationDate: record.terminationDate
          ? moment(record.terminationDate).format('YYYY-MM-DD')
          : null
      };

      // CRITICAL: Set minTermDate BEFORE patching form to prevent Material validation errors
      // If record has a past termination date, set min to that value
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

      // Form initialization happens in ngOnInit after this method returns
      // Field disabling, value patching, and validators are handled there
    }
  }

  /**
   * Loads dropdown options from API
   */
  loadDropdownOptions(): void {
    this.driveEquipmentService.getDeviceTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.deviceTypeOptions.set(types);
        },
        error: () => {
          this.deviceTypeOptions.set(['EQUIP', 'SUPLY']);
        }
      });

    this.driveEquipmentService.getQcParameterCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.qcParameterCodeOptions.set(response.data);
        },
        error: () => {
          // Silent fail
        }
      });

    this.driveEquipmentService.getQcCheckCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.qcCheckCodeOptions.set(codes);
        },
        error: () => {
          this.qcCheckCodeOptions.set([]);
        }
      });

    this.driveEquipmentService.getQcDataTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          // Transform 'Decimal' to 'Date' for code 'D'
          const transformedTypes = types.map(type =>
            type.code === 'D' && type.description === 'Decimal'
              ? { ...type, description: 'Date' }
              : type
          );
          this.dataTypeOptions.set(transformedTypes);
        },
        error: () => {
          this.dataTypeOptions.set([
            { code: 'C', description: 'Character' },
            { code: 'D', description: 'Date' },
            { code: 'N', description: 'Numeric' }
          ]);
        }
      });

    this.driveEquipmentService.getQcTargetValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (values) => {
          this.qcTargetValueOptions.set(values);
        },
        error: () => {
          // Silent fail
        }
      });

    this.driveEquipmentService.getQcValueTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.valueTypeOptions.set(response.data);
        },
        error: () => {
          // Silent fail
        }
      });

    this.driveEquipmentService.getQcEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.equipmentTypeOptions.set(response.data);
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

    const raw = this.form.getRawValue();

    this.isSaving = true;

    const operation$ = this.mode === 'add'
      ? this.driveEquipmentService.createQcParameters({
          deviceType: raw.deviceType,
          equipmentSupply: raw.equipmentSupply,
          sortSequence: raw.sortSequence,
          qcParameterCode: raw.qcParameterCode,
          qcCheckCode: raw.qcCheckCode,
          dataType: raw.dataType,
          qcTargetValue: raw.qcTargetValue || undefined,
          childSequence: raw.childSequence || undefined,
          rangeFlag: raw.rangeFlag,
          rangeDetailsValue: raw.rangeDetailsValue || undefined,
          scanRequest: raw.scanRequest,
          scanWhat: raw.scanWhat || undefined,
          equipmentType: raw.equipmentType || undefined,
          effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
          terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
        } as QcParametersCreateDto)
      : this.driveEquipmentService.updateQcParameters({
          deviceType: this.originalValues.deviceType,
          equipmentSupply: this.originalValues.equipmentSupply,
          auditKey: this.originalValues.auditKey!,
          sortSequence: raw.sortSequence,
          qcParameterCode: raw.qcParameterCode,
          qcCheckCode: raw.qcCheckCode,
          dataType: raw.dataType,
          qcTargetValue: raw.qcTargetValue || undefined,
          childSequence: raw.childSequence || undefined,
          rangeFlag: raw.rangeFlag,
          rangeDetailsValue: raw.rangeDetailsValue || undefined,
          scanRequest: raw.scanRequest,
          scanWhat: raw.scanWhat || undefined,
          equipmentType: raw.equipmentType || undefined,
          effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
          terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
        } as QcParametersUpdateDto);

    operation$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? `QC parameter "${raw.qcParameterCode}" added successfully`
            : `QC parameter "${raw.qcParameterCode}" updated successfully`);

          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: QcParametersFormData = {
            deviceType: raw.deviceType,
            equipmentSupply: raw.equipmentSupply,
            qcParameterCode: raw.qcParameterCode,
            qcCheckCode: raw.qcCheckCode,
            dataType: raw.dataType,
            qcTargetValue: raw.qcTargetValue || undefined,
            childSequence: raw.childSequence || undefined,
            rangeFlag: raw.rangeFlag,
            rangeDetailsValue: raw.rangeDetailsValue || undefined,
            scanRequest: raw.scanRequest,
            scanWhat: raw.scanWhat || undefined,
            equipmentType: raw.equipmentType || undefined,
            effectiveDate: raw.effectiveDate,
            terminationDate: raw.terminationDate || null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error: any) => {
          console.error('Error saving QC parameter:', error);

          let errorMessage = error.error?.message;

          if (!errorMessage) {
            errorMessage = 'An error occurred while saving';
          }

        }
      });
  }

  /**
   * Handles Save & Create Another action
   */
  onSaveAndCreateAnother(): void {
    this.refreshChapterDates();
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();

    this.isSaving = true;

    const operation$ = this.mode === 'add'
      ? this.driveEquipmentService.createQcParameters({
          deviceType: raw.deviceType,
          equipmentSupply: raw.equipmentSupply,
          sortSequence: raw.sortSequence,
          qcParameterCode: raw.qcParameterCode,
          qcCheckCode: raw.qcCheckCode,
          dataType: raw.dataType,
          qcTargetValue: raw.qcTargetValue || undefined,
          childSequence: raw.childSequence || undefined,
          rangeFlag: raw.rangeFlag,
          rangeDetailsValue: raw.rangeDetailsValue || undefined,
          scanRequest: raw.scanRequest,
          scanWhat: raw.scanWhat || undefined,
          equipmentType: raw.equipmentType || undefined,
          effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
          terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
        } as QcParametersCreateDto)
      : this.driveEquipmentService.updateQcParameters({
          deviceType: this.originalValues.deviceType,
          equipmentSupply: this.originalValues.equipmentSupply,
          auditKey: this.originalValues.auditKey!,
          sortSequence: raw.sortSequence,
          qcParameterCode: raw.qcParameterCode,
          qcCheckCode: raw.qcCheckCode,
          dataType: raw.dataType,
          qcTargetValue: raw.qcTargetValue || undefined,
          childSequence: raw.childSequence || undefined,
          rangeFlag: raw.rangeFlag,
          rangeDetailsValue: raw.rangeDetailsValue || undefined,
          scanRequest: raw.scanRequest,
          scanWhat: raw.scanWhat || undefined,
          equipmentType: raw.equipmentType || undefined,
          effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
          terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
        } as QcParametersUpdateDto);

    operation$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Operation completed successfully';

          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: QcParametersFormData = {
            deviceType: raw.deviceType,
            equipmentSupply: raw.equipmentSupply,
            qcParameterCode: raw.qcParameterCode,
            qcCheckCode: raw.qcCheckCode,
            dataType: raw.dataType,
            qcTargetValue: raw.qcTargetValue || undefined,
            childSequence: raw.childSequence || undefined,
            rangeFlag: raw.rangeFlag,
            rangeDetailsValue: raw.rangeDetailsValue || undefined,
            scanRequest: raw.scanRequest,
            scanWhat: raw.scanWhat || undefined,
            equipmentType: raw.equipmentType || undefined,
            effectiveDate: raw.effectiveDate,
            terminationDate: raw.terminationDate || null
          };

          this.saveSuccess.emit(result);

          // Defer form reset to next change detection cycle to prevent ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            if (this.mode === 'edit') {
              this.mode = 'add';
              this.modeChange.emit('add');
              this.resetFormForAddMode();
              this.setupPanel();
            } else {
              this.resetFormForAddMode();
            }
          }, 0);
        },
        error: (error: any) => {
          console.error('Error saving QC parameter:', error);

          let errorMessage = error.error?.message;

          if (!errorMessage) {
            errorMessage = 'An error occurred while saving';
          }

        }
      });
  }

  /**
   * Date filter for termination date picker.
   * In edit mode: allows original past termination date but disables past dates for new selections.
   * In add mode: disables all past dates.
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
    this.qcParameterCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.qcParameterCodeSearch.set(v || ''));
    this.qcCheckCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.qcCheckCodeSearch.set(v || ''));
    this.dataTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.dataTypeSearch.set(v || ''));
    this.scanWhatSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.scanWhatSearch.set(v || ''));
    this.equipmentTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.equipmentTypeSearch.set(v || ''));
  }

  /** Reset search when dropdown closes so all items show on next open */
  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
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

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], hh:mm A [PST]');
    } else {
      return momentDate.format('DD-MMM-YYYY, hh:mm A [PST]');
    }
  }

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
   * Get error message for QC Parameter Code field
   */
  getQcParameterCodeError(): string {
    const control = this.form.get('qcParameterCode');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'FRM-0080 QC Parameter Code is required';
    }

    return '';
  }

  /**
   * Get error message for QC Check Code field
   */
  getQcCheckCodeError(): string {
    const control = this.form.get('qcCheckCode');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'FRM-0080 QC Check Code is required';
    }

    if (control.hasError('duplicateQcParameter')) {
      return 'QC Parameter Code and QC Check Code combination already exists';
    }

    return '';
  }

  /**
   * Edit-mode validator for Effective Date.
   * Allows the original past effective date to remain without error.
   * Blocks any NEW past effective date the user enters.
   */
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
   * Custom validator for Child Sequence field
   * Child Sequence must be >= 0 and <= Sort Sequence
   */
  private childSequenceValidator(control: any): { [key: string]: any } | null {
    const childSequence = control.value;

    // If no value entered, it's optional so return null (valid)
    if (childSequence === null || childSequence === undefined || childSequence === '') {
      return null;
    }

    // In edit mode, skip validation if the field hasn't been touched
    // This allows existing invalid data to load without blocking the form
    if (this.mode === 'edit' && !control.touched && !control.dirty) {
      return null;
    }

    const sortSequence = this.form?.get('sortSequence')?.value;

    // Child Sequence must be >= 0
    if (childSequence < 0) {
      return { childSequenceMin: true };
    }

    // Child Sequence must be <= Sort Sequence (only if Sort Sequence has a value)
    if (sortSequence !== null && sortSequence !== undefined && childSequence > sortSequence) {
      return { childSequenceMax: true };
    }

    return null;
  }

  /**
   * Custom validator to check for duplicate QC Parameter Code + QC Check Code combination
   */
  private duplicateQcParameterValidator = () => {
    return (control: any): { [key: string]: any } | null => {
      const qcCheckCode = control.value;
      const qcParameterCode = this.form?.get('qcParameterCode')?.value;

      // If either field is empty, skip duplicate check (required validator handles this)
      if (!qcCheckCode || !qcParameterCode) {
        return null;
      }

      // In edit mode, skip validation if the field hasn't been touched
      // This allows existing data to load without validation errors
      if (this.mode === 'edit' && !control.touched && !control.dirty) {
        return null;
      }

      // Check for duplicate combination in existing records
      const isDuplicate = this.existingRecords.some(record => {
        // In edit mode, exclude the current record from the check
        if (this.mode === 'edit' && this.originalValues.auditKey === record.auditKey) {
          return false;
        }

        // Check if combination already exists
        return (
          record.qcParameterCode === qcParameterCode &&
          record.qcCheckCode === qcCheckCode
        );
      });

      return isDuplicate ? { duplicateQcParameter: true } : null;
    };
  };

  /**
   * Update QC Target Value field type based on Data Type selection
   */
  private updateQcTargetValueFieldType(dataType: string): void {
    if (dataType === 'C' || dataType === 'D') {
      // For C or D: Show dropdown only
      this.qcTargetValueFieldType.set('dropdown');
    } else if (dataType === 'N') {
      // For N: Show both dropdown and text input (combo)
      this.qcTargetValueFieldType.set('both');
    } else {
      // No data type selected
      this.qcTargetValueFieldType.set('none');
    }

    // Clear the value when switching field types
    this.form.get('qcTargetValue')?.setValue('', { emitEvent: false });
  }

  /**
   * Apply validation to QC Target Value based on Data Type
   */
  private applyQcTargetValueValidation(dataType: string): void {
    const qcTargetValueControl = this.form.get('qcTargetValue');

    if (dataType === 'N') {
      // Numeric: Allow dropdown or numeric input - validate format only if provided
      qcTargetValueControl?.setValidators([this.numericOrDropdownValidator()]);
    } else {
      // Character, Date, or No data type: Optional
      qcTargetValueControl?.clearValidators();
    }

    qcTargetValueControl?.updateValueAndValidity();
  }

  /**
   * Custom validator for numeric or dropdown values (Data Type = N)
   * Validates that the value is either from dropdown or a valid numeric format
   */
  private numericOrDropdownValidator = () => {
    return (control: any): { [key: string]: any } | null => {
      const value = control.value;
      if (!value) return null; // Optional field

      // Check if value exists in dropdown options
      const options = this.qcTargetValueOptions();
      const isInDropdown = options.some(option => option.code === value);

      // If it's in dropdown, it's valid
      if (isInDropdown) return null;

      // If not in dropdown, check if it's numeric
      if (!/^\d+(\.\d+)?$/.test(value)) {
        return { numericOrDropdown: true };
      }

      return null;
    };
  };



  /**
   * Get error message for Child Sequence field
   */
  getChildSequenceError(): string {
    const control = this.form.get('childSequence');
    if (!control || !control.touched) return '';

    if (control.hasError('childSequenceMin')) {
      return 'Child Sequence must be >= 0';
    }

    if (control.hasError('childSequenceMax')) {
      const sortSequence = this.form.get('sortSequence')?.value;
      return `Child Sequence must be <= ${sortSequence}`;
    }

    return '';
  }

  /**
   * Get error message for QC Target Value field
   */
  getQcTargetValueError(): string {
    const control = this.form.get('qcTargetValue');
    if (!control || !control.touched) return '';

    if (control.hasError('numericOrDropdown')) {
      return 'Select from dropdown or enter a numeric value';
    }

    return '';
  }

  /**
   * Handle input event for numeric QC Target Value
   * Filters out non-numeric characters
   */
  onQcTargetValueInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Allow only digits and decimal point
    const filtered = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = filtered.split('.');
    const finalValue = parts.length > 2
      ? parts[0] + '.' + parts.slice(1).join('')
      : filtered;

    if (value !== finalValue) {
      const control = this.form.get('qcTargetValue');
      control?.setValue(finalValue, { emitEvent: false });
      input.value = finalValue;
      // Manually trigger validation after setting value
      control?.updateValueAndValidity();
    }
  }

  /**
   * Prevent decimal point and other non-integer characters from being entered
   * This works at the keyboard level before the character is entered
   */
  preventDecimalInput(event: KeyboardEvent): void {
    // Allow: backspace, delete, tab, escape, enter
    if ([46, 8, 9, 27, 13].indexOf(event.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true) ||
      // Allow: home, end, left, right, up, down
      (event.keyCode >= 35 && event.keyCode <= 40)) {
      return;
    }

    // Prevent decimal point, comma, and 'e' (exponential notation)
    if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E' || event.key === '-' || event.key === '+') {
      event.preventDefault();
      return;
    }

    // Ensure that it is a number and stop the keypress if not
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
      event.preventDefault();
    }
  }

  /**
   * Handle paste event for integer fields to strip decimals
   */
  onIntegerPaste(event: ClipboardEvent, fieldName: string): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    // Remove everything except digits
    const filtered = pastedText.replace(/[^0-9]/g, '');

    if (filtered) {
      const value = parseInt(filtered, 10);
      this.form.get(fieldName)?.setValue(value);
    }
  }

  /**
   * Handle input event for Child Sequence
   * Only allows whole numbers (no decimals)
   */
  onChildSequenceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remove everything except digits
    const filtered = value.replace(/[^0-9]/g, '');

    if (value !== filtered) {
      const numValue = filtered ? parseInt(filtered, 10) : null;
      this.form.get('childSequence')?.setValue(numValue, { emitEvent: false });
      input.value = filtered;
    }
  }

  /**
   * Handle input event for Sort Sequence
   * Only allows whole numbers (no decimals)
   */
  onSortSequenceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remove everything except digits
    const filtered = value.replace(/[^0-9]/g, '');

    if (value !== filtered) {
      const numValue = filtered ? parseInt(filtered, 10) : null;
      this.form.get('sortSequence')?.setValue(numValue, { emitEvent: false });
      input.value = filtered;
    }
  }
}
