import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { AboValuesService } from '../services/abo-values.service';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  AboValuesModel,
  AboValuesDto,
  UpdateAboValuesDto,
  AboValuesDropdowns,
  DropdownOption
} from '../models/abo-values.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-add-edit-abo-values',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-abo-values.html',
  styleUrls: ['./add-edit-abo-values.scss']
})
export class AddEditAboValues implements OnInit, OnDestroy, OnChanges {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AboValuesModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form!: FormGroup;
  title!: string;

  // Dropdown options
  testedAboOptions = signal<DropdownOption[]>([]);
  intendedUseOptions = signal<DropdownOption[]>([]);
  unitSchemeOptions: DropdownOption[] = [];
  transfusionStatusOptions = signal<DropdownOption[]>([]);
  aboOnlyOptions: DropdownOption[] = [];

  isLoadingOptions = false;
  isSaving = false;

  // Search controls for searchable dropdowns
  readonly testedAboSearchControl = new FormControl('');
  readonly intendedUseSearchControl = new FormControl('');
  readonly transfusionStatusSearchControl = new FormControl('');
  readonly alternateAboSearchControl = new FormControl('');

  readonly testedAboSearch = signal('');
  readonly intendedUseSearch = signal('');
  readonly transfusionStatusSearch = signal('');
  readonly alternateAboSearch = signal('');

  // Filtered dropdown options
  readonly filteredTestedAboOptions = computed(() => {
    const search = this.testedAboSearch().toLowerCase();
    const options = this.testedAboOptions();
    if (!search) return options;
    return options.filter(o =>
      o.key.toLowerCase().includes(search) ||
      o.value.toLowerCase().includes(search)
    );
  });

  readonly filteredIntendedUseOptions = computed(() => {
    const search = this.intendedUseSearch().toLowerCase();
    const options = this.intendedUseOptions();
    if (!search) return options;
    return options.filter(o =>
      o.key.toLowerCase().includes(search) ||
      o.value.toLowerCase().includes(search)
    );
  });

  readonly filteredTransfusionStatusOptions = computed(() => {
    const search = this.transfusionStatusSearch().toLowerCase();
    const options = this.transfusionStatusOptions();
    if (!search) return options;
    return options.filter(o =>
      o.key.toLowerCase().includes(search) ||
      o.value.toLowerCase().includes(search)
    );
  });

  readonly filteredAlternateAboOptions = computed(() => {
    const search = this.alternateAboSearch().toLowerCase();
    const options = this.testedAboOptions();
    if (!search) return options;
    return options.filter(o =>
      o.key.toLowerCase().includes(search) ||
      o.value.toLowerCase().includes(search)
    );
  });

  // Date restriction for datepickers
  minDate!: moment.Moment;

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

  // Store original values for edit mode (needed for update API and change detection)
  private originalValues: {
    auditKey: number | null;
    testedAbo: string;
    intendedUse: string;
    unitScheme: string;
    aboLabel: string;
    aboDescription: string;
    bloodTypeCode: string;
    transfusionStatus: string;
    aboOnly: string;
    alternateAbo: string;
    usageCode: string;
    effectiveDate: string | null;
    terminationDate: string | null;
    identifierDescription: string;
  } = {
    auditKey: null,
    testedAbo: '',
    intendedUse: '',
    unitScheme: '',
    aboLabel: '',
    aboDescription: '',
    bloodTypeCode: '',
    transfusionStatus: '',
    aboOnly: '',
    alternateAbo: '',
    usageCode: '',
    effectiveDate: null,
    terminationDate: null,
    identifierDescription: ''
  };

  // Track if edit form is being initialized
  private isInitializingEditForm = false;

  // Track if user has manually interacted with termination date field in edit mode
  private terminationDateManuallyTouched = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private aboValuesService: AboValuesService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.title = this.mode === 'add' ? 'Add New ABO Rule' : 'Edit ABO Rule';
    // Initialize minDate with chapter timezone
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.buildForm();
    this.loadDropdownOptions();
    this.setupTestedAboListener();
    this.setupIntendedUseListener();
    this.setupSearchControls();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.title = this.mode === 'add' ? 'Add New ABO Rule' : 'Edit ABO Rule';
      if (this.form) {
        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
      }
    }

    if (changes['data'] && !changes['data'].firstChange && this.data && this.mode === 'edit') {
      // Only populate form if ALL dropdown options are loaded
      if (this.form && this.areDropdownOptionsLoaded()) {
        this.populateFormForEdit();
      }
    }
  }

  private resetFormForAddMode(): void {
    this.isInitializingEditForm = false;
    this.terminationDateManuallyTouched = false;

    // Reset original values
    this.originalValues = {
      auditKey: null,
      testedAbo: '',
      intendedUse: '',
      unitScheme: '',
      aboLabel: '',
      aboDescription: '',
      bloodTypeCode: '',
      transfusionStatus: '',
      aboOnly: '',
      alternateAbo: '',
      usageCode: '',
      effectiveDate: null,
      terminationDate: null,
      identifierDescription: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.enableAllFields();

    // Setup validators for add mode (no past date validation for termination date in add mode)
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // Dropdown fields - only require 'required' validator (options are pre-constrained)
      testedAbo: ['', [Validators.required]],
      intendedUse: ['', [Validators.required]],
      unitScheme: ['', [Validators.required]],
      transfusionStatus: ['', [Validators.required]],
      aboOnly: ['', [Validators.required]],

      // Read-only display fields (always disabled)
      description: [{ value: '', disabled: true }, [Validators.maxLength(30)]],
      identifierDescription: [{ value: '', disabled: true }],

      // Text input fields
      aboLabel: ['', [Validators.required, Validators.maxLength(4)]],
      aboDescription: ['', [Validators.required, Validators.maxLength(50)]],
      bloodTypeCode: ['', [Validators.maxLength(2)]],
      alternateAbo: [''], // Validators set dynamically in setupAlternateAboValidation
      usageCode: ['', [Validators.maxLength(1)]],

      // Date fields
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        this.alternateAboValidator.bind(this),
        this.unitSchemeIdentifierValidator.bind(this)
      ]
    });

    if (this.mode === 'edit') {
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

    // Setup dynamic validation for alternateAbo based on aboOnly
    this.setupAlternateAboValidation();
  }

  /**
   * Setup termination date validators for edit mode
   * Ensures field-level validation when termination date is touched on terminated records
   */
  private setupTerminationDateValidatorsForEdit(): void {
    const termDateControl = this.form.get('terminationDate');
    if (termDateControl) {
      termDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())
      ]);
      termDateControl.updateValueAndValidity();
    }
  }

  /**
   * Check if all dropdown options are loaded
   */
  private areDropdownOptionsLoaded(): boolean {
    return this.testedAboOptions().length > 0 &&
           this.intendedUseOptions().length > 0 &&
           this.unitSchemeOptions.length > 0 &&
           this.transfusionStatusOptions().length > 0 &&
           this.aboOnlyOptions.length > 0;
  }

  /**
   * Load dropdown options from API
   */
  private loadDropdownOptions(): void {
    this.isLoadingOptions = true;

    this.aboValuesService.getAboValuesDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('=== RAW DROPDOWN API RESPONSE ===');
          console.log('Full Response:', response);

          // Extract dropdowns from response.data[0]
          let dropdownData = null;
          if (response.data && response.data.length > 0) {
            dropdownData = response.data[0];
          } else if (response.item) {
            dropdownData = response.item;
          }

          console.log('Extracted Dropdown Data:', dropdownData);

          if (dropdownData) {
            // For testedABO: API returns key = code, value = description (use as-is)
            this.testedAboOptions.set(dropdownData.testedABO || []);
            console.log('testedAboOptions (no swap):', this.testedAboOptions()[0]);

            // For other dropdowns: API returns data BACKWARDS, so swap them
            const swapKeyValue = (options: DropdownOption[]): DropdownOption[] => {
              console.log('BEFORE SWAP:', options[0]);
              const swapped = options.map(opt => ({
                key: opt.value,    // Use the API's value (raw code) as our key
                value: opt.key     // Use the API's key (description) as our value
              }));
              console.log('AFTER SWAP:', swapped[0]);
              return swapped;
            };

            this.intendedUseOptions.set(swapKeyValue(dropdownData.intendedUse || []));
            this.unitSchemeOptions = swapKeyValue(dropdownData.unitScheme || []);
            this.transfusionStatusOptions.set(swapKeyValue(dropdownData.transfusionStatus || []));
            this.aboOnlyOptions = swapKeyValue(dropdownData.aboOnly || []);

            console.log('Final testedAboOptions[0]:', this.testedAboOptions()[0]);
            console.log('Assigned intendedUseOptions (after swap):', this.intendedUseOptions());
            console.log('Assigned unitSchemeOptions (after swap):', this.unitSchemeOptions);
          }

          this.isLoadingOptions = false;

          // Populate form for edit mode AFTER ALL dropdown options are loaded
          if (this.mode === 'edit' && this.data && this.areDropdownOptionsLoaded()) {
            this.populateFormForEdit();
          }
        },
        error: (error) => {
          this.isLoadingOptions = false;
        }
      });
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    // Guard: Don't populate if dropdown options aren't loaded
    if (!this.areDropdownOptionsLoaded()) {
      return;
    }

    this.isInitializingEditForm = true;
    this.terminationDateManuallyTouched = false;
    const record = this.data;

    console.log('=== POPULATE FORM FOR EDIT ===');
    console.log('Input Record Data:', record);
    console.log('Dropdown Options Available:');
    console.log('  - intendedUseOptions:', this.intendedUseOptions());
    console.log('  - unitSchemeOptions:', this.unitSchemeOptions);

    // Helper function to find the key from dropdown options by matching the value (description)
    const findKeyByValue = (options: DropdownOption[], valueOrKey: string | undefined): string => {
      if (!valueOrKey) return '';

      console.log('findKeyByValue - Input:', valueOrKey);
      console.log('findKeyByValue - Options:', options);

      // First, try to find by exact key match
      const byKey = options.find(opt => opt.key === valueOrKey);
      if (byKey) {
        console.log('Found by key match:', byKey.key);
        return byKey.key;
      }

      // If not found by key, try to find by value match (in case API returns full description)
      const byValue = options.find(opt => opt.value === valueOrKey);
      if (byValue) {
        console.log('Found by value match:', byValue.key);
        return byValue.key;
      }

      // If API returns formatted string like "AB - For Autologous Use / Biohazardous"
      // Extract the code part (everything before " - ")
      if (valueOrKey.includes(' - ')) {
        const code = valueOrKey.split(' - ')[0].trim();
        console.log('Extracted code from formatted string:', code);
        const byCode = options.find(opt => opt.key === code);
        if (byCode) {
          console.log('Found by code match:', byCode.key);
          return byCode.key;
        }
      }

      // If still not found, return the original value
      console.log('No match found, returning original:', valueOrKey);
      return valueOrKey;
    };

    // Map dropdown values to their keys
    const intendedUseKey = findKeyByValue(this.intendedUseOptions(), record.intendedUse);
    const unitSchemeKey = findKeyByValue(this.unitSchemeOptions, record.unitScheme);
    const transfusionStatusKey = findKeyByValue(this.transfusionStatusOptions(), record.transfusionStatus);

    // Handle aboOnly dynamically - use whatever the record provides and let findKeyByValue find the match
    let aboOnlyKey = '';
    if (typeof record.aboOnly === 'boolean') {
      // If boolean, try both Y/N and Yes/No patterns dynamically
      const boolValue = record.aboOnly;
      aboOnlyKey = this.aboOnlyOptions.find(opt =>
        opt.key === (boolValue ? 'Y' : 'N') ||
        opt.value === (boolValue ? 'Yes' : 'No') ||
        opt.key === String(boolValue)
      )?.key || '';
    } else if (record.aboOnly) {
      aboOnlyKey = findKeyByValue(this.aboOnlyOptions, record.aboOnly);
    }

    console.log('ABO Only - Input:', record.aboOnly, 'Type:', typeof record.aboOnly, 'Mapped Key:', aboOnlyKey);
    console.log('Mapped Keys:', { intendedUseKey, unitSchemeKey, transfusionStatusKey, aboOnlyKey });

    // Derive identifier description from intendedUseOptions (value = description after key-value swap)
    let identifierDescription = '';
    if (intendedUseKey) {
      const identOption = this.intendedUseOptions().find(opt => opt.key === intendedUseKey);
      identifierDescription = identOption?.value || '';
    }

    // Store original values for update API (to identify the record) and change detection
    this.originalValues = {
      auditKey: record.auditKey || null,
      testedAbo: record.testedAbo || '',
      intendedUse: intendedUseKey,
      unitScheme: unitSchemeKey,
      aboLabel: record.aboLabel || '',
      aboDescription: record.aboDescription || '',
      bloodTypeCode: record.bloodTypeCode || '',
      transfusionStatus: transfusionStatusKey,
      aboOnly: aboOnlyKey,
      alternateAbo: record.alternateAbo || '',
      usageCode: record.usageCode || '',
      effectiveDate: this.formatDate(record.effectiveDate ? moment(record.effectiveDate) : null),
      terminationDate: this.formatDate(record.terminationDate ? moment(record.terminationDate) : null),
      identifierDescription: identifierDescription
    };

    // Disable non-editable fields in edit mode
    this.form.get('testedAbo')?.disable();
    this.form.get('description')?.disable();
    this.form.get('effectiveDate')?.disable();

    // ABO Label — disable if already has a value (FMB: UpdateAllowed=false, UpdateIfNull=true)
    if (record.aboLabel) {
      this.form.get('aboLabel')?.disable();
    }

    // Alternate ABO — disable if auto-populated (aboOnly='Y' AND unitScheme='C')
    if (aboOnlyKey === 'Y' && unitSchemeKey === 'C') {
      this.form.get('alternateAbo')?.disable();
    }

    // Get description from testedAboOptions if not provided by API
    let description = record.description || '';
    if (!description && record.testedAbo) {
      const option = this.testedAboOptions().find(opt => opt.key === record.testedAbo);
      description = option?.description || option?.value || '';
    }

    this.form.patchValue({
      testedAbo: record.testedAbo || '',
      description: description,
      identifierDescription: identifierDescription,
      intendedUse: intendedUseKey,
      unitScheme: unitSchemeKey,
      aboLabel: record.aboLabel || '',
      aboDescription: record.aboDescription || '',
      bloodTypeCode: record.bloodTypeCode || '',
      transfusionStatus: transfusionStatusKey,
      aboOnly: aboOnlyKey,
      alternateAbo: record.alternateAbo || '',
      usageCode: record.usageCode || '',
      effectiveDate: record.effectiveDate ? moment(record.effectiveDate) : null,
      terminationDate: record.terminationDate ? moment(record.terminationDate) : null
    });

    this.isInitializingEditForm = false;

    // In edit mode, override termination date validators to include past date validation
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.headerService.chapterTimeZone());
      this.setupTerminationDateValidatorsForEdit();
    }
  }

  /**
   * Check if form values differ from original values
   */
  private checkIfFormHasChanges(): boolean {
    if (this.mode !== 'edit' || !this.data) {
      return false;
    }

    const currentValues = this.form.getRawValue();

    // Compare each field with original values
    const intendedUseChanged = currentValues.intendedUse !== this.originalValues.intendedUse;
    const unitSchemeChanged = currentValues.unitScheme !== this.originalValues.unitScheme;
    const aboLabelChanged = currentValues.aboLabel !== this.originalValues.aboLabel;
    const aboDescriptionChanged = currentValues.aboDescription !== this.originalValues.aboDescription;
    const bloodTypeCodeChanged = currentValues.bloodTypeCode !== this.originalValues.bloodTypeCode;
    const transfusionStatusChanged = currentValues.transfusionStatus !== this.originalValues.transfusionStatus;
    const aboOnlyChanged = currentValues.aboOnly !== this.originalValues.aboOnly;
    const alternateAboChanged = currentValues.alternateAbo !== this.originalValues.alternateAbo;
    const usageCodeChanged = currentValues.usageCode !== this.originalValues.usageCode;

    // Compare dates by formatting them consistently
    const currentTerminationDate = this.formatDate(currentValues.terminationDate);
    const terminationDateChanged = currentTerminationDate !== this.originalValues.terminationDate;

    return intendedUseChanged || unitSchemeChanged || aboLabelChanged || aboDescriptionChanged ||
           bloodTypeCodeChanged || transfusionStatusChanged || aboOnlyChanged || alternateAboChanged ||
           usageCodeChanged || terminationDateChanged;
  }

  /**
   * Setup listener for testedAbo changes to:
   * 1. Auto-populate description in add mode
   * 2. Sync alternateAbo when it is disabled (aboOnly='Y' AND unitScheme='C')
   */
  private setupTestedAboListener(): void {
    this.form.get('testedAbo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedCode => {
        // Auto-populate description in add mode
        if (this.mode === 'add' && selectedCode) {
          const option = this.testedAboOptions().find(opt => opt.key === selectedCode);
          const description = option ? (option.description || option.value) : selectedCode;
          this.form.get('description')?.setValue(description, { emitEvent: false });
        }

        // Keep alternateAbo in sync when it is auto-populated (disabled)
        const alternateAboControl = this.form.get('alternateAbo');
        if (alternateAboControl?.disabled) {
          alternateAboControl.setValue(selectedCode || '', { emitEvent: false });
        }
      });
  }

  /**
   * Setup listener for intendedUse changes to auto-populate identifierDescription
   */
  private setupIntendedUseListener(): void {
    this.form.get('intendedUse')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedCode => {
        if (selectedCode) {
          const option = this.intendedUseOptions().find(opt => opt.key === selectedCode);
          const description = option?.value || '';
          this.form.get('identifierDescription')?.setValue(description, { emitEvent: false });
        } else {
          this.form.get('identifierDescription')?.setValue('', { emitEvent: false });
        }
      });
  }

  /**
   * Setup search controls for searchable dropdowns
   */
  private setupSearchControls(): void {
    this.testedAboSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.testedAboSearch.set(value || '');
      });

    this.intendedUseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.intendedUseSearch.set(value || '');
      });

    this.transfusionStatusSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.transfusionStatusSearch.set(value || '');
      });

    this.alternateAboSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.alternateAboSearch.set(value || '');
      });
  }

  /**
   * Applies alternateAbo enabled/disabled/required state based on current aboOnly + unitScheme values.
   * FMB rule: aboOnly='Y' AND unitScheme='C' → auto-set to testedAbo and disable.
   *           aboOnly='N' → required and enabled.
   *           otherwise → optional and enabled.
   */
  private applyAlternateAboState(aboOnlyValue: string, unitSchemeValue: string): void {
    const alternateAboControl = this.form.get('alternateAbo');
    if (!alternateAboControl) return;

    if (aboOnlyValue === 'N') {
      alternateAboControl.setValidators([Validators.required]);
      alternateAboControl.enable({ emitEvent: false });
    } else if (aboOnlyValue === 'Y') {
      alternateAboControl.setValidators([]);
      if (unitSchemeValue === 'C') {
        const testedAbo = this.form.getRawValue().testedAbo;
        alternateAboControl.setValue(testedAbo || '', { emitEvent: false });
        alternateAboControl.disable({ emitEvent: false });
      } else {
        if (alternateAboControl.disabled) {
          alternateAboControl.setValue('', { emitEvent: false });
        }
        alternateAboControl.enable({ emitEvent: false });
      }
    } else {
      alternateAboControl.setValidators([]);
      alternateAboControl.enable({ emitEvent: false });
    }

    alternateAboControl.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Setup dynamic validation and auto-populate for Alternate ABO based on ABO Only + Unit Scheme.
   * Listens to both fields so any change order correctly updates alternateAbo state.
   */
  private setupAlternateAboValidation(): void {
    this.form.get('aboOnly')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(aboOnlyValue => {
        const unitScheme = this.form.get('unitScheme')?.value;
        this.applyAlternateAboState(aboOnlyValue, unitScheme);
      });

    this.form.get('unitScheme')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(unitSchemeValue => {
        const aboOnly = this.form.get('aboOnly')?.value;
        this.applyAlternateAboState(aboOnly, unitSchemeValue);
      });
  }

  /**
   * Custom validator to ensure Alternate ABO is different from Tested ABO when required
   */
  private alternateAboValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    if (!formGroup) return null;

    const testedAbo = formGroup.get('testedAbo')?.value;
    const alternateAbo = formGroup.get('alternateAbo')?.value;
    const aboOnly = formGroup.get('aboOnly')?.value;

    if (aboOnly === 'N' && testedAbo && alternateAbo && testedAbo === alternateAbo) {
      return { alternateAboSameAsTestd: true };
    }

    return null;
  }

  /**
   * Cross-field validator: when unitScheme='C' (Codabar), intendedUse must be 'RG' or 'EM'.
   * Source: FMB UNIT_SCHEME_TYPE VALIDATE_FIELD trigger — error 9720.
   */
  private unitSchemeIdentifierValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    if (!formGroup) return null;

    const unitScheme = formGroup.get('unitScheme')?.value;
    const intendedUse = formGroup.get('intendedUse')?.value;

    if (unitScheme === 'C' && intendedUse && !['RG', 'EM'].includes(intendedUse)) {
      return { codabarRequiresRgOrEm: true };
    }

    return null;
  }

  private formatDate(date: Moment | Date | null): string | null {
    if (!date) return null;

    // If it's a Moment object, use moment's format (no timezone conversion)
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }

    // If it's a Date object, convert to local date string
    if (date instanceof Date) {
      return moment(date).format('YYYY-MM-DD');
    }

    return null;
  }

  private enableAllFields(): void {
    this.form.get('testedAbo')?.enable();
    // description and identifierDescription remain disabled (readonly in both modes)
    this.form.get('effectiveDate')?.enable();
    this.form.get('aboLabel')?.enable();
    this.form.get('alternateAbo')?.enable();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (!this.isFormValid) {
      this.snackBar.open(
        'Please correct the highlighted errors before saving.',
        'DISMISS',
        {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['custom-snackbar'],
        }
      );
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: AboValuesDto = {
        testedAbo: formValue.testedAbo?.trim() || '',
        intendedUse: formValue.intendedUse || '',
        unitScheme: formValue.unitScheme || '',
        aboLabel: formValue.aboLabel || '',
        aboDescription: formValue.aboDescription || '',
        transfusionStatus: formValue.transfusionStatus || '',
        bloodTypeCode: formValue.bloodTypeCode || '',
        aboOnly: formValue.aboOnly || '',
        alternateAbo: formValue.alternateAbo || '',
        usageCode: formValue.usageCode || '',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
      };
      apiCall = this.aboValuesService.addAboValues(addPayload);
    } else {
      console.log('=== UPDATE MODE DEBUG ===');
      console.log('Original Values Stored:', this.originalValues);
      console.log('Form Values:', formValue);

      const updatePayload: UpdateAboValuesDto = {
        // Audit key for identifying the record
        auditKey: this.originalValues.auditKey!,
        // Original values (to identify the record)
        originalTestedAbo: this.originalValues.testedAbo,
        originalIntendedUse: this.originalValues.intendedUse,
        originalUnitScheme: this.originalValues.unitScheme,
        // New values (editable fields)
        intendedUse: formValue.intendedUse || '',
        unitScheme: formValue.unitScheme || '',
        aboLabel: formValue.aboLabel || '',
        aboDescription: formValue.aboDescription || '',
        transfusionStatus: formValue.transfusionStatus || '',
        bloodTypeCode: formValue.bloodTypeCode || '',
        aboOnly: formValue.aboOnly || '',
        alternateAbo: formValue.alternateAbo || '',
        usageCode: formValue.usageCode || '',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
      };

      console.log('Final Update Payload:', updatePayload);
      apiCall = this.aboValuesService.updateAboValues(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const testedAbo = this.mode === 'add'
            ? formValue.testedAbo?.trim()
            : this.originalValues.testedAbo;

          // Always use our custom message format
          const message = this.mode === 'add'
            ? `New rule for Tested ABO ${testedAbo} added successfully.`
            : `Rule for Tested ABO ${testedAbo} updated successfully.`;

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['custom-snackbar']
          });

          this.saveSuccess.emit();
        },
        error: () => {
          // Error handling is now done by HTTP interceptor
          // This empty callback prevents errors from propagating
        }
      });
  }

  // Error message getters
  getFieldError(fieldName: string, label: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return `${label} is required`;
    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `${label} must be at least ${minLength} characters`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `${label} cannot exceed ${maxLength} characters`;
    }
    return '';
  }

  /**
   * Error for Intended Use — includes cross-field Codabar validation (FMB error 9720).
   */
  getIntendedUseError(): string {
    const control = this.form.get('intendedUse');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Intended Use is required';
    if (this.form.errors?.['codabarRequiresRgOrEm']) {
      return 'For Codabar (C) scheme, Intended Use must be RG or EM';
    }
    return '';
  }

  get isFormValid(): boolean {
    // In edit mode, some fields are disabled, so we need to check validity differently
    if (this.mode === 'edit') {
      // Get all form values including disabled ones
      const formValue = this.form.getRawValue();

      // Check base required fields
      const baseFieldsValid = !!(
        formValue.intendedUse &&
        formValue.unitScheme &&
        formValue.aboLabel &&
        formValue.aboDescription &&
        formValue.transfusionStatus &&
        formValue.aboOnly
      );

      // If aboOnly is 'N', alternateAbo is required
      if (formValue.aboOnly === 'N') {
        if (!baseFieldsValid || !formValue.alternateAbo) {
          return false;
        }
      } else if (!baseFieldsValid) {
        return false;
      }

      // Check for visible validation errors
      const hasVisibleErrors =
        this.getEffectiveDateError() !== '' ||
        this.getTerminationDateError() !== '';

      return !hasVisibleErrors;
    }

    return this.form.valid;
  }

  get hasFormChanges(): boolean {
    // Don't report changes while form is being initialized
    if (this.isInitializingEditForm) {
      return false;
    }
    return this.checkIfFormHasChanges();
  }

  /**
   * Get display text for Tested ABO field
   */
  getTestedAboDisplay(): string {
    const testedAboKey = this.form.getRawValue().testedAbo;
    if (!testedAboKey) return '';

    const option = this.testedAboOptions().find(opt => opt.key === testedAboKey);
    return option?.value || testedAboKey;
  }

  /**
   * Get formatted display text for Effective Date field
   */
  getEffectiveDateDisplay(): string {
    const effectiveDate = this.form.getRawValue().effectiveDate;
    if (!effectiveDate) return '';

    if (moment.isMoment(effectiveDate)) {
      return effectiveDate.format('DD-MMM-YYYY').toUpperCase();
    }

    return moment(effectiveDate).format('DD-MMM-YYYY').toUpperCase();
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    const termControl = this.form.get('terminationDate');

    // In edit mode, only show termination date past error if the user has manually touched the field
    if (this.mode === 'edit' && termControl?.hasError('terminationDatePast')) {
      // Don't show error if user hasn't manually interacted with the field
      if (!this.terminationDateManuallyTouched) {
        return '';
      }
    }

    return DateFieldValidationUtility.getEndDateCrossFieldError(
      termControl, 'Termination Date', 'Effective Date', formErrors
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

  onTerminationDateFocus(): void {
    if (this.mode === 'edit') {
      this.terminationDateManuallyTouched = true;
    }
  }

  /**
   * ABO Label is read-only in edit mode when the record already has a value set.
   * FMB: UpdateAllowed=false, UpdateIfNull=true on ABO_LABEL item.
   */
  get isAboLabelReadOnly(): boolean {
    return this.mode === 'edit' && !!this.originalValues.aboLabel;
  }

  /**
   * Check if Alternate ABO is required (when ABO Only is 'N')
   */
  get isAlternateAboRequired(): boolean {
    return this.form.get('aboOnly')?.value === 'N';
  }

  /**
   * Get error message for Alternate ABO field
   */
  getAlternateAboError(): string {
    const control = this.form.get('alternateAbo');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Alternate ABO is required';
    }

    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Alternate ABO cannot exceed ${maxLength} characters`;
    }

    // Check form-level validator error
    if (this.form.errors?.['alternateAboSameAsTestd']) {
      return 'Alternate ABO must be different from Tested ABO';
    }

    return '';
  }

}
