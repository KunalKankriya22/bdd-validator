import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { requiredTrimmedValidator } from '@shared/validators/input.validators';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { DefinePhysicalFindingsValuesModel, LookupItem, PhysicalFindingsLookups, PhysicalRuleFormData } from '../models/define-physical-findings-values.model';
import { DefinePhysicalFindingsValuesService } from '../services/define-physical-findings-values.service';

@Component({
  selector: 'app-add-edit-physical-rule',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-physical-rule.html',
  styleUrls: ['./add-edit-physical-rule.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditPhysicalRule implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DefinePhysicalFindingsValuesModel | null = null;
  @Input() lookups: PhysicalFindingsLookups | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  physicalRuleForm!: FormGroup;
  isSubmitting = false;
  submittingAction: 'add' | 'addAnother' | null = null;
  errorMessage = '';
  isLoadingDropdowns = false;

  private isInitializingEditForm = false;
  readonly hasChanges = signal(false);

  // Dynamic dropdown options loaded from API (signals for reactivity)
  private readonly donationTypesSignal = signal<LookupItem[]>([]);
  private readonly procedureCodesSignal = signal<LookupItem[]>([]);
  private readonly physicalCodesSignal = signal<LookupItem[]>([]);
  private readonly interdictionsSignal = signal<LookupItem[]>([]);
  private readonly equipmentTypesSignal = signal<LookupItem[]>([]);

  // Search controls for ngx-mat-select-search
  readonly donationTypeSearchCtrl = new FormControl('');
  readonly procedureCodeSearchCtrl = new FormControl('');
  readonly physicalCodeSearchCtrl = new FormControl('');
  readonly operatorSearchCtrl = new FormControl('');
  readonly interdictionSearchCtrl = new FormControl('');
  readonly equipmentTypeSearchCtrl = new FormControl('');

  // Search signals
  private readonly donationTypeSearch = signal('');
  private readonly procedureCodeSearch = signal('');
  private readonly physicalCodeSearch = signal('');
  private readonly operatorSearch = signal('');
  private readonly interdictionSearch = signal('');
  private readonly equipmentTypeSearch = signal('');

  // Filtered options as computed signals
  readonly filteredDonationTypes = computed(() => this.filterItems(this.donationTypesSignal(), this.donationTypeSearch()));
  readonly filteredProcedureCodes = computed(() => this.filterItems(this.procedureCodesSignal(), this.procedureCodeSearch()));
  readonly filteredPhysicalCodes = computed(() => this.filterItems(this.physicalCodesSignal(), this.physicalCodeSearch()));
  readonly filteredOperators = computed(() => this.filterItems(this.operatorOptions, this.operatorSearch()));
  readonly filteredInterdictions = computed(() => this.filterItems(this.interdictionsSignal(), this.interdictionSearch()));
  readonly filteredEquipmentTypes = computed(() => this.filterItems(this.equipmentTypesSignal(), this.equipmentTypeSearch()));

  // Display function for mat-select-trigger
  displayLookupItem = (item: LookupItem | string | null): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (item.key === item.value) return item.key || '';
    return item.value ? `${item.key} - ${item.value}` : (item.key || '');
  };

  // Compare function for mat-select with object values
  compareLookupItems = (a: LookupItem | null, b: LookupItem | null): boolean => {
    if (!a || !b) return false;
    return a.key === b.key;
  };

  // Static dropdown options (hardcoded validation values)
  dataTypes = [
    { value: 'N', display: 'Numeric' },
    { value: 'C', display: 'Character' },
    { value: 'D', display: 'Decimal' }
  ];

  operatorOptions = [
    { key: 'BETWEEN', value: 'BETWEEN' },
    { key: 'EQUAL', value: 'EQUAL' },
    { key: 'LESS', value: 'LESS' },
    { key: 'MORE', value: 'MORE' },
    { key: 'INRANGE', value: 'INRANGE' }
  ];  // Per FMB Analysis

  genderOptions = [
    { value: 'M', display: 'Male' },
    { value: 'F', display: 'Female' },
    { value: 'A', display: 'All' }
  ];

  yesNoOptions = [
    { value: 'Y', display: 'Yes' },
    { value: 'N', display: 'No' }
  ];

  yesOrBlankOptions = [
    { value: 'Y', display: 'Yes' },
    { value: '', display: '' }
  ];

  // Date constraints
  minDate = DateFieldValidationUtility.getMinDate();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();
  private formSubs$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private elRef: ElementRef<HTMLElement>,
    private definePhysicalFindingsValuesService: DefinePhysicalFindingsValuesService,
    private headerService: HeaderService
  ) {}

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupSearchSubscriptions();

    if (this.lookups) {
      this.populateDropdownsFromLookups(this.lookups);
    } else {
      this.loadDropdownData();
    }
    setTimeout(() => { this.hasChanges.set(false); });
  }

  ngOnDestroy(): void {
    this.formSubs$.next();
    this.formSubs$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.physicalRuleForm) return;
    if (changes['data'] || changes['mode']) {
      this.errorMessage = '';
      this.initializeForm();
      if (this.lookups) {
        this.populateDropdownsFromLookups(this.lookups);
      }
      setTimeout(() => { this.hasChanges.set(false); });
      this.cdr.markForCheck();
    }
  }

  // --- Custom Validators ---

  /** Validates value based on selected data type (N=numeric, D=decimal, C=character) */
  private dataTypeValueValidator(dataTypeControlName: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !control.parent) return null;
      const dataType = control.parent.get(dataTypeControlName)?.value;
      const value = control.value.toString().trim();
      if (!value) return null;

      switch (dataType) {
        case 'N': // Numeric: only whole numbers
          return /^[0-9]+$/.test(value) ? null : { invalidNumeric: true };
        case 'D': // Decimal: valid decimal numbers (must have decimal point)
          return /^(\.[0-9]+|[0-9]+\.[0-9]+)$/.test(value) ? null : { invalidDecimal: true };
        case 'C': // Character: only alphabetic characters and spaces
          return /^[a-zA-Z\s]+$/.test(value) ? null : { invalidCharacter: true };
        default:
          return null;
      }
    };
  }

  /** Cross-field validator: maximumValue must be greater than minimumValue for Numeric and Decimal data types */
  private maxGreaterThanMinValidator(group: FormGroup): ValidationErrors | null {
    const dataType = group.get('dataType')?.value;
    const minValue = group.get('minimumValue')?.value?.toString().trim();
    const maxValue = group.get('maximumValue')?.value?.toString().trim();

    // Only validate for Numeric (N) and Decimal (D) data types
    if (dataType !== 'N' && dataType !== 'D') return null;
    // Only validate when both values are provided
    if (!minValue || !maxValue) return null;

    const min = Number(minValue);
    const max = Number(maxValue);

    if (isNaN(min) || isNaN(max)) return null;

    if (max <= min) {
      return { maxMustBeGreaterThanMin: true };
    }
    return null;
  }

  /** Cross-field validator: fromAge and toAge must be provided together */
  private agePairValidator(group: FormGroup): ValidationErrors | null {
    const fromAge = group.get('fromAge')?.value;
    const toAge = group.get('toAge')?.value;
    const hasFrom = fromAge !== null && fromAge !== '' && fromAge !== undefined;
    const hasTo = toAge !== null && toAge !== '' && toAge !== undefined;

    if (hasFrom !== hasTo) {
      return { agePairRequired: true };
    }
    if (hasFrom && hasTo && Number(fromAge) >= Number(toAge)) {
      return { ageFromMustBeLessThanTo: true };
    }
    return null;
  }

  /** Validates age is between 1 and 999 (no zero allowed) */
  private ageRangeValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === '' || control.value === undefined) return null;
    const age = Number(control.value);
    if (age === 0) return { zeroAge: true };
    if (age < 1 || age > 999) return { ageOutOfRange: true };
    return null;
  }

  private initializeForm(): void {
    this.formSubs$.next(); // cancel previous form subscriptions
    const isEdit = this.mode === 'edit' && this.data;
    this.physicalRuleForm = this.fb.group({
      donationType: [null, Validators.required],
      procedureCode: [null, Validators.required],
      physicalCode: [null, Validators.required],
      dataType: [isEdit ? this.data!.dataType : null, Validators.required],
      minimumValue: [isEdit ? (this.data!.minimumValue || '') : '', [requiredTrimmedValidator(), Validators.maxLength(5), this.dataTypeValueValidator('dataType')]],
      maximumValue: [isEdit ? (this.data!.maximumValue || '') : '', [Validators.maxLength(5), this.dataTypeValueValidator('dataType')]],
      operator: [isEdit ? this.findOperatorItem(this.data!.operator) : null, Validators.required],
      gender: [isEdit ? this.data!.gender : null, Validators.required],
      fromAge: [isEdit ? (this.data!.fromAge || null) : null, [this.ageRangeValidator]],
      toAge: [isEdit ? (this.data!.toAge || null) : null, [this.ageRangeValidator]],
      interdiction: [null],
      commentsRequired: [isEdit ? (this.data!.commentsRequired || 'N') : null, Validators.required],
      manualAuditRequired: [isEdit ? (this.data!.manualAuditRequired || 'N') : null, Validators.required],
      equipmentType: [null],
      effectiveDate: [isEdit && this.data!.effectiveDate ? moment(this.data!.effectiveDate) : null],
      terminationDate: [isEdit && this.data!.terminationDate ? moment(this.data!.terminationDate) : null]
    }, {
      validators: [this.agePairValidator, this.maxGreaterThanMinValidator, DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Setup date validators based on mode (matches valid-abo pattern)
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.physicalRuleForm, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.physicalRuleForm, this.chapterOffset);
    }

    // In edit mode, clear matDatepickerMin error on existing termination date
    // (past dates are valid for existing records, only new selections are constrained)
    if (this.mode === 'edit') {
      this.physicalRuleForm.get('donationType')?.disable();

      // Mark min/max as touched so cross-field validation errors show immediately
      const minControl = this.physicalRuleForm.get('minimumValue');
      const maxControl = this.physicalRuleForm.get('maximumValue');
      if (minControl?.value) minControl.markAsTouched();
      if (maxControl?.value) maxControl.markAsTouched();

      // Mark termination date as touched if it's in the past so error shows immediately
    }

    this.physicalRuleForm.get('donationType')?.valueChanges.pipe(takeUntil(this.formSubs$)).subscribe(() => this.cdr.markForCheck());
    this.physicalRuleForm.get('procedureCode')?.valueChanges.pipe(takeUntil(this.formSubs$)).subscribe(() => this.cdr.markForCheck());
    this.physicalRuleForm.get('physicalCode')?.valueChanges.pipe(takeUntil(this.formSubs$)).subscribe(() => this.cdr.markForCheck());

    this.physicalRuleForm.get('dataType')?.valueChanges
      .pipe(takeUntil(this.formSubs$))
      .subscribe(() => {
        const minControl = this.physicalRuleForm.get('minimumValue');
        const maxControl = this.physicalRuleForm.get('maximumValue');
        // Clear values when data type changes — different types have incompatible formats
        minControl?.setValue('', { emitEvent: false });
        maxControl?.setValue('', { emitEvent: false });
        minControl?.markAsUntouched();
        maxControl?.markAsUntouched();
        minControl?.updateValueAndValidity();
        maxControl?.updateValueAndValidity();
        this.cdr.markForCheck();
      });

    this.physicalRuleForm.get('operator')?.valueChanges
      .pipe(takeUntil(this.formSubs$))
      .subscribe(() => {
        this.updateMaximumValueValidators();
        this.cdr.markForCheck();
      });

    this.updateMaximumValueValidators();

    this.physicalRuleForm.valueChanges
      .pipe(takeUntil(this.formSubs$))
      .subscribe(() => {
        this.hasChanges.set(true);
      });

    this.physicalRuleForm.get('minimumValue')?.valueChanges
      .pipe(takeUntil(this.formSubs$))
      .subscribe(() => {
        const control = this.physicalRuleForm.get('minimumValue');
        if (control?.dirty) control.markAsTouched();
        this.cdr.markForCheck();
      });
    this.physicalRuleForm.get('maximumValue')?.valueChanges
      .pipe(takeUntil(this.formSubs$))
      .subscribe(() => {
        const control = this.physicalRuleForm.get('maximumValue');
        if (control?.dirty) control.markAsTouched();
        this.cdr.markForCheck();
      });

    this.physicalRuleForm.get('fromAge')?.valueChanges
      .pipe(takeUntil(this.formSubs$))
      .subscribe(() => {
        this.physicalRuleForm.get('toAge')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });
    this.physicalRuleForm.get('toAge')?.valueChanges
      .pipe(takeUntil(this.formSubs$))
      .subscribe(() => {
        this.physicalRuleForm.get('fromAge')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.physicalRuleForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.formSubs$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.physicalRuleForm.get('effectiveDate')?.markAsTouched();
        this.physicalRuleForm.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.physicalRuleForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.formSubs$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.cdr.markForCheck();
      });
  }

  /** Update validators on maximumValue based on operator */
  private updateMaximumValueValidators(): void {
    const maxControl = this.physicalRuleForm.get('maximumValue');
    if (!maxControl) return;

    maxControl.setValidators([Validators.maxLength(5), this.dataTypeValueValidator('dataType')]);
    maxControl.updateValueAndValidity();
  }

  // Get description for selected dropdown values
  get donationTypeDescription(): string {
    const selected = this.physicalRuleForm.get('donationType')?.value;
    if (!selected || typeof selected === 'string') return '';
    return selected.value || '';
  }

  get procedureCodeDescription(): string {
    const selected = this.physicalRuleForm.get('procedureCode')?.value;
    if (!selected || typeof selected === 'string') return '';
    return selected.value || '';
  }

  get physicalCodeDescription(): string {
    const selected = this.physicalRuleForm.get('physicalCode')?.value;
    if (!selected || typeof selected === 'string') return '';
    return selected.value || '';
  }

  get terminationMinDate(): moment.Moment {
    const effectiveDate = this.mode === 'edit' && this.data?.effectiveDate
      ? moment(this.data.effectiveDate).startOf('day')
      : this.physicalRuleForm?.get('effectiveDate')?.value
        ? moment(this.physicalRuleForm.get('effectiveDate')?.value).startOf('day')
        : null;

    if (effectiveDate?.isAfter(this.minDate)) {
      return effectiveDate;
    }
    return this.minDate;
  }

  private populateDropdownsFromLookups(lookups: PhysicalFindingsLookups): void {
    const donationTypes = lookups?.donationTypes || [];
    const procedureCodes = lookups?.procedureCodes || [];
    const physicalCodes = lookups?.physicalCodes || [];
    const interdictions = lookups?.interdictionCodes || [];
    const equipmentTypes = lookups?.equipmentTypes || [];

    this.donationTypesSignal.set(donationTypes);
    this.procedureCodesSignal.set(procedureCodes);
    this.physicalCodesSignal.set(physicalCodes);
    this.interdictionsSignal.set(interdictions);
    this.equipmentTypesSignal.set(equipmentTypes);

    // Set form values to matching lookup objects
    if (this.data) {
      this.setFormValueToLookupObject('donationType', donationTypes, this.data.donationType);
      this.setFormValueToLookupObject('procedureCode', procedureCodes, this.data.procedureCode);
      this.setFormValueToLookupObject('physicalCode', physicalCodes, this.data.physicalCode);
      this.setFormValueToLookupObject('interdiction', interdictions, this.data.interdiction);
      this.setFormValueToLookupObject('equipmentType', equipmentTypes, this.data.equipmentType);
    }

    this.isLoadingDropdowns = false;
    this.cdr.markForCheck();
  }

  private setFormValueToLookupObject(controlName: string, items: LookupItem[], key: string | undefined): void {
    if (!key) return;
    const match = items.find(item => (item.key || item) === key);
    if (match) {
      this.physicalRuleForm.get(controlName)?.setValue(match, { emitEvent: false, onlySelf: true });
    }
  }

  private findOperatorItem(key: string | undefined): LookupItem | null {
    if (!key) return null;
    return this.operatorOptions.find(item => item.key === key) || null;
  }

  private setupSearchSubscriptions(): void {
    this.donationTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.donationTypeSearch.set(v || ''));
    this.procedureCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.procedureCodeSearch.set(v || ''));
    this.physicalCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.physicalCodeSearch.set(v || ''));
    this.operatorSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.operatorSearch.set(v || ''));
    this.interdictionSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.interdictionSearch.set(v || ''));
    this.equipmentTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.equipmentTypeSearch.set(v || ''));
  }

  private filterItems(items: LookupItem[], search: string): LookupItem[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item => {
      const key = (item.key || item || '').toString().toLowerCase();
      const value = (item.value || '').toString().toLowerCase();
      return key.includes(lower) || value.includes(lower);
    });
  }

  /** Reset search when dropdown closes so all items show on next open */
  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  private loadDropdownData(): void {
    this.isLoadingDropdowns = true;

    this.definePhysicalFindingsValuesService.getLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups) => {
          this.populateDropdownsFromLookups(lookups);
          setTimeout(() => { this.hasChanges.set(false); });
        },
        error: () => {
          this.isLoadingDropdowns = false;
          this.errorMessage = 'Failed to load dropdown data. Please refresh the page.';
          this.cdr.markForCheck();
        }
      });
  }

  private focusFirstInvalidField(): void {
    const firstInvalidKey = Object.keys(this.physicalRuleForm.controls)
      .find(key => {
        const ctrl = this.physicalRuleForm.controls[key];
        return ctrl.invalid && ctrl.enabled;
      });
    if (!firstInvalidKey) return;
    const el = this.elRef.nativeElement.querySelector<HTMLElement>(`[formControlName="${firstInvalidKey}"]`);
    if (el) {
      setTimeout(() => el.focus(), 100);
    }
  }

  onSubmit(keepOpen = false): void {
    // Trigger validation on all controls including cross-field validators
    this.physicalRuleForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.physicalRuleForm, 'terminationDate');
    this.physicalRuleForm.updateValueAndValidity();

    if (this.physicalRuleForm.invalid) {
      // Build specific error message for form-level errors
      if (this.physicalRuleForm.hasError('maxMustBeGreaterThanMin')) {
        this.errorMessage = 'Maximum Value must be greater than Minimum Value.';
      } else if (this.physicalRuleForm.hasError('agePairRequired')) {
        this.errorMessage = 'Both From Age and To Age must be provided together.';
      } else if (this.physicalRuleForm.hasError('ageFromMustBeLessThanTo')) {
        this.errorMessage = 'From Age must be less than To Age.';
      }
      this.focusFirstInvalidField();
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.submittingAction = keepOpen ? 'addAnother' : 'add';
    this.errorMessage = '';
    this.cdr.markForCheck();

    const formValue = this.physicalRuleForm.getRawValue();
    const physicalRuleData: PhysicalRuleFormData = {
      ...formValue,
      donationType: formValue.donationType?.key || formValue.donationType || '',
      procedureCode: formValue.procedureCode?.key || formValue.procedureCode || '',
      physicalCode: formValue.physicalCode?.key || formValue.physicalCode || '',
      interdiction: formValue.interdiction?.key || formValue.interdiction || '',
      equipmentType: formValue.equipmentType?.key || formValue.equipmentType || '',
      operator: formValue.operator?.key || formValue.operator || '',
      effectiveDate: formValue.effectiveDate instanceof Date ? formValue.effectiveDate : formValue.effectiveDate?.toDate(),
      terminationDate: formValue.terminationDate ? (formValue.terminationDate instanceof Date ? formValue.terminationDate : formValue.terminationDate?.toDate()) : null
    };

    // For edit mode: send original values as procedureCode/physicalCode (to find record)
    // and current form values as newProcedureCode/newPhysicalCode (to update)
    if (this.mode === 'edit' && this.data) {
      physicalRuleData.procedureCode = this.data.procedureCode!;
      physicalRuleData.physicalCode = this.data.physicalCode;
      physicalRuleData.newProcedureCode = formValue.procedureCode?.key || formValue.procedureCode;
      physicalRuleData.newPhysicalCode = formValue.physicalCode?.key || formValue.physicalCode;
    }

    const saveOperation = this.mode === 'add'
      ? this.definePhysicalFindingsValuesService.createPhysicalRule(physicalRuleData)
      : this.definePhysicalFindingsValuesService.updatePhysicalRule(physicalRuleData);

    saveOperation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.submittingAction = null;
          this.cdr.markForCheck();
          const physicalCodeVal = this.physicalRuleForm.get('physicalCode')?.value;
          const physicalCode = physicalCodeVal?.key || physicalCodeVal || '';
          const message = this.mode === 'add'
            ? `Physical Rule ${physicalCode} added successfully.`
            : `Physical Rule ${physicalCode} updated successfully.`;
          this.showNotification(message, 'success');
          this.saveSuccess.emit();

          if (keepOpen) {
            this.resetForm();
          } else {
            this.onClose();
          }
        },
        error: (error) => {
          const errorText = error?.error?.errorResponse?.error || error?.error?.message || error?.error?.error || error?.message || 'Failed to save physical rule. Please try again.';
          const errorCode = error?.error?.errorResponse?.errorCode || error?.error?.errorCode || '';
          let errorMsg: string;
          if (errorCode) {
            errorMsg = `Error ${errorCode} : ${errorText}`;
          } else {
            const match = errorText.match(/^(\d+)\s*-\s*(.+)$/);
            errorMsg = match ? `Error ${match[1]} : ${match[2]}` : errorText;
          }
          this.errorMessage = errorMsg;
          this.showNotification(errorMsg, 'error');
          this.isSubmitting = false;
          this.submittingAction = null;
          this.cdr.markForCheck();
        }
      });
  }

  /** Reset form to defaults for adding another record */
  private resetForm(): void {
    this.physicalRuleForm.reset({
      donationType: null,
      procedureCode: null,
      physicalCode: null,
      dataType: null,
      minimumValue: '',
      maximumValue: '',
      operator: null,
      gender: null,
      fromAge: null,
      toAge: null,
      interdiction: null,
      commentsRequired: null,
      manualAuditRequired: null,
      equipmentType: null,
      effectiveDate: null,
      terminationDate: null
    });
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  /** Format effective date for display in edit mode */
  get editEffectiveDateDisplay(): string {
    const date = this.physicalRuleForm.get('effectiveDate')?.value;
    if (!date) return '-';
    return DateFieldValidationUtility.formatDateForUI(date)?.toUpperCase() || '-';
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'DISMISS', {
      ...(type === 'success' ? { duration: 5000 } : {}),
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }

  /** Allow only numeric digits in age fields */
  onAgeKeyPress(event: KeyboardEvent): void {
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.physicalRuleForm.get('effectiveDate')
    );
    this.cdr.markForCheck();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.physicalRuleForm.get('terminationDate'), this.mode === 'edit'
    );
    this.cdr.markForCheck();
  }

  getEffectiveDateError(): string {
    const control = this.physicalRuleForm.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }
    if (control.hasError('required')) return 'Effective Date is required';
    if (control.hasError('effectiveDatePast')) return 'Effective Date cannot be past date';

    const effVal = control.value;
    const termVal = this.physicalRuleForm.get('terminationDate')?.value;
    if (effVal && termVal) {
      const eff = moment(effVal).startOf('day');
      const term = moment(termVal).startOf('day');
      if (eff.isAfter(term)) {
        return 'Effective Date must be less than or equal to Termination Date';
      }
    }
    return '';
  }

  getTerminationDateError(): string {
    const control = this.physicalRuleForm.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    // Manual validation for edit mode (no [min] binding used)
    if (this.mode === 'edit' && control.value && control.dirty) {
      const selected = moment(control.value).startOf('day');
      if (selected.isBefore(this.minDate)) {
        return 'Termination Date cannot be a past date';
      }
      const effDate = this.data?.effectiveDate ? moment(this.data.effectiveDate).startOf('day') : null;
      if (effDate && selected.isBefore(effDate)) {
        return 'Termination Date must be greater than or equal to Effective Date';
      }
    }

    const formErrors = this.lastChangedDateField === 'termination' ? this.physicalRuleForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      control, 'Termination Date', 'Effective Date', formErrors
    );
  }

  readonly terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const selected = date.clone().startOf('day');
    const today = moment(this.minDate).startOf('day');
    if (selected.isBefore(today)) return false;
    const effDate = this.data?.effectiveDate ? moment(this.data.effectiveDate).startOf('day') : null;
    if (effDate && selected.isBefore(effDate)) return false;
    return true;
  };

  onYesNoChange(): void {
    this.hasChanges.set(true);
  }

  onClose(): void {
    this.closePanel.emit();
  }

  get panelTitle(): string {
    return this.mode === 'add' ? 'Add New Physical Rule' : 'Edit Physical Rule';
  }
}

