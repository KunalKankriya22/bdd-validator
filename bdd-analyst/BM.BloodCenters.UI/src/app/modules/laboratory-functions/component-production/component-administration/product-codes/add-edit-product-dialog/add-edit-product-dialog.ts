import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges, inject, signal, Input, Output, EventEmitter, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatTableModule } from '@angular/material/table';
import { Subject, takeUntil, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { ProductCodesService } from '../services/product-codes.service';
import { ProductCode, ProductCodeRequest, ProductAttribute } from '../models/product-codes.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-add-edit-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    MatTableModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-product-dialog.html',
  styleUrls: ['./add-edit-product-dialog.scss']
})
export class AddEditProductDialogComponent implements OnInit, OnChanges, OnDestroy {
  // Input properties for side panel mode
  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() product: ProductCode | null = null;

  // Output events for side panel mode
  @Output() close = new EventEmitter<{ success: boolean }>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductCodesService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialogRef = inject(MatDialogRef<AddEditProductDialogComponent>, { optional: true });
  private readonly dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly dateAdapter = inject(DateAdapter<Moment>);
  private readonly headerService = inject(HeaderService);

  readonly isSubmitting = signal(false);
  readonly isViewMode = signal(false);
  readonly isAddMode = signal(true);

  readonly productTypes = signal<any[]>([]);
  readonly productClasses = signal<any[]>([]);
  readonly modifiers = signal<any[]>([]);
  readonly inventoryClasses = signal<any[]>([]);
  readonly productAttributes = signal<ProductAttribute[]>([]);

  // Filtered lists for searchable dropdowns
  filteredProductTypes: any[] = [];
  filteredProductClasses: any[] = [];
  filteredModifiers: any[] = [];
  filteredInventoryClasses: any[] = [];

  // Search controls
  productTypeSearchControl = new FormControl('');
  productClassSearchControl = new FormControl('');
  modifierSearchControl = new FormControl('');
  inventoryClassSearchControl = new FormControl('');

  form!: FormGroup;
  isSaving = false;

  // Table columns for attributes display
  attributeColumns: string[] = ['attributeGroup', 'attributeGroupDescription', 'attributeCode', 'attributeDescription'];

  // Date validation
  minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone() || 'UTC');
  terminationMinDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone() || 'UTC');

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private destroy$ = new Subject<void>();

  readonly lifeSpanIndOptions = [
    { value: 'H', label: 'Hours' },
    { value: 'D', label: 'Days' },
    { value: 'Y', label: 'Years' }
  ];

  readonly yesNoOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  readonly cellCountOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' },
    { value: 'O', label: 'Optional' }
  ];

  readonly unitSchemeOptions = [
    { value: 'C', label: 'Codabar' },
    { value: 'I', label: 'Code 128' }
  ];

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError() || '');
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError() || '');

  effectiveDateFilter = (date: any): boolean => {
    if (!date) return true;
    if (!this.isAddMode()) return true;
    const checkDate = date.clone().startOf('day');
    const today = this.minDate.clone().startOf('day');
    return !checkDate.isBefore(today);
  };

  terminationDateFilter = (date: any): boolean => {
    if (!date) return true;
    const effDate = this.form?.get('effDate')?.value;
    if (!effDate) return true;
    const checkDate = date.clone().startOf('day');
    const effDateStartOfDay = moment.isMoment(effDate) ? effDate.clone().startOf('day') : moment(effDate).startOf('day');
    return !checkDate.isBefore(effDateStartOfDay);
  };

  constructor() {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    // If opened via MatDialog, use dialogData; otherwise use @Input properties
    if (this.dialogData) {
      this.mode = this.dialogData.mode || this.mode;
      this.product = this.dialogData.product || this.product;
    }

    this.isViewMode.set(this.mode === 'view');
    this.isAddMode.set(this.mode === 'add');
    this.loadDropdowns();
    this.setupSearchSubscriptions();
    this.setupDateValidation();

    // Setup validators for both ADD and EDIT modes
    // FMB nullchk required fields (text fields use maxLength, numeric fields use onNumericInput handler)
    this.form.get('productCode')?.setValidators([Validators.required, Validators.maxLength(5)]);
    this.form.get('productShortName')?.setValidators([Validators.required, Validators.maxLength(10)]);
    this.form.get('productType')?.setValidators([Validators.required, Validators.maxLength(5)]);
    this.form.get('productDesc')?.setValidators([Validators.required, Validators.maxLength(254)]);
    this.form.get('productClass')?.setValidators([Validators.required, Validators.maxLength(10)]);
    this.form.get('modifierCode')?.setValidators([Validators.required, Validators.maxLength(10)]);
    this.form.get('lifeSpan')?.setValidators([Validators.required]);
    this.form.get('lifeSpanInd')?.setValidators([Validators.required, Validators.maxLength(1)]);

    // FMB validation: MIN_TEMP between 1 and 50 (error code 5232) + Required
    this.form.get('minTemp')?.setValidators([Validators.required, this.minTempRangeValidator]);

    // FMB validation: MAX_TEMP between 1 and 50 (error code 5233) + Required
    this.form.get('maxTemp')?.setValidators([Validators.required, this.maxTempRangeValidator]);

    // FMB validation: MIN_WEIGHT between 0 and 999.99 (error code 1704) + Required
    this.form.get('minWeight')?.setValidators([Validators.required, this.weightRangeValidator]);

    // FMB validation: MAX_WEIGHT between 0 and 999.99 (error code 1704) + Required
    this.form.get('maxWeight')?.setValidators([Validators.required, this.weightRangeValidator]);

    // FMB validation: MIN_RCV_TEMP and MAX_RCV_TEMP (error code 0110) + Required
    this.form.get('minRcvTemp')?.setValidators([Validators.required, this.temp999Validator]);
    this.form.get('maxRcvTemp')?.setValidators([Validators.required, this.temp999Validator]);

    // Additional required fields from backend validation
    this.form.get('oftFlag')?.setValidators([Validators.required]);
    this.form.get('rhLabelFlag')?.setValidators([Validators.required]);
    this.form.get('dummyProductFlag')?.setValidators([Validators.required]);
    this.form.get('invProductType')?.setValidators([Validators.required, Validators.maxLength(5)]);
    this.form.get('returnable')?.setValidators([Validators.required]);

    // FMB validation: COMP_PRODUCT_CODE format for ISBT (error codes 9722, 1146)
    this.form.get('compProductCode')?.setValidators([Validators.maxLength(8), this.compProductCodeValidator]);

    this.form.get('productCode')?.updateValueAndValidity();
    this.form.get('productShortName')?.updateValueAndValidity();
    this.form.get('productType')?.updateValueAndValidity();
    this.form.get('productDesc')?.updateValueAndValidity();
    this.form.get('productClass')?.updateValueAndValidity();
    this.form.get('modifierCode')?.updateValueAndValidity();
    this.form.get('lifeSpan')?.updateValueAndValidity();
    this.form.get('lifeSpanInd')?.updateValueAndValidity();
    this.form.get('minTemp')?.updateValueAndValidity();
    this.form.get('maxTemp')?.updateValueAndValidity();
    this.form.get('minWeight')?.updateValueAndValidity();
    this.form.get('maxWeight')?.updateValueAndValidity();
    this.form.get('minRcvTemp')?.updateValueAndValidity();
    this.form.get('maxRcvTemp')?.updateValueAndValidity();
    this.form.get('oftFlag')?.updateValueAndValidity();
    this.form.get('rhLabelFlag')?.updateValueAndValidity();
    this.form.get('dummyProductFlag')?.updateValueAndValidity();
    this.form.get('invProductType')?.updateValueAndValidity();
    this.form.get('returnable')?.updateValueAndValidity();
    this.form.get('compProductCode')?.updateValueAndValidity();

    // Setup date validators
    if (this.isAddMode()) {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }

    // Apply FMB range validators to optional fields (work in both ADD and EDIT modes)
    this.form.get('productCount')?.setValidators([this.productCountValidator]);
    this.form.get('specificGravity')?.setValidators([this.specificGravityValidator]);
    this.form.get('productCount')?.updateValueAndValidity();
    this.form.get('specificGravity')?.updateValueAndValidity();

    // Setup cross-field validation subscriptions for temperature and weight comparisons
    // Works in both ADD and EDIT modes
    this.setupCrossFieldValidation();

    // Setup uppercase conversion for specific fields
    this.setupUppercaseFields();

    // Setup unit scheme type dependency for formula field (ADD mode only)
    if (this.isAddMode()) {
      this.setupUnitSchemeSubscription();
    }

    if (this.product) {
      this.populateForm(this.product);
      // Load attributes for view mode
      if (this.isViewMode() && this.product.productCode) {
        this.loadProductAttributes(this.product.productCode);
      }
    }
    if (this.isViewMode()) {
      this.form.disable();
    }

    // In edit mode, clear validators AFTER populateForm
    // This allows editing records with past effective dates
    if (!this.isAddMode()) {
      // Product Code is hidden from UI but stored in form
      this.form.get('productCode')?.clearValidators();
      this.form.get('productCode')?.updateValueAndValidity();

      // Clear date min validators that were added during form setup
      const effDateControl = this.form.get('effDate');
      const termDateControl = this.form.get('termDate');

      if (effDateControl) {
        // Clear validators and re-add only the required validator
        effDateControl.clearValidators();
        effDateControl.setValidators([Validators.required]);
        effDateControl.updateValueAndValidity({ emitEvent: false });
      }

      if (termDateControl) {
        // Term date has no individual validators, only cross-field validation
        termDateControl.clearValidators();
        termDateControl.updateValueAndValidity({ emitEvent: false });
      }
    }

    // CRITICAL FIX: Clear validators one more time after all async operations
    // The cross-field validator re-adds min date validators, so we clear them again
    if (!this.isAddMode()) {
      setTimeout(() => {
        const effDateControl = this.form.get('effDate');
        if (effDateControl) {
          effDateControl.clearValidators();
          effDateControl.setValidators([Validators.required]);
          effDateControl.updateValueAndValidity({ emitEvent: false });
        }
      }, 0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode']) {
      this.isViewMode.set(this.mode === 'view');
      this.isAddMode.set(this.mode === 'add');
      if (this.mode === 'view') {
        this.form?.disable();
      } else {
        this.form?.enable();
      }
    }
    if (changes['product'] && this.product) {
      this.populateForm(this.product);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // FMB: MaximumLength="5", Backend: Required for CREATE only
      productCode: ['', Validators.maxLength(5)],
      // FMB: MaximumLength="100", UpdateAllowed="false" (read-only), Required in ADD mode
      productFormula: ['', [Validators.required, Validators.maxLength(100)], this.formulaAsyncValidator],
      // FMB: MaximumLength="10", Backend: Required for CREATE only
      productShortName: ['', Validators.maxLength(10)],
      // FMB: MaximumLength="5", Backend: Required for CREATE only
      productType: ['', Validators.maxLength(5)],
      // FMB: MaximumLength="254", Backend: Required for CREATE only
      productDesc: ['', Validators.maxLength(254)],
      // FMB: MaximumLength="10", Required in ADD mode
      productClass: ['', Validators.maxLength(10)],
      // FMB: MaximumLength="10", Required in ADD mode
      modifierCode: ['', Validators.maxLength(10)],
      // FMB: MaximumLength="4", DataType="Number", nullchk trigger (required) - length enforced by onNumericInput
      lifeSpan: [null],
      // FMB: MaximumLength="1", Values: H=Hours, D=Days, Y=Years, nullchk trigger (required)
      lifeSpanInd: ['', Validators.maxLength(1)],
      // FMB: MaximumLength="7", DataType="Number", FormatMask="9999.99"
      timeLimit: [null, this.timeLimitValidator],
      // FMB: MaximumLength="6", DataType="Number", FormatMask="999.99"
      maxBleedTime: [null, this.temp999Validator],
      // FMB: MaximumLength="6", DataType="Number" - length enforced by onNumericInput
      minTemp: [null],
      // FMB: MaximumLength="6", DataType="Number" - length enforced by onNumericInput
      maxTemp: [null],
      // FMB: MaximumLength="6", DataType="Number" - length enforced by onNumericInput
      minWeight: [null],
      // FMB: MaximumLength="6", DataType="Number" - length enforced by onNumericInput
      maxWeight: [null],
      // FMB: MaximumLength="6", DataType="Number", FormatMask="999.99"
      minRcvTemp: [null, this.temp999Validator],
      // FMB: MaximumLength="6", DataType="Number", FormatMask="999.99"
      maxRcvTemp: [null, this.temp999Validator],
      // FMB: MaximumLength="8", DataType="Number" - length enforced by onNumericInput
      productCount: [null],
      // FMB: MaximumLength="7", DataType="Number" - length enforced by onNumericInput
      specificGravity: [null],
      // FMB: MaximumLength="1", Required="false", Default='N'
      oftFlag: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Required="false", Default='N'
      rhLabelFlag: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Required="false", Default='N' (NOT NULL in DB)
      dummyProductFlag: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Required="false", Default='N'
      pheresisFlag: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Required="false", Default='N'
      cellCountFlag: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Required="false", Default='N'
      returnable: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Required="false", Y/N flag for pool product, Default='N'
      poolProductCode: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Required="false", Default='N'
      outOfStateFlag: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Required="false", Default='Y'
      pathogenReductionFlag: ['Y', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Values: C=Codabar, I=Code128, Default='I'
      unitSchemeType: ['I', Validators.maxLength(1)],
      // FMB: MaximumLength="8", Required="false"
      compProductCode: ['', Validators.maxLength(8)],
      // FMB: MaximumLength="1", Required="false", Default='N'
      preprintedLabelFlag: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Required="false", Default='N'
      manufProductFlag: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="1", Required="false", Default='N'
      researchProductFlag: ['N', Validators.maxLength(1)],
      // FMB: MaximumLength="5", Required="false"
      invProductType: ['', Validators.maxLength(5)],
      // FMB: MaximumLength="2", Required="false"
      inventoryClass: ['', Validators.maxLength(2)],
      // FMB: DataType="Number", FormatMask="9999990.90"
      stdPrice: [null, this.stdPriceValidator],
      // FMB: MaximumLength="8", Required="false"
      serviceCode: ['', Validators.maxLength(8)],
      // FMB: Required="false" - but keeping required for business rules
      effDate: [null, [Validators.required]],
      // FMB: Required="false"
      termDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    // Note: setupAddModeValidators will be called in ngOnInit based on mode
    // Do NOT call it here as it adds min date validators that break edit mode
  }

  private setupDateValidation(): void {
    const effDateControl = this.form.get('effDate');
    const termDateControl = this.form.get('termDate');

    if (effDateControl && termDateControl) {
      effDateControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((newEffDate) => {
          this.lastChangedDateField = 'effective';
          if (newEffDate && moment.isMoment(newEffDate)) {
            this.terminationMinDate = newEffDate.clone();
          }
          termDateControl.updateValueAndValidity({ emitEvent: false });
        });

      termDateControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.lastChangedDateField = 'termination';
          effDateControl.updateValueAndValidity({ emitEvent: false });
        });
    }
  }

  /**
   * Setup cross-field validation for temperature and weight comparisons
   * FMB validation rules:
   * - MAX_TEMP >= MIN_TEMP (error code 5230)
   * - MAX_WEIGHT >= MIN_WEIGHT (error code 9740)
   * - MAX_RCV_TEMP >= MIN_RCV_TEMP (error code 0110)
   */
  private setupCrossFieldValidation(): void {
    const minTempControl = this.form.get('minTemp');
    const maxTempControl = this.form.get('maxTemp');
    const minWeightControl = this.form.get('minWeight');
    const maxWeightControl = this.form.get('maxWeight');
    const minRcvTempControl = this.form.get('minRcvTemp');
    const maxRcvTempControl = this.form.get('maxRcvTemp');
    const compProductCodeControl = this.form.get('compProductCode');
    const productCodeControl = this.form.get('productCode');

    // Temperature comparison validation
    if (minTempControl && maxTempControl) {
      minTempControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.tempComparisonValidator();
          maxTempControl.updateValueAndValidity({ emitEvent: false });
        });

      maxTempControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.tempComparisonValidator();
        });
    }

    // Weight comparison validation
    if (minWeightControl && maxWeightControl) {
      minWeightControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.weightComparisonValidator();
          maxWeightControl.updateValueAndValidity({ emitEvent: false });
        });

      maxWeightControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.weightComparisonValidator();
        });
    }

    // Receive temperature comparison validation
    if (minRcvTempControl && maxRcvTempControl) {
      minRcvTempControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.rcvTempComparisonValidator();
          maxRcvTempControl.updateValueAndValidity({ emitEvent: false });
        });

      maxRcvTempControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.rcvTempComparisonValidator();
          minRcvTempControl.updateValueAndValidity({ emitEvent: false });
        });
    }

    // Comp Product Code revalidation when productCode changes
    if (compProductCodeControl && productCodeControl) {
      productCodeControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          compProductCodeControl.updateValueAndValidity({ emitEvent: false });
        });
    }
  }

  /**
   * Setup uppercase conversion for specific fields
   * Fields: productShortName, invProductType, compProductCode, serviceCode
   */
  private setupUppercaseFields(): void {
    const uppercaseFields = ['productShortName', 'invProductType', 'compProductCode', 'serviceCode'];

    uppercaseFields.forEach(fieldName => {
      const control = this.form.get(fieldName);
      if (control) {
        control.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(value => {
            if (value && typeof value === 'string') {
              const upperValue = value.toUpperCase();
              if (value !== upperValue) {
                control.setValue(upperValue, { emitEvent: false });
              }
            }
          });
      }
    });
  }

  /**
   * Setup subscription for unit scheme type changes
   * Formula field is only enabled when unit scheme is 'I' (ISBT/Code 128)
   * When changed to 'C' (Codabar), formula field is cleared and disabled
   */
  private setupUnitSchemeSubscription(): void {
    const unitSchemeControl = this.form.get('unitSchemeType');
    const formulaControl = this.form.get('productFormula');

    if (unitSchemeControl && formulaControl) {
      // Set initial state based on current value
      const currentScheme = unitSchemeControl.value;
      if (currentScheme === 'I') {
        formulaControl.enable({ emitEvent: false });
      } else {
        formulaControl.setValue('', { emitEvent: false });
        formulaControl.disable({ emitEvent: false });
      }

      // Subscribe to changes
      unitSchemeControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(schemeValue => {
          if (schemeValue === 'I') {
            // Enable formula field for ISBT (Code 128)
            formulaControl.enable({ emitEvent: false });
          } else {
            // Clear and disable formula field for Codabar
            formulaControl.setValue('', { emitEvent: false });
            formulaControl.disable({ emitEvent: false });
          }
        });
    }
  }

  private loadDropdowns(): void {
    this.service.getProductTypes().subscribe({
      next: (types) => {
        this.productTypes.set(types);
        this.filteredProductTypes = [...types];
      },
      error: () => this.showError('Failed to load product types')
    });

    this.service.getProductClasses().subscribe({
      next: (classes) => {
        this.productClasses.set(classes);
        this.filteredProductClasses = [...classes];
      },
      error: () => this.showError('Failed to load product classes')
    });

    this.service.getModifiers().subscribe({
      next: (mods) => {
        this.modifiers.set(mods);
        this.filteredModifiers = [...mods];
      },
      error: () => this.showError('Failed to load modifiers')
    });

    this.service.getInventoryClasses().subscribe({
      next: (classes) => {
        this.inventoryClasses.set(classes);
        this.filteredInventoryClasses = [...classes];
      },
      error: () => this.showError('Failed to load inventory classes')
    });
  }

  private loadProductAttributes(productCode: string): void {
    this.service.getProductAttributes(productCode).subscribe({
      next: (attributes) => {
        this.productAttributes.set(attributes);
      },
      error: (err) => {
        console.error('Error loading product attributes:', err);
        this.showError('Failed to load product attributes');
      }
    });
  }

  private populateForm(product: ProductCode): void {
    this.form.patchValue({
      ...product,
      effDate: product.effDate ? moment(product.effDate) : null,
      termDate: product.termDate ? moment(product.termDate) : null
    });
  }

  get dialogTitle(): string {
    if (this.mode === 'add') return 'Add New Product';
    if (this.mode === 'view') return 'View Product Details';
    return 'Edit Product Details';
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    // Default to showing cross-field error on Effective Date if no field was changed yet
    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      this.showError('Please fix validation errors');
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.getRawValue();

    // Convert empty strings to null for backend validation
    // Backend expects flags to be Y, N, or null (not empty string)
    const cleanedValue = Object.keys(formValue).reduce((acc, key) => {
      acc[key] = formValue[key] === '' ? null : formValue[key];
      return acc;
    }, {} as any);

    // Convert dates to YYYY-MM-DD format for API (backend handles timezone conversion)
    const effDateStr = cleanedValue.effDate ? DateFieldValidationUtility.serializeDateForApi(cleanedValue.effDate) : undefined;
    const termDateStr = cleanedValue.termDate ? DateFieldValidationUtility.serializeDateForApi(cleanedValue.termDate) : null;

    const request: ProductCodeRequest = {
      ...cleanedValue,
      effDate: effDateStr,
      termDate: termDateStr
    };

    const operation = this.mode === 'add'
      ? this.service.createProductCode(request)
      : this.service.updateProductCode(this.product!.productCode, request);

    operation.subscribe({
      next: (response) => {
        // Handle success response with possible error flag
        if (response?.success === false) {
          const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
          const errorMessage = response?.error || response?.errorResponse?.error || response?.message || 'Operation failed';
          const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
          this.showError(displayMessage);
          this.isSubmitting.set(false);
          return;
        }

        this.isSubmitting.set(false);
        // Show specific success message based on mode
        const successMessage = this.mode === 'add'
          ? 'Product code created successfully'
          : 'Product code updated successfully';
        this.showSuccess(successMessage);
        this.emitClose(true);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.handleSaveError(error);
      }
    });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    // Default to showing cross-field error on Effective Date if no field was changed yet
    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      this.showError('Please fix validation errors');
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.getRawValue();

    // Convert empty strings to null for backend validation
    // Backend expects flags to be Y, N, or null (not empty string)
    const cleanedValue = Object.keys(formValue).reduce((acc, key) => {
      acc[key] = formValue[key] === '' ? null : formValue[key];
      return acc;
    }, {} as any);

    // Convert dates to YYYY-MM-DD format for API (backend handles timezone conversion)
    const effDateStr = cleanedValue.effDate ? DateFieldValidationUtility.serializeDateForApi(cleanedValue.effDate) : undefined;
    const termDateStr = cleanedValue.termDate ? DateFieldValidationUtility.serializeDateForApi(cleanedValue.termDate) : null;

    const request: ProductCodeRequest = {
      ...cleanedValue,
      effDate: effDateStr,
      termDate: termDateStr
    };

    this.service.createProductCode(request).subscribe({
      next: (response) => {
        // Handle success response with possible error flag
        if (response?.success === false) {
          const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
          const errorMessage = response?.error || response?.errorResponse?.error || response?.message || 'Failed to create product code';
          const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
          this.showError(displayMessage);
          this.isSubmitting.set(false);
          return;
        }

        this.isSubmitting.set(false);
        this.showSuccess('Product code created successfully');
        this.form.reset();
        this.form.markAsUntouched();
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.handleSaveError(error);
      }
    });
  }

  onClearAll(): void {
    this.form.reset();
  }

  onCancel(): void {
    this.emitClose(false);
  }

  private emitClose(success: boolean): void {
    const result = { success };
    if (this.dialogRef) {
      this.dialogRef.close(result);
    } else {
      this.close.emit(result);
    }
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      !this.isAddMode() // Pass true for edit mode, false for add mode
    );
  }

  getProductClassDescription(): string {
    const productClass = this.form.value.productClass;
    if (!productClass) return '';
    const found = this.productClasses().find(c => c.code === productClass);
    return found?.codeDesc || '';
  }

  getModifierDescription(): string {
    const modifierCode = this.form.value.modifierCode;
    if (!modifierCode) return '';
    const found = this.modifiers().find(m => m.code === modifierCode);
    return found?.codeDesc || '';
  }

  onEditClick(): void {
    this.mode = 'edit';
    this.isViewMode.set(false);
    this.isAddMode.set(false);

    // Enable the form for editing
    this.form.enable({ emitEvent: false });

    // Reset touched/pristine state immediately after enabling
    // Mark as untouched so errors won't display until user interacts
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        control.markAsUntouched();
        control.markAsPristine();
      }
    });
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Product Code field should remain in the form but hidden in edit mode
    // It's needed for the update API call
  }

  onBreadcrumbClick(target: 'home' | 'product-codes'): void {
    // Close the dialog and navigate based on target
    if (target === 'home') {
      // Navigate to home (close dialog)
      this.emitClose(false);
      // You can add router navigation here if needed
      // this.router.navigate(['/home']);
    } else if (target === 'product-codes') {
      // Navigate back to product codes list (close dialog)
      this.emitClose(false);
    }
  }

  private showSuccess(message: string): void {
    this.snackbarService.showSuccess(message);
  }

  private showError(message: string): void {
    this.snackbarService.showError(message);
  }

  private handleSaveError(error: any): void {
    const errorResponse = error?.error?.errorResponse || error?.error;
    const errorCode = errorResponse?.errorCode || error?.error?.errorCode;
    const errorMessage = errorResponse?.error || error?.error?.error || error?.error?.message || error?.message || 'Operation failed';

    const displayMessage = errorCode
      ? `Error ${errorCode}: ${errorMessage}`
      : errorMessage;

    this.showError(displayMessage);
  }

  private getFormValidationErrors(): any {
    const errors: any = {};
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    if (this.form.errors) {
      errors['formErrors'] = this.form.errors;
    }
    return errors;
  }

  get isSaveButtonDisabled(): boolean {
    // In edit mode, disable SAVE if form hasn't changed
    // In add mode, only check if form is valid
    if (!this.isAddMode() && !this.form.dirty) {
      return true; // No changes made in edit mode
    }

    // Disable if form is invalid, pending async validation, or submitting
    const disabled = this.form.invalid || this.form.pending || this.isSubmitting();
    return disabled;
  }

  /**
   * Prevent non-numeric characters in integer number fields.
   * Blocks: e, E, +, -, . (period/decimal point)
   * Matches Chapter Details pattern for integer-only fields
   */
  onNumberKeypress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const char = String.fromCharCode(charCode);

    // Allow: backspace(8), tab(9), escape(27), enter(13)
    // NOTE: Do NOT allow 46 here - it's the period (.) character
    // Delete key has charCode 46 but we check it separately below
    if ([8, 9, 27, 13].indexOf(charCode) !== -1) {
      return;
    }

    // Allow Delete key (check event.key to distinguish from period)
    if (event.key === 'Delete') {
      return;
    }

    // Block decimal point explicitly
    if (char === '.') {
      event.preventDefault();
      return;
    }

    // Block non-numeric characters
    if (char < '0' || char > '9') {
      event.preventDefault();
    }
  }

  /**
   * Prevent non-numeric characters in decimal number fields.
   * Allows: 0-9 and decimal point (.)
   * Blocks: e, E, +, -, and multiple decimal points
   * Matches Chapter Details pattern extended for decimal fields
   */
  onDecimalKeypress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const char = String.fromCharCode(charCode);
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    // Allow: backspace(8), tab(9), escape(27), enter(13)
    if ([8, 9, 27, 13].indexOf(charCode) !== -1) {
      return;
    }

    // Allow Delete key (check event.key to distinguish from period)
    if (event.key === 'Delete') {
      return;
    }

    // Allow decimal point only if not already present
    if (char === '.' && currentValue.indexOf('.') === -1) {
      return;
    }

    // Allow minus sign only at the beginning (or if field is empty)
    if (char === '-' && currentValue.indexOf('-') === -1 && (input.selectionStart === 0 || currentValue === '')) {
      return;
    }

    // Block non-numeric characters
    if (char < '0' || char > '9') {
      event.preventDefault();
    }
  }

  /**
   * Enforce maximum number of digits on numeric input.
   * Matches Chapter Details onMaxDigitsInput pattern
   */
  onMaxDigitsInput(event: Event, maxDigits: number): void {
    const input = event.target as HTMLInputElement;
    const controlName = input.getAttribute('formControlName');

    if (input.value.length > maxDigits) {
      input.value = input.value.slice(0, maxDigits);
      if (controlName) {
        const control = this.form.get(controlName);
        control?.setValue(input.value ? +input.value : null, { emitEvent: false });
      }
    }

    // Always mark as touched and validate to show errors immediately
    if (controlName) {
      const control = this.form.get(controlName);
      control?.markAsTouched();
      control?.markAsDirty();
      control?.updateValueAndValidity();
    }
  }

  // Deprecated: Legacy handler - use onNumberKeypress/onDecimalKeypress + onMaxDigitsInput instead
  onNumericInput(event: Event, maxLength: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove any non-numeric characters except decimal point and minus sign
    value = value.replace(/[^0-9.-]/g, '');

    // Limit to maxLength characters
    if (value.length > maxLength) {
      value = value.slice(0, maxLength);
      input.value = value;

      // Update the form control value
      const controlName = input.getAttribute('formControlName');
      if (controlName) {
        this.form.get(controlName)?.setValue(value ? parseFloat(value) : null, { emitEvent: false });
      }
    }
  }

  /**
   * Setup search subscriptions for dropdowns
   */
  private setupSearchSubscriptions(): void {
    // Product Type search
    this.productTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProductTypeOptions();
      });

    // Product Class search
    this.productClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProductClassOptions();
      });

    // Modifier search
    this.modifierSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterModifierOptions();
      });

    // Inventory Class search
    this.inventoryClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterInventoryClassOptions();
      });
  }

  /**
   * Filter product type options based on search text
   */
  private filterProductTypeOptions(): void {
    const searchTerm = (this.productTypeSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredProductTypes = this.productTypes();
    } else {
      this.filteredProductTypes = this.productTypes().filter(
        type =>
          type.productTypeCode?.toLowerCase().includes(searchTerm) ||
          type.productTypeDesc?.toLowerCase().includes(searchTerm)
      );
    }
  }

  /**
   * Filter product class options based on search text
   */
  private filterProductClassOptions(): void {
    const searchTerm = (this.productClassSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredProductClasses = this.productClasses();
    } else {
      this.filteredProductClasses = this.productClasses().filter(
        cls =>
          cls.code?.toLowerCase().includes(searchTerm) ||
          cls.codeDesc?.toLowerCase().includes(searchTerm)
      );
    }
  }

  /**
   * Filter modifier options based on search text
   */
  private filterModifierOptions(): void {
    const searchTerm = (this.modifierSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredModifiers = this.modifiers();
    } else {
      this.filteredModifiers = this.modifiers().filter(
        mod =>
          mod.code?.toLowerCase().includes(searchTerm) ||
          mod.codeDesc?.toLowerCase().includes(searchTerm)
      );
    }
  }

  /**
   * Filter inventory class options based on search text
   */
  private filterInventoryClassOptions(): void {
    const searchTerm = (this.inventoryClassSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredInventoryClasses = this.inventoryClasses();
    } else {
      this.filteredInventoryClasses = this.inventoryClasses().filter(
        cls =>
          cls.code?.toLowerCase().includes(searchTerm) ||
          cls.codeDesc?.toLowerCase().includes(searchTerm)
      );
    }
  }

  /**
   * Get validation error message for numeric fields based on FMB validation rules
   */
  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || (!control.touched && !control.dirty)) {
      return '';
    }

    // FMB validation error messages matching show_error codes
    switch (fieldName) {
      case 'minTemp':
        if (control.errors['rangeError']) {
          return 'Minimum temperature must be between 1 and 50 °C';
        }
        if (control.errors['comparisonError']) {
          return 'Must be less than or equal to maximum temperature';
        }
        break;

      case 'maxTemp':
        if (control.errors['rangeError']) {
          return 'Maximum temperature must be between 1 and 50 °C';
        }
        if (control.errors['comparisonError']) {
          return 'Must be greater than or equal to minimum temperature';
        }
        break;

      case 'minWeight':
        if (control.errors['rangeError']) {
          return 'Minimum weight must be between 0 and 999.99 grams';
        }
        break;

      case 'maxWeight':
        if (control.errors['rangeError']) {
          return 'Maximum weight must be between 0 and 999.99 grams';
        }
        if (control.errors['comparisonError']) {
          return 'Maximum weight must be greater than or equal to minimum weight';
        }
        break;

      case 'productCount':
        if (control.errors['rangeError']) {
          return 'Product count must be between 0 and 999.9999';
        }
        break;

      case 'specificGravity':
        if (control.errors['rangeError']) {
          return 'Specific gravity must be between 0 and 99.999';
        }
        break;

      case 'minRcvTemp':
        if (control.errors['required']) {
          return 'Minimum receive temperature is required';
        }
        if (control.errors['rangeError']) {
          return 'Minimum receive temperature must be between -99 and 999.99 °C';
        }
        if (control.errors['comparisonError']) {
          return 'Must be less than or equal to maximum receive temperature';
        }
        break;

      case 'maxRcvTemp':
        if (control.errors['required']) {
          return 'Maximum receive temperature is required';
        }
        if (control.errors['rangeError']) {
          return 'Maximum receive temperature must be between -99 and 999.99 °C';
        }
        if (control.errors['comparisonError']) {
          return 'Must be greater than or equal to minimum receive temperature';
        }
        break;

      case 'maxBleedTime':
        if (control.errors['rangeError']) {
          return 'Maximum bleed time must be between 0 and 999.99 hours';
        }
        break;

      case 'timeLimit':
        if (control.errors['rangeError']) {
          return 'Component definition time limit must be between 0 and 9999.99 hours';
        }
        break;

      case 'stdPrice':
        if (control.errors['rangeError']) {
          return 'Standard price must be between 0 and 9999999.99';
        }
        break;
    }

    // Default required field error
    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    return '';
  }

  /**
   * Get user-friendly field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'productCode': 'Product Code',
      'productShortName': 'Product Short Name',
      'productType': 'Lab Product Type',
      'productDesc': 'Description',
      'lifeSpan': 'Life Span',
      'lifeSpanInd': 'Life Span Indicator',
      'minTemp': 'Minimum Temperature',
      'maxTemp': 'Maximum Temperature',
      'minWeight': 'Minimum Weight',
      'maxWeight': 'Maximum Weight',
      'minRcvTemp': 'Minimum Receive Temperature',
      'maxRcvTemp': 'Maximum Receive Temperature'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Custom validator: FMB validation for MIN_TEMP (error code 5232)
   * Validates: between 1 and 50
   */
  private minTempRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null; // Skip if empty
    }
    const value = Number(control.value);
    if (value < 1 || value > 50) {
      return { rangeError: true };
    }
    return null;
  }

  /**
   * Custom validator: FMB validation for MAX_TEMP (error code 5233)
   * Validates: between 1 and 50
   */
  private maxTempRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null;
    }
    const value = Number(control.value);
    if (value < 1 || value > 50) {
      return { rangeError: true };
    }
    return null;
  }

  /**
   * Custom validator: FMB validation for weights (error code 1704)
   * Validates: between 0 and 999.99
   */
  private weightRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null;
    }
    const value = Number(control.value);
    if (value < 0 || value > 999.99) {
      return { rangeError: true };
    }
    return null;
  }

  /**
   * Custom validator: FMB validation for PRODUCT_COUNT
   * Format mask: 999.9999 (max value 999.9999)
   */
  private productCountValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null;
    }
    const value = Number(control.value);
    if (value < 0 || value > 999.9999) {
      return { rangeError: true };
    }
    return null;
  }

  /**
   * Custom validator: Database precision for SPECIFIC_GRAVITY
   * Database: NUMBER(5,3) - max value 99.999
   */
  private specificGravityValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null;
    }
    const value = Number(control.value);
    if (value < 0 || value > 99.999) {
      return { rangeError: true };
    }
    return null;
  }

  /**
   * Custom validator: FMB validation for comp product code
   * - Comp product code must start with the entire product code
   * Error code: 9722
   */
  private compProductCodeValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Not required, so empty is valid
    }

    const compCode = String(control.value).trim().toUpperCase();
    const productCode = this.form?.get('productCode')?.value;

    if (!productCode) {
      return null; // Can't validate if product code is not set yet
    }

    const productCodeUpper = String(productCode).trim().toUpperCase();

    // Comp product code must start with the entire product code
    if (!compCode.startsWith(productCodeUpper)) {
      return { compCodeProductMismatch: true };
    }

    return null;
  }

  /**
   * Custom validator: FMB validation for TIME_LIMIT
   * Format mask: 9999.99 (max value 9999.99)
   */
  private timeLimitValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null;
    }
    const value = Number(control.value);
    if (value < 0 || value > 9999.99) {
      return { rangeError: true };
    }
    return null;
  }

  /**
   * Custom validator: FMB validation for STD_PRICE
   * Format mask: 9999990.90 (max value 9999990.90)
   */
  private stdPriceValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null;
    }
    const value = Number(control.value);
    // Database: NUMBER(9,2) - max value 9999999.99
    if (value < 0 || value > 9999999.99) {
      return { rangeError: true };
    }
    return null;
  }

  /**
   * Custom validator: FMB validation for MAX_BLEED_TIME, MIN_RCV_TEMP, MAX_RCV_TEMP
   * Format mask: 999.99 (max value 999.99)
   */
  private temp999Validator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null;
    }
    const value = Number(control.value);
    if (value < -99 || value > 999.99) {
      return { rangeError: true };
    }
    return null;
  }

  /**
   * Cross-field validator: MAX_TEMP >= MIN_TEMP (error code 5230)
   */
  private tempComparisonValidator = (): ValidationErrors | null => {
    if (!this.form) return null;

    const minTemp = this.form.get('minTemp')?.value;
    const maxTemp = this.form.get('maxTemp')?.value;

    if (minTemp !== null && maxTemp !== null && Number(maxTemp) < Number(minTemp)) {
      this.form.get('minTemp')?.setErrors({ ...this.form.get('minTemp')?.errors, comparisonError: true }, { emitEvent: false });
      this.form.get('maxTemp')?.setErrors({ ...this.form.get('maxTemp')?.errors, comparisonError: true }, { emitEvent: false });
      return { tempComparison: true };
    } else {
      // Clear comparison error if valid
      const minTempControl = this.form.get('minTemp');
      const maxTempControl = this.form.get('maxTemp');

      if (minTempControl?.errors?.['comparisonError']) {
        const { comparisonError, ...remainingErrors } = minTempControl.errors;
        minTempControl.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null, { emitEvent: false });
      }

      if (maxTempControl?.errors?.['comparisonError']) {
        const { comparisonError, ...remainingErrors } = maxTempControl.errors;
        maxTempControl.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null, { emitEvent: false });
      }
    }

    return null;
  }

  /**
   * Cross-field validator: MAX_WEIGHT >= MIN_WEIGHT (error code 9740)
   */
  private weightComparisonValidator = (): ValidationErrors | null => {
    if (!this.form) return null;

    const minWeight = this.form.get('minWeight')?.value;
    const maxWeight = this.form.get('maxWeight')?.value;

    if (minWeight !== null && maxWeight !== null && Number(maxWeight) < Number(minWeight)) {
      this.form.get('maxWeight')?.setErrors({ ...this.form.get('maxWeight')?.errors, comparisonError: true }, { emitEvent: false });
      return { weightComparison: true };
    } else {
      // Clear comparison error if valid
      const maxWeightControl = this.form.get('maxWeight');
      if (maxWeightControl?.errors?.['comparisonError']) {
        const { comparisonError, ...remainingErrors } = maxWeightControl.errors;
        maxWeightControl.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null, { emitEvent: false });
      }
    }

    return null;
  }

  /**
   * Cross-field validator: MAX_RCV_TEMP >= MIN_RCV_TEMP (error code 0110)
   */
  private rcvTempComparisonValidator = (): ValidationErrors | null => {
    if (!this.form) return null;

    const minRcvTemp = this.form.get('minRcvTemp')?.value;
    const maxRcvTemp = this.form.get('maxRcvTemp')?.value;

    if (minRcvTemp !== null && maxRcvTemp !== null && Number(maxRcvTemp) < Number(minRcvTemp)) {
      this.form.get('maxRcvTemp')?.setErrors({ ...this.form.get('maxRcvTemp')?.errors, comparisonError: true }, { emitEvent: false });
      this.form.get('minRcvTemp')?.setErrors({ ...this.form.get('minRcvTemp')?.errors, comparisonError: true }, { emitEvent: false });
      return { rcvTempComparison: true };
    } else {
      // Clear comparison errors if valid
      const maxRcvTempControl = this.form.get('maxRcvTemp');
      const minRcvTempControl = this.form.get('minRcvTemp');

      if (maxRcvTempControl?.errors?.['comparisonError']) {
        const { comparisonError, ...remainingErrors } = maxRcvTempControl.errors;
        maxRcvTempControl.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null, { emitEvent: false });
      }

      if (minRcvTempControl?.errors?.['comparisonError']) {
        const { comparisonError, ...remainingErrors } = minRcvTempControl.errors;
        minRcvTempControl.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null, { emitEvent: false });
      }
    }

    return null;
  }

  /**
   * Async validator for product formula
   * Validates formula format and calls backend API to check attribute codes
   * Shows errors via snackbar notification instead of inline field error
   */
  private formulaAsyncValidator = (control: AbstractControl): Observable<ValidationErrors | null> => {
    const formula = control.value;

    // If empty, no validation needed (formula is optional)
    if (!formula || formula.trim() === '') {
      return of(null);
    }

    // Skip API validation in edit mode (formula field is disabled in edit mode)
    if (!this.isAddMode()) {
      return of(null);
    }

    // Call backend API to validate formula (format + attribute groups/codes)
    return this.service.validateFormula(formula).pipe(
      map(result => {
        if (result.success) {
          return null;
        }
        return { invalidFormula: result.error || 'Invalid formula' };
      }),
      catchError(() => of({ invalidFormula: 'Error validating formula' }))
    );
  }
}
