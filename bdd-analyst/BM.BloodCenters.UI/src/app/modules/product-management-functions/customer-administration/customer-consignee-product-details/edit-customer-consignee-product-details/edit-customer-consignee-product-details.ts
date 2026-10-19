import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { A11yModule } from '@angular/cdk/a11y';
import moment, { Moment } from 'moment';
import { Subject, takeUntil } from 'rxjs';

import {
  CustomerConsigneeProductDetailsDto,
  CreateCustomerConsigneeProductRequestDto,
  UpdateCustomerConsigneeProductRequestDto,
  ProductTypeLOV,
  ProductCodeLOV
} from '../models/customer-consignee-product-details.model';
import { CustomerConsigneeProductDetailsApiService } from '../services/customer-consignee-product-details-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-edit-customer-consignee-product-details-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './edit-customer-consignee-product-details.html',
  styleUrls: ['./edit-customer-consignee-product-details.scss']
})
export class EditCustomerConsigneeProductDetailsDialog implements OnInit, OnChanges, OnDestroy {
  @Input() data: CustomerConsigneeProductDetailsDto | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private service = inject(CustomerConsigneeProductDetailsApiService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  editForm!: FormGroup;
  isSaving = false;
  lastModifiedDisplay = '';

  productTypeOptions: ProductTypeLOV[] = [];
  productCodeOptions: ProductCodeLOV[] = [];
  filteredProductTypeOptions: ProductTypeLOV[] = [];
  filteredProductCodeOptions: ProductCodeLOV[] = [];
  productTypeSearchCtrl = new FormControl<string>('');
  productCodeSearchCtrl = new FormControl<string>('');
  isLoadingProductTypes = false;
  isLoadingProductCodes = false;
  productRequiredError = false;

  minDate!: Moment;
  lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher!: ErrorStateMatcher;
  termDateErrorMatcher!: ErrorStateMatcher;

  private originalProductType: string | null = null;
  private originalProductCode: string | null = null;
  private originalTermDate: Moment | null = null;
  private suppressMutualExclusion = false;

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  terminationDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');

    if (checkDate.isBefore(today)) {
      return false;
    }

    const effectiveDate = this.editForm?.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  constructor() {
    this.initForm();
    this.effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
    this.termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    this.loadProductTypes();
    this.loadProductCodes();
    this.subscribeMutualExclusion();
    this.subscribeSearchControls();
    this.subscribeToChapterChanges();
    this.setupDateValidationListeners();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.editForm, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.editForm, this.chapterOffset);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get panelTitle(): string {
    return this.mode === 'add' ? 'Add New Product Details' : 'Edit Product Details';
  }

  get effectiveDateDisplay(): string {
    if (!this.data?.effDate) return '--';
    return DateFieldValidationUtility.formatDateForUI(moment(this.data.effDate));
  }

  selectedProductTypeDisplay(): string {
    const value = this.editForm?.get('productType')?.value;
    if (!value) return '';
    const type = this.productTypeOptions.find(t => t.productType === value);
    if (!type) return value;
    return type.description ? `${type.productType} - ${type.description}` : type.productType;
  }

  selectedProductCodeDisplay(): string {
    const value = this.editForm?.get('productCode')?.value;
    if (!value) return '';
    const code = this.productCodeOptions.find(c => c.productCode === value);
    if (!code) return value;
    return code.description ? `${code.productCode} - ${code.description}` : code.productCode;
  }

  showTooltipIfOverflowing(el: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = el.scrollWidth <= el.clientWidth;
  }


  get hasChanges(): boolean {
    if (this.mode !== 'edit') return false;
    const formValue = this.editForm.getRawValue();
    const productTypeChanged = (formValue.productType || null) !== (this.originalProductType || null);
    const productCodeChanged = (formValue.productCode || null) !== (this.originalProductCode || null);
    const currentTerm = formValue.terminationDate ? moment(formValue.terminationDate) : null;
    const termDateChanged = currentTerm && this.originalTermDate
      ? !currentTerm.isSame(this.originalTermDate, 'day')
      : currentTerm !== this.originalTermDate;
    return productTypeChanged || productCodeChanged || termDateChanged;
  }

  get isFormValid(): boolean {
    if (!this.editForm.valid) return false;
    if (this.mode === 'edit') {
      const formValue = this.editForm.getRawValue();
      const productTypeChanged = (formValue.productType || null) !== (this.originalProductType || null);
      const productCodeChanged = (formValue.productCode || null) !== (this.originalProductCode || null);
      const currentTerm = formValue.terminationDate ? moment(formValue.terminationDate) : null;
      const termDateChanged = currentTerm && this.originalTermDate
        ? !currentTerm.isSame(this.originalTermDate, 'day')
        : currentTerm !== this.originalTermDate;
      return productTypeChanged || productCodeChanged || termDateChanged;
    }
    return true;
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      productType: [null],
      productCode: [null],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        this.productRequiredValidator,
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });
  }

  private productRequiredValidator(group: AbstractControl): ValidationErrors | null {
    const productType = group.get('productType')?.value;
    const productCode = group.get('productCode')?.value;
    if (!productType && !productCode) {
      return { productRequired: true };
    }
    return null;
  }

  private setupDateValidationListeners(): void {
    this.editForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.editForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  private subscribeMutualExclusion(): void {
    this.editForm.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (this.suppressMutualExclusion) return;
        this.productRequiredError = false;
        if (value) {
          this.suppressMutualExclusion = true;
          this.editForm.get('productCode')?.setValue(null, { emitEvent: true });
          this.suppressMutualExclusion = false;
        }
      });

    this.editForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (this.suppressMutualExclusion) return;
        this.productRequiredError = false;
        if (value) {
          this.suppressMutualExclusion = true;
          this.editForm.get('productType')?.setValue(null, { emitEvent: true });
          this.suppressMutualExclusion = false;
        }
      });
  }

  private populateForm(): void {
    this.productRequiredError = false;

    if (this.mode === 'edit' && this.data) {
      this.originalProductType = this.data.productType || null;
      this.originalProductCode = this.data.productCode || null;
      const termDate = this.data.termDate ? moment(this.data.termDate) : null;
      this.originalTermDate = termDate;

      const effDate = this.data.effDate ? moment(this.data.effDate) : moment();
      this.suppressMutualExclusion = true;
      this.editForm.patchValue({
        productType: this.data.productType || null,
        productCode: this.data.productCode || null,
        effectiveDate: effDate,
        terminationDate: termDate
      });
      this.suppressMutualExclusion = false;

      DateFieldValidationUtility.setupEditModeValidators(this.editForm, this.chapterOffset);

      this.lastModifiedDisplay = this.data.insertDate
        ? `Last Modified: ${DateFieldValidationUtility.formatDateTimeForUI(this.data.insertDate)}`
        : '';
    } else {
      this.originalProductType = null;
      this.originalProductCode = null;
      this.originalTermDate = null;
      this.lastModifiedDisplay = '';
      this.suppressMutualExclusion = true;
      this.editForm.reset();
      this.suppressMutualExclusion = false;

      DateFieldValidationUtility.setupAddModeValidators(this.editForm, this.chapterOffset);
    }

    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        this.loadProductTypes();
        this.loadProductCodes();
        this.productTypeSearchCtrl.setValue('', { emitEvent: false });
        this.productCodeSearchCtrl.setValue('', { emitEvent: false });
      });
  }

  private subscribeSearchControls(): void {
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.filterProductTypes(value || '');
      });

    this.productCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.filterProductCodes(value || '');
      });
  }

  private filterProductTypes(search: string): void {
    if (!search) {
      this.filteredProductTypeOptions = this.productTypeOptions.slice();
      return;
    }
    const lc = search.toLowerCase();
    this.filteredProductTypeOptions = this.productTypeOptions.filter(t =>
      t.productType.toLowerCase().includes(lc) ||
      (t.description ?? '').toLowerCase().includes(lc)
    );
  }

  private filterProductCodes(search: string): void {
    if (!search) {
      this.filteredProductCodeOptions = this.productCodeOptions.slice();
      return;
    }
    const lc = search.toLowerCase();
    this.filteredProductCodeOptions = this.productCodeOptions.filter(c =>
      c.productCode.toLowerCase().includes(lc) ||
      (c.description ?? '').toLowerCase().includes(lc)
    );
  }

  private loadProductTypes(): void {
    this.isLoadingProductTypes = true;
    this.service.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.productTypeOptions = types;
          this.filteredProductTypeOptions = types.slice();
          this.isLoadingProductTypes = false;
        },
        error: () => {
          this.productTypeOptions = [];
          this.filteredProductTypeOptions = [];
          this.isLoadingProductTypes = false;
        }
      });
  }

  private loadProductCodes(): void {
    this.isLoadingProductCodes = true;
    this.service.getProductCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.productCodeOptions = codes;
          this.filteredProductCodeOptions = codes.slice();
          this.isLoadingProductCodes = false;
        },
        error: () => {
          this.productCodeOptions = [];
          this.filteredProductCodeOptions = [];
          this.isLoadingProductCodes = false;
        }
      });
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.editForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.editForm.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.editForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.editForm.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.editForm.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.editForm.get('terminationDate'),
      this.mode === 'edit'
    );
  }

  onSave(): void {
    this.editForm.markAllAsTouched();
    this.productRequiredError = this.editForm.hasError('productRequired');
    if (this.productRequiredError) return;

    if (this.mode === 'edit') {
      const formErrors = this.editForm.errors;
      if (formErrors?.['dateRangeInvalid']) {
        this.editForm.get('terminationDate')?.markAsTouched();
        return;
      }
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.editForm, 'terminationDate');

    if (this.mode === 'add' && !this.editForm.valid) return;
    if (this.mode === 'edit' && !this.isFormValid) return;
    if (!this.data) return;

    this.isSaving = true;
    const formValue = this.mode === 'edit' ? this.editForm.getRawValue() : this.editForm.value;

    if (this.mode === 'add') {
      this.createRecord(formValue, false);
    } else {
      this.updateRecord(formValue);
    }
  }

  onAddAndCreateAnother(): void {
    this.editForm.markAllAsTouched();
    this.productRequiredError = this.editForm.hasError('productRequired');
    if (this.productRequiredError) return;

    DateFieldValidationUtility.clearOptionalDateErrors(this.editForm, 'terminationDate');

    if (this.mode !== 'add' || !this.editForm.valid || !this.data) return;

    this.isSaving = true;
    this.createRecord(this.editForm.value, true);
  }

  private createRecord(formValue: any, keepOpen: boolean): void {
    const dto: CreateCustomerConsigneeProductRequestDto = {
      customerId: this.data!.customerId,
      consigneeId: this.data!.consigneeId || null,
      productType: formValue.productType || null,
      productCode: formValue.productCode || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.service.createCustomerConsigneeProduct(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          const message = response?.message || `New product details added to Customer ID ${this.data!.customerId}.`;
          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit();
          if (keepOpen) {
            this.productRequiredError = false;
            this.editForm.reset();
            this.editForm.markAsPristine();
            this.editForm.markAsUntouched();
          } else {
            this.closePanel.emit();
          }
        },
        error: (error) => {
          this.isSaving = false;
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to add product details.';
          this.snackbarService.showError(code ? `Error ${code}: ${msg}` : msg);
        }
      });
  }

  private updateRecord(formValue: any): void {
    const dto: UpdateCustomerConsigneeProductRequestDto = {
      productType: formValue.productType || null,
      productCode: formValue.productCode || null,
      effDate: this.data!.effDate,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.service.updateCustomerConsigneeProduct(
      this.data!.customerId,
      this.data!.consigneeId || null,
      this.originalProductType,
      this.originalProductCode,
      dto
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          const message = response?.message || `Product details for Customer ID ${this.data!.customerId} are saved.`;
          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (error) => {
          this.isSaving = false;
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to update product details.';
          this.snackbarService.showError(code ? `Error ${code}: ${msg}` : msg);
        }
      });
  }

  onClearAll(): void {
    this.productRequiredError = false;
    this.suppressMutualExclusion = true;
    if (this.mode === 'edit') {
      this.editForm.patchValue({
        productType: this.originalProductType,
        productCode: this.originalProductCode,
        terminationDate: this.originalTermDate
      });
    } else {
      this.editForm.reset();
    }
    this.suppressMutualExclusion = false;
    this.editForm.markAsDirty();
  }

  onCancel(): void {
    this.closePanel.emit();
  }
}
