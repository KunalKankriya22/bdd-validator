import { Component, OnInit, OnDestroy, OnChanges, AfterViewInit, SimpleChanges, EventEmitter, Input, Output, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, switchMap, catchError, of } from 'rxjs';
import moment, { Moment } from 'moment';

import { SetupInventoryLevelsApiService } from '../services/setup-inventory-levels-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import {
  CreateSetInventoryLevelDto,
  UpdateSetInventoryLevelDto,
  SetInventoryLevelDisplay,
  ProductTypeLOV,
  BloodTypeLOV,
  AttributeGroupLOV,
  AttributeCodeLOV,
  InventoryTypeLOV
} from '../models/setup-inventory-levels.model';

@Component({
  selector: 'app-add-edit-inventory-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-inventory-dialog.html',
  styleUrls: ['./add-edit-inventory-dialog.scss']
})
export class AddEditInventoryDialog implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() inventoryClass!: string;
  @Input() data: SetInventoryLevelDisplay | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @ViewChild('closeBtn', { read: ElementRef }) closeBtn?: ElementRef<HTMLElement>;

  private fb = inject(FormBuilder);
  private service = inject(SetupInventoryLevelsApiService);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  isSaving = false;
  panelTitle: string = '';
  lastUpdated: string = '';
  duplicateError = false;
  duplicateErrorMessage = '';

  // Edit mode display values (read-only fields)
  editModeValues = {
    inventoryClass: '',
    inventoryLevel: '',
    productType: '',
    aborh: '',
    attribute: '',
    effectiveDate: ''
  };

  // LOV Data
  productTypes: ProductTypeLOV[] = [];
  bloodTypes: BloodTypeLOV[] = [];
  attributeGroups: AttributeGroupLOV[] = [];

  // Combined attributes for Add/Edit mode (group + code combined)
  combinedAttributes: Array<{ display: string; value: string; group: string; code: string; desc: string }> = [];

  // Search controls for dropdowns
  productTypeSearchControl = new FormControl<string>('');
  aborhSearchControl = new FormControl<string>('');
  attributeSearchControl = new FormControl<string>('');

  // Filtered options for dropdowns
  filteredProductTypes: ProductTypeLOV[] = [];
  filteredBloodTypes: BloodTypeLOV[] = [];
  filteredCombinedAttributes: Array<{ display: string; value: string; group: string; code: string; desc: string }> = [];

  // Date configuration
  minDate: Moment;
  terminationMinDate: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private termDateRawInput: string = '';
  private effDateRawInput: string = '';

  // Simple error state matchers
  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      return !!(control && control.invalid && (control.dirty || control.touched));
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      return !!(control && control.invalid && (control.dirty || control.touched));
    }
  };

  optQtyErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control) return false;
      const hasFieldError = control.invalid && (control.dirty || control.touched);
      const hasFormError = this.form?.hasError('optimalNotGreater');
      return hasFieldError || !!hasFormError;
    }
  };

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `add-edit-inventory-dialog-${AddEditInventoryDialog.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.initializeForm();
    this.loadLOVs();
    this.setupSearchFilters();

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
      // Append persistent format validators
      const effControl = this.form.get('effDate');
      effControl?.addValidators(this.effDateInvalidValidator);
      effControl?.updateValueAndValidity();

      const termControl = this.form.get('termDate');
      termControl?.addValidators(this.termDateInvalidValidator);
      termControl?.updateValueAndValidity();
    } else {
      this.populateFormForEdit();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
      this.setupTerminationDateValidatorsForEdit();
      // Append persistent format validator for termination date
      const termControl = this.form.get('termDate');
      termControl?.addValidators(this.termDateInvalidValidator);
      termControl?.updateValueAndValidity();
    }

    // NOTE: Chapter change handling is done by parent component
    // Parent sets sidePanelOpen = false which destroys this component via *ngIf

    // Clear duplicate error when form values change
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.duplicateError) {
          this.duplicateError = false;
          this.duplicateErrorMessage = '';
        }
      });

    // Update validation when minQty changes
    this.form.get('minQty')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('optQty')?.updateValueAndValidity({ emitEvent: false });
      });

    // Update validation when optQty changes
    this.form.get('optQty')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.updateValueAndValidity({ emitEvent: false });
      });

    // Track when effective date changes - update termination min date
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
        // Safe to always revalidate - termDateInvalidValidator persists the format error
        this.form.get('termDate')?.updateValueAndValidity();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.closeBtn?.nativeElement) {
        this.closeBtn.nativeElement.focus();
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();
        this.duplicateError = false;
        this.duplicateErrorMessage = '';

        if (this.mode === 'edit') {
          this.populateFormForEdit();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup termination date validators for edit mode
   * Business Rule: Terminated records can be edited, but if user touches termination date field,
   * show "date is in past" error and disable save
   */
  private setupTerminationDateValidatorsForEdit(): void {
    const termDateControl = this.form.get('termDate');
    if (termDateControl) {
      termDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
      termDateControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }
  }

  private initializeForm(): void {
    if (this.mode === 'add') {
      this.form = this.fb.group({
        productType: [null, Validators.required],
        aborh: [null, Validators.required],
        attribute: [null], // Single combined attribute field
        minQty: [null, [Validators.min(0), Validators.max(9999)]],
        optQty: [null, [Validators.min(0), Validators.max(9999)]],
        effDate: [null, Validators.required], // Validators will be set by setupAddModeValidators
        termDate: [null]
      }, {
        validators: [
          DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate'),
          this.optimalGreaterThanMinimalValidator
        ]
      });
    } else {
      // Edit mode: include effDate as disabled field for cross-field validation
      this.form = this.fb.group({
        attribute: [null], // Single combined attribute field
        minQty: [null, [Validators.min(0), Validators.max(9999)]],
        optQty: [null, [Validators.min(0), Validators.max(9999)]],
        effDate: [{ value: null, disabled: true }], // Required for cross-field validation, will be populated from data
        termDate: [null]
      }, {
        validators: [
          DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate'),
          this.optimalGreaterThanMinimalValidator
        ]
      });
    }
  }

  private optimalGreaterThanMinimalValidator(group: FormGroup): { [key: string]: boolean } | null {
    const minQty = group.get('minQty')?.value;
    const optQty = group.get('optQty')?.value;

    // Only validate if both values are present
    if (minQty != null && optQty != null) {
      if (optQty <= minQty) {
        return { optimalNotGreater: true };
      }
    }

    return null;
  }

  private effDateInvalidValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this.effDateRawInput && this.effDateRawInput.trim() && !control.value) {
      return { invalidDateFormat: true };
    }
    return null;
  };

  private termDateInvalidValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this.termDateRawInput && this.termDateRawInput.trim() && !control.value) {
      return { invalidDateFormat: true };
    }
    return null;
  };

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateTerminationMinDate(): void {
    if (this.mode === 'edit' && this.data?.effDate) {
      const effectiveMoment = moment(this.data.effDate);
      this.terminationMinDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
      return;
    }

    const effectiveValue = this.form?.get('effDate')?.value;
    let effectiveMoment: Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.terminationMinDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Inventory Levels';
      this.lastUpdated = '';
    } else {
      this.panelTitle = 'Edit Inventory Levels';
      this.lastUpdated = this.data?.lastModifiedDateDisplay
        ? `Last Modified: ${this.data.lastModifiedDateDisplay}`
        : '';
    }
  }

  private populateFormForEdit(): void {
    if (!this.data || this.mode !== 'edit') {
      return;
    }

    // Populate read-only display values
    this.editModeValues = {
      inventoryClass: this.inventoryClass || '-',
      inventoryLevel: this.data.inventoryType || '-',
      productType: this.data.productTypeDesc || this.data.productType || '-',
      aborh: this.data.bloodTypeDesc || this.data.bloodType || '-',
      attribute: this.data.attribGroup && this.data.attribCode
        ? `${this.data.attribGroup} - ${this.data.attribCode}`
        : this.data.attribCode || '-',
      effectiveDate: this.data.effDateDisplay || '-'
    };

    // Update termination min date based on effective date
    this.updateTerminationMinDate();

    // Find and set the combined attribute value
    const combinedAttrKey = this.data.attribGroup && this.data.attribCode
      ? `${this.data.attribGroup}|${this.data.attribCode}`
      : null;

    // Determine minQty and optQty values
    // Priority: use minQty/optQty if available, otherwise derive from qty + inventoryType
    let minQtyValue: number | null = null;
    let optQtyValue: number | null = null;

    if (this.data.minQty !== null && this.data.minQty !== undefined) {
      minQtyValue = this.data.minQty;
    } else if (this.data.inventoryType === 'MI' && this.data.qty !== null && this.data.qty !== undefined) {
      minQtyValue = this.data.qty;
    }

    if (this.data.optQty !== null && this.data.optQty !== undefined) {
      optQtyValue = this.data.optQty;
    } else if (this.data.inventoryType === 'OP' && this.data.qty !== null && this.data.qty !== undefined) {
      optQtyValue = this.data.qty;
    }

    // Populate editable form fields including effDate for cross-field validation
    this.form.patchValue({
      attribute: combinedAttrKey,
      minQty: minQtyValue,
      optQty: optQtyValue,
      effDate: this.data.effDate ? moment(this.data.effDate) : null, // Needed for cross-field validation
      termDate: this.data.termDate ? moment(this.data.termDate) : null
    });
  }

  private loadLOVs(): void {
    if (this.mode === 'add') {
      // Add mode: Load product types, blood types, and combined attributes
      this.service.getProductTypes()
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.productTypes = data;
          this.filteredProductTypes = data;
        });

      this.service.getBloodTypes()
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.bloodTypes = data;
          this.filteredBloodTypes = data;
        });

      // Load all attribute groups, then load all codes for each group
      this.service.getAttributeGroups()
        .pipe(takeUntil(this.destroy$))
        .subscribe(groups => {
          this.attributeGroups = groups;
          this.loadAllAttributeCodes(groups);
        });
    } else {
      // Edit mode: Load combined attributes
      this.service.getAttributeGroups()
        .pipe(takeUntil(this.destroy$))
        .subscribe(groups => {
          this.attributeGroups = groups;
          this.loadAllAttributeCodes(groups);
        });
    }
  }

  private loadAllAttributeCodes(groups: AttributeGroupLOV[]): void {
    const combined: Array<{ display: string; value: string; group: string; code: string; desc: string }> = [];
    const seen = new Set<string>(); // Track unique values to prevent duplicates

    // Load codes for each group sequentially
    groups.forEach((group, index) => {
      this.service.getAttributeCodes(group.attribGroup)
        .pipe(takeUntil(this.destroy$))
        .subscribe(codes => {
          codes.forEach(code => {
            const value = `${group.attribGroup}|${code.attribCode}`;

            // Only add if we haven't seen this combination before
            if (!seen.has(value)) {
              seen.add(value);
              combined.push({
                display: `${group.attribGroup} - ${code.attribCode} - ${code.attribDesc}`,
                value: value,
                group: group.attribGroup,
                code: code.attribCode,
                desc: code.attribDesc
              });
            }
          });

          // Sort alphabetically after all groups are loaded
          if (index === groups.length - 1) {
            combined.sort((a, b) => a.display.localeCompare(b.display));
            this.combinedAttributes = combined;
            this.filteredCombinedAttributes = combined;
          }
        });
    });
  }

  private setupSearchFilters(): void {
    if (this.mode === 'add') {
      // Product Type search
      this.productTypeSearchControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((search) => {
          const term = (search ?? '').toLowerCase();
          this.filteredProductTypes = this.productTypes.filter((type) =>
            type.productType.toLowerCase().includes(term) ||
            type.productTypeDesc.toLowerCase().includes(term)
          );
        });

      // Blood Type search
      this.aborhSearchControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((search) => {
          const term = (search ?? '').toLowerCase();
          this.filteredBloodTypes = this.bloodTypes.filter((type) =>
            type.aboCode.toLowerCase().includes(term) ||
            type.aboDesc.toLowerCase().includes(term)
          );
        });
    }

    // Combined Attribute search (Both add and edit modes)
    this.attributeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredCombinedAttributes = this.combinedAttributes.filter((attr) =>
          attr.display.toLowerCase().includes(term)
        );
      });
  }


  onEffectiveDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.form.get('effDate');
    if (!control) return;

    this.effDateRawInput = inputValue;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      // Mark control and form as dirty and touched when clearing - user has made a change
      control.markAsTouched();
      control.markAsDirty();
      this.form.markAsDirty(); // Mark the entire form as dirty
    } else {
      control.markAsTouched();
      control.markAsDirty();
      this.form.markAsDirty(); // Mark the entire form as dirty
    }
    control.updateValueAndValidity();
    this.lastChangedDateField = 'effective';
  }

  onTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.form.get('termDate');
    if (!control) return;

    this.termDateRawInput = inputValue;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      // Mark control and form as dirty and touched when clearing - user has made a change
      control.markAsTouched();
      control.markAsDirty();
      this.form.markAsDirty(); // Mark the entire form as dirty
    } else {
      control.markAsTouched();
      control.markAsDirty();
      this.form.markAsDirty(); // Mark the entire form as dirty
    }
    control.updateValueAndValidity();
    this.lastChangedDateField = 'termination';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('invalidDateFormat')) return 'Effective Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control.hasError('required')) return 'Effective Date is required';
    if (control.hasError('effectiveDatePast')) return 'Effective Date cannot be past date';

    if (this.form.hasError('dateRangeInvalid')) {
      return 'Effective Date must be less than or equal to Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('termDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('invalidDateFormat')) return 'Termination Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (control.hasError('terminationDatePast')) return 'Termination Date cannot be in the past';
    if (control.hasError('matDatepickerMin')) return 'Termination Date must be greater than or equal to Effective Date';

    if (this.form.hasError('dateRangeInvalid')) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    return '';
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const input = event.target as HTMLInputElement;
    const charCode = event.which || event.keyCode;

    // Allow only numbers
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }

    // Check if adding this character would exceed 4 digits
    const currentValue = input.value || '';
    if (currentValue.length >= 4) {
      return false;
    }

    return true;
  }

  onPasteNumbers(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text');

    // Check if pasted text contains only digits and is max 4 characters
    if (pastedText && (!/^\d+$/.test(pastedText) || pastedText.length > 4)) {
      event.preventDefault();
    }
  }

  onQuantityInput(event: Event, fieldName: 'minQty' | 'optQty'): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove any non-digit characters
    value = value.replace(/[^\d]/g, '');

    // Limit to 4 digits
    if (value.length > 4) {
      value = value.substring(0, 4);
    }

    // Update the form control
    this.form.get(fieldName)?.setValue(value ? parseInt(value, 10) : null, { emitEvent: false });
  }


  onClose(): void {
    this.close.emit();
  }

  onClearAll(): void {
    this.form.patchValue({
      attribute: null,
      minQty: null,
      optQty: null,
      termDate: null
    });
    this.form.markAsDirty();
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    // Explicitly mark quantity fields as touched to trigger error display
    this.form.get('minQty')?.markAsTouched();
    this.form.get('optQty')?.markAsTouched();

    // Update validation asynchronously
    setTimeout(() => {
      this.form.updateValueAndValidity();

      if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
        this.lastChangedDateField = 'effective';
      }

      if (this.form.invalid) {
        this.snackbarService.showError('Please fix all validation errors before submitting');
        return;
      }

      this.saveInventoryLevel(false);
    });
  }

  onAddAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    // Explicitly mark quantity fields as touched to trigger error display
    this.form.get('minQty')?.markAsTouched();
    this.form.get('optQty')?.markAsTouched();

    // Update validation asynchronously
    setTimeout(() => {
      this.form.updateValueAndValidity();

      if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
        this.lastChangedDateField = 'effective';
      }

      if (this.form.invalid) {
        this.snackbarService.showError('Please fix all validation errors before submitting');
        return;
      }

      this.saveInventoryLevel(true);
    });
  }

  private saveInventoryLevel(createAnother: boolean): void {
    const formValue = this.form.value;

    // Parse combined attribute (format: "group|code")
    let attribGroup: string | null = null;
    let attribCode: string | null = null;
    if (formValue.attribute) {
      const parts = formValue.attribute.split('|');
      if (parts.length === 2) {
        attribGroup = parts[0];
        attribCode = parts[1];
      }
    }

    if (this.mode === 'add') {
      this.createInventoryLevels(formValue, attribGroup, attribCode, createAnother);
    } else {
      this.updateInventoryLevels(formValue, attribGroup, attribCode);
    }
  }

  private createInventoryLevels(
    formValue: any,
    attribGroup: string | null,
    attribCode: string | null,
    createAnother: boolean
  ): void {
    const hasMinQty = formValue.minQty !== null && formValue.minQty !== undefined && formValue.minQty !== '';
    const hasOptQty = formValue.optQty !== null && formValue.optQty !== undefined && formValue.optQty !== '';

    if (!hasMinQty && !hasOptQty) {
      this.snackbarService.showError('Please enter at least one quantity (Minimum or Optimal)');
      return;
    }

    const baseDto = {
      productType: formValue.productType,
      bloodType: formValue.aborh || null,
      attribGroup: attribGroup,
      attribCode: attribCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) : null
    };

    this.isSaving = true;

    // If both quantities are provided, make 2 API calls sequentially
    if (hasMinQty && hasOptQty) {
      const minDto: CreateSetInventoryLevelDto = {
        ...baseDto,
        inventoryType: 'MI',
        qty: formValue.minQty
      };

      const optDto: CreateSetInventoryLevelDto = {
        ...baseDto,
        inventoryType: 'OP',
        qty: formValue.optQty
      };

      // Create MI record first, then create OP record after MI succeeds
      this.service.createInventoryLevel(this.inventoryClass, minDto)
        .pipe(
          switchMap(() => this.service.createInventoryLevel(this.inventoryClass, optDto)),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: () => {
            this.handleCreateSuccess(createAnother);
          },
          error: (error) => {
            this.handleCreateError(error);
          }
        });
    } else {
      // Single API call for either MI or OP
      const dto: CreateSetInventoryLevelDto = {
        ...baseDto,
        inventoryType: hasMinQty ? 'MI' : 'OP',
        qty: hasMinQty ? formValue.minQty : formValue.optQty
      };

      this.service.createInventoryLevel(this.inventoryClass, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.handleCreateSuccess(createAnother);
          },
          error: (error) => {
            this.handleCreateError(error);
          }
        });
    }
  }

  private handleCreateSuccess(createAnother: boolean): void {
    this.isSaving = false;
    this.saveSuccess.emit();

    // Always show success message
    this.snackbarService.showSuccess('New Inventory Levels have been added.');

    if (createAnother) {
      // Reset form but keep it open
      this.form.reset();
      this.form.markAsUntouched();
      this.form.markAsPristine();

      // Reset termination min date to chapter min date
      this.terminationMinDate = this.minDate;

      // Clear duplicate error if any
      this.duplicateError = false;
      this.duplicateErrorMessage = '';
    } else {
      // Close dialog
      this.close.emit();
    }
  }

  private handleCreateError(error: any): void {
    this.isSaving = false;
    this.loggingService.error('Failed to create inventory level', error);

    // Check if it's a duplicate error (HTTP 409 or message contains 'duplicate' or 'already exists')
    const errorMsg = error?.error?.message?.toLowerCase() || error?.message?.toLowerCase() || '';
    const isDuplicate = error?.status === 409 ||
                       error?.error?.statusCode === 409 ||
                       errorMsg.includes('duplicate') ||
                       errorMsg.includes('already exists');

    if (isDuplicate) {
      this.duplicateError = true;
      this.duplicateErrorMessage = 'This inventory cannot be saved because a duplicate already exists. Search for the duplicate using the search bar in the table.';
      return;
    }

    let errorMessage = error?.error?.message || 'Failed to create inventory level';

    // Clean up error message format
    errorMessage = errorMessage.replace(/single-mode\s*/g, '').replace(/dual-mode\s*/g, '');

    this.snackbarService.showError(errorMessage);
  }

  private updateInventoryLevels(
    formValue: any,
    attribGroup: string | null,
    attribCode: string | null
  ): void {
    if (!this.data) return;

    // Store data in local variable for type safety after null check
    const currentData = this.data;

    const hasMinQty = formValue.minQty !== null && formValue.minQty !== undefined && formValue.minQty !== '';
    const hasOptQty = formValue.optQty !== null && formValue.optQty !== undefined && formValue.optQty !== '';

    if (!hasMinQty && !hasOptQty) {
      this.snackbarService.showError('Please enter at least one quantity (Minimum or Optimal)');
      return;
    }

    const baseData = {
      productType: currentData.productType,
      bloodType: currentData.bloodType,
      attribGroup: attribGroup,
      attribCode: attribCode,
      qty: 0, // Will be set per record
      effDate: currentData.effDate,
      termDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) : null
    };

    this.isSaving = true;

    // If both quantities are provided, UPSERT both MI and OP sequentially
    if (hasMinQty && hasOptQty) {
      // UPSERT MI record first, then UPSERT OP record after MI succeeds
      this.upsertRecord('MI', { ...baseData, qty: formValue.minQty })
        .pipe(
          switchMap(() => this.upsertRecord('OP', { ...baseData, qty: formValue.optQty })),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: () => {
            this.handleUpdateSuccess();
          },
          error: (error) => {
            this.handleUpdateError(error);
          }
        });
    } else {
      // Single UPSERT for either MI or OP
      const inventoryType = hasMinQty ? 'MI' : 'OP';
      const qty = hasMinQty ? formValue.minQty : formValue.optQty;

      this.upsertRecord(inventoryType, { ...baseData, qty })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.handleUpdateSuccess();
          },
          error: (error) => {
            this.handleUpdateError(error);
          }
        });
    }
  }

  private handleUpdateSuccess(): void {
    this.isSaving = false;
    this.snackbarService.showSuccess('Inventory Levels have been updated.');
    this.saveSuccess.emit();
    this.close.emit();
  }

  private handleUpdateError(error: any): void {
    this.isSaving = false;
    this.loggingService.error('Failed to update inventory level', error);
    let errorMessage = error?.error?.message || 'Failed to update inventory level';

    // Clean up error message format
    errorMessage = errorMessage.replace(/single-mode\s*/g, '').replace(/dual-mode\s*/g, '');

    this.snackbarService.showError(errorMessage);
  }

  /**
   * UPSERT logic for EDIT mode: Check if record exists, then CREATE or UPDATE accordingly
   * Step 1: GET - Check if record exists (returns 200 with data or 404)
   * Step 2a: If exists → PUT (update)
   * Step 2b: If not exists → POST (create)
   */
  private upsertRecord(
    inventoryType: string,
    data: {
      productType: string;
      bloodType: string | null;
      attribGroup: string | null;
      attribCode: string | null;
      qty: number;
      effDate: string;
      termDate: string | null;
    }
  ) {
    // Step 1: Check if record exists
    // Lookup key: inventoryType + productType + bloodType + effDate
    // DO NOT include attribGroup/attribCode - they are updatable fields, not part of the key
    return this.service.getInventoryLevel(
      this.inventoryClass,
      inventoryType,
      data.productType,
      data.bloodType,
      true // suppressErrorNotification - don't show snackbar for 404
    ).pipe(
      // If GET fails (404 or any error), treat as "record doesn't exist"
      // 404 is expected in UPSERT flow, not an error
      catchError(() => of(null)),
      switchMap((existingRecord) => {
        if (existingRecord) {
          // Record exists → UPDATE (PUT)
          const updateDto: UpdateSetInventoryLevelDto = {
            qty: data.qty,
            effDate: data.effDate,
            termDate: data.termDate,
            bloodType: data.bloodType,
            attribGroup: data.attribGroup,
            attribCode: data.attribCode
          };

          // Update using same lookup key (no attribGroup/attribCode in query params)
          return this.service.updateInventoryLevel(
            this.inventoryClass,
            inventoryType,
            data.productType,
            data.bloodType,
            null, // attribGroup - not in query params, only in body
            null, // attribCode - not in query params, only in body
            data.effDate,
            updateDto
          );
        } else {
          // Record doesn't exist → CREATE (POST)
          const createDto: CreateSetInventoryLevelDto = {
            inventoryType: inventoryType,
            productType: data.productType,
            bloodType: data.bloodType,
            attribGroup: data.attribGroup,
            attribCode: data.attribCode,
            qty: data.qty,
            effDate: data.effDate,
            termDate: data.termDate
          };

          return this.service.createInventoryLevel(this.inventoryClass, createDto);
        }
      })
    );
  }
}
