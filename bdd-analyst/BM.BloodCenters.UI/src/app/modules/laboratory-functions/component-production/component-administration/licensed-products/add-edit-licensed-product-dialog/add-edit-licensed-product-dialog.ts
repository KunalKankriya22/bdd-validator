import { Component, Inject, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, signal, Input, Output, EventEmitter, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { LicensedProductsService } from '../services/licensed-products.service';
import { AddEditLicensedProductDialogData, ValidProduct, LicensedProductRequest, LicensedProduct } from '../models/licensed-products.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-add-edit-licensed-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-licensed-product-dialog.html',
  styleUrls: ['./add-edit-licensed-product-dialog.scss']
})
export class AddEditLicensedProductDialog implements OnInit, OnChanges, OnDestroy {
  // Input properties for side panel mode
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() chapterId!: string;
  @Input() product: LicensedProduct | null = null;
  @Input() validProducts: ValidProduct[] = [];

  // Output events for side panel mode
  @Output() close = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  private readonly fb = inject(FormBuilder);
  private readonly licensedProductsService = inject(LicensedProductsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<AddEditLicensedProductDialog>, { optional: true });
  private readonly dateAdapter = inject(DateAdapter<Moment>);
  private readonly headerService = inject(HeaderService);

  readonly saving = signal<boolean>(false);
  readonly loadingProducts = signal<boolean>(false);
  readonly selectedProductDesc = signal<string>('--');

  // Product search control
  productSearchControl = new FormControl('');
  filteredProducts: ValidProduct[] = [];

  form!: FormGroup;

  // Date validation
  minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  terminationMinDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  /** Effective date filter: Edit mode allows all dates, Add mode not before today */
  effectiveDateFilter = (date: any): boolean => {
    if (!date) return true;
    // In Edit mode, allow all dates (including past)
    if (!this.isAddMode) return true;
    // In Add mode, don't allow dates before today
    const checkDate = date.clone().startOf('day');
    const today = this.minDate.clone().startOf('day');
    return !checkDate.isBefore(today);
  };

  /** Termination date filter: not before effective date and not before today */
  terminationDateFilter = (date: any): boolean => {
    if (!date) return true;
    const checkDate = date.clone().startOf('day');
    const minTermDate = this.terminationMinDate.clone().startOf('day');
    return !checkDate.isBefore(minTermDate);
  };

  osokOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: AddEditLicensedProductDialogData
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-initialize when mode or product changes (for side panel mode)
    if ((changes['mode'] || changes['product']) && !changes['mode']?.firstChange) {
      this.initializeComponent();
    }
  }

  private initializeComponent(): void {
    // Merge dialog data with Input properties (Input takes precedence for side panel mode)
    const effectiveMode = this.data?.mode || this.mode;
    const effectiveProduct = this.data?.product || this.product;
    const effectiveValidProducts = this.data?.validProducts || this.validProducts;

    this.initializeForm(effectiveMode, effectiveProduct);
    this.setupFormListeners();

    if (effectiveMode === 'add') {
      // Use products passed from parent component (pre-loaded on page load)
      if (effectiveValidProducts && effectiveValidProducts.length > 0) {
        this.validProducts = effectiveValidProducts;
        this.filteredProducts = effectiveValidProducts;
      } else {
        // Fallback: load from API if not passed
        this.loadValidProducts();
      }
      this.setupProductSearch();
    } else {
      this.selectedProductDesc.set(effectiveProduct?.productDescription || '--');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAddMode(): boolean {
    return (this.data?.mode || this.mode) === 'add';
  }

  get dialogTitle(): string {
    return this.isAddMode ? 'Add New Licensed Products' : 'Edit Licensed Products';
  }

  get lastModified(): string {
    const product = this.data?.product || this.product;
    if (!product?.insertDate) return '';
    const formatted = DateFieldValidationUtility.formatDateTimeForUI(product.insertDate);
    return formatted ? `Last Modified: ${formatted} PST` : '';
  }

  private initializeForm(mode: 'add' | 'edit', product: LicensedProduct | null | undefined): void {
    if (mode === 'add') {
      this.form = this.fb.group({
        productCode: ['', Validators.required],
        osokFlag: ['Y', Validators.required],
        effDate: [null, Validators.required],
        termDate: [null]
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
      });

      // Subscribe to productCode changes to update description
      this.form.get('productCode')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(code => {
          const product = this.validProducts.find(p => p.productCode === code);
          this.selectedProductDesc.set(product?.productDesc || '--');
        });

      // Setup Add mode validators (prevents past dates for Effective Date)
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      // Edit mode: Product Code is read-only, Effective Date and Termination Date are editable
      this.form = this.fb.group({
        osokFlag: [product?.osokFlag || 'Y', Validators.required],
        effDate: [
          product?.effDate ? moment(product.effDate) : null,
          Validators.required
        ],
        termDate: [
          product?.termDate ? moment(product.termDate) : null
        ]
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
      });

      // Override effective date validators to allow past dates in Edit mode
      const effDateControl = this.form.get('effDate');
      if (effDateControl) {
        effDateControl.clearValidators();
        effDateControl.setValidators([
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator()
        ]);
        effDateControl.updateValueAndValidity();
      }

      // Set terminationMinDate from existing effective date
      if (product?.effDate) {
        this.terminationMinDate = moment(product.effDate);
      }
    }
  }

  /**
   * Setup form value change listeners
   */
  private setupFormListeners(): void {
    // Track which date field was last changed for cross-field error display
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  /**
   * Update the minimum allowed date for termination date based on effective date
   */
  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effDate')?.value;

    if (effectiveValue && effectiveValue.isValid && effectiveValue.isValid()) {
      // If effective date is after the global minDate, use effective date as min
      // Otherwise, use the global minDate
      this.terminationMinDate = effectiveValue.isAfter(this.minDate)
        ? effectiveValue.clone()
        : this.minDate.clone();
    } else {
      // If no valid effective date, reset to global minDate
      this.terminationMinDate = this.minDate.clone();
    }
  }

  /**
   * Setup product search filtering
   */
  private setupProductSearch(): void {
    this.productSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProductOptions();
      });
  }

  /**
   * Filter product options based on search text
   */
  private filterProductOptions(): void {
    const searchTerm = (this.productSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredProducts = this.validProducts;
    } else {
      this.filteredProducts = this.validProducts.filter(product =>
        product.productCode.toLowerCase().includes(searchTerm) ||
        product.productDesc?.toLowerCase().includes(searchTerm)
      );
    }
  }

  private loadValidProducts(): void {
    // Products should be pre-loaded on page load via service cache
    this.loadingProducts.set(true);
    this.licensedProductsService.getValidProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.validProducts = products;
          this.filteredProducts = products;
          this.loadingProducts.set(false);
        },
        error: (err) => {
          this.loadingProducts.set(false);
          this.showError('Failed to load valid products');
        }
      });
  }

  onSave(): void {
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

    this.saving.set(true);

    if (this.isAddMode) {
      this.createProduct();
    } else {
      this.updateProduct();
    }
  }

  private createProduct(): void {
    const formValue = this.form.value;
    const effectiveChapterId = this.data?.chapterId || this.chapterId;
    const request: LicensedProductRequest = {
      productCode: formValue.productCode,
      chapterId: effectiveChapterId,
      osokFlag: formValue.osokFlag,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: formValue.termDate
        ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
        : null
    };

    this.licensedProductsService.createLicensedProduct(request, effectiveChapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showSuccess('Licensed product created successfully.');
          // Support both dialog and side panel modes
          if (this.dialogRef) {
            this.dialogRef.close({ action: 'save' });
          } else {
            this.saveSuccess.emit();
            this.close.emit();
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.showError(this.extractErrorMessage(err));
        }
      });
  }

  private updateProduct(): void {
    const effectiveProduct = this.data?.product || this.product;
    const effectiveChapterId = this.data?.chapterId || this.chapterId;

    if (!effectiveProduct) return;

    const formValue = this.form.value;
    const request: any = {
      osokFlag: formValue.osokFlag,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || ''
    };

    if (formValue.termDate) {
      request.termDate = DateFieldValidationUtility.serializeDateForApi(formValue.termDate);
    }

    this.licensedProductsService.updateLicensedProduct(
      effectiveProduct.productCode,
      effectiveChapterId,
      request
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showSuccess('Licensed product updated successfully.');
          // Support both dialog and side panel modes
          if (this.dialogRef) {
            this.dialogRef.close({ action: 'save' });
          } else {
            this.saveSuccess.emit();
            this.close.emit();
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.showError(this.extractErrorMessage(err));
        }
      });
  }

  onSaveAndAddAnother(): void {
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

    this.saving.set(true);
    const formValue = this.form.value;
    const effectiveChapterId = this.data?.chapterId || this.chapterId;
    const request: LicensedProductRequest = {
      productCode: formValue.productCode,
      chapterId: effectiveChapterId,
      osokFlag: formValue.osokFlag,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: formValue.termDate
        ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
        : null
    };

    this.licensedProductsService.createLicensedProduct(request, effectiveChapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showSuccess('Licensed product created successfully.');
          this.form.reset({ osokFlag: 'Y' });
          this.selectedProductDesc.set('--');
          this.lastChangedDateField = null;
          this.saveSuccess.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.showError(this.extractErrorMessage(err));
        }
      });
  }

  onCancel(): void {
    // Support both dialog and side panel modes
    if (this.dialogRef) {
      this.dialogRef.close({ action: 'cancel' });
    } else {
      this.close.emit();
    }
  }

  /**
   * Get form field error messages
   */
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
      !this.isAddMode // Edit mode flag
    );
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) {
      return 'Product Code is required';
    }
    if (control.errors['matDatepickerParse']) {
      return 'Invalid date format';
    }

    return '';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 8000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private extractErrorMessage(error: any): string {
    const errorResponse = error?.error?.errorResponse || error?.error;
    const errorCode = errorResponse?.errorCode || error?.errorCode;
    const errorMessage = errorResponse?.error ||
                        errorResponse?.message ||
                        error?.error?.message ||
                        error?.message ||
                        'An error occurred';

    return errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
  }
}
