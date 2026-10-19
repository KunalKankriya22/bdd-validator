import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  PrePrintedProductLabelModel,
  PrePrintedProductLabelFormValue,
  LookUp,
  LookUpWithDescription,
  ProductCodeItem
} from '../models/pre-printed-product-labels.model';
import { PrePrintedProductLabelsApiService } from '../services/pre-printed-product-labels-api.service';

@Component({
  selector: 'app-add-edit-pre-printed-product-label',
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
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-pre-printed-product-label.html',
  styleUrls: ['./add-edit-pre-printed-product-label.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditPrePrintedProductLabelComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly service = inject(PrePrintedProductLabelsApiService);
  readonly cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: PrePrintedProductLabelModel | null = null;
  @Input() catalogNumberOptions: LookUp[] = [];
  @Input() productTypeOptions: LookUpWithDescription[] = [];
  @Input() bagCodeOptions: LookUpWithDescription[] = [];

  @Output() save = new EventEmitter<PrePrintedProductLabelFormValue>();
  @Output() saveAndCreateAnother = new EventEmitter<PrePrintedProductLabelFormValue>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  catalogNumberSearchCtrl = new FormControl('');
  productTypeSearchCtrl = new FormControl('');
  bagCodeSearchCtrl = new FormControl('');
  faceLabelSearchCtrl = new FormControl('');

  filteredCatalogNumbers: LookUp[] = [];
  filteredProductTypes: LookUpWithDescription[] = [];
  filteredBagCodes: LookUpWithDescription[] = [];
  filteredProductCodes: ProductCodeItem[] = [];

  productCodeOptions: ProductCodeItem[] = [];
  isLoadingProductCodes = false;

  selectedProductTypeDescription = '';

  minDate: Moment;
  terminationMinDate: Moment;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.minDate.startOf('day');

    if (checkDate.isBefore(today)) {
      return false;
    }

    const eff = this.form?.get('effDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.setupSearchFilters();
    this.setupModeValidators();
    this.setupProductTypeDescriptionUpdater();
    this.setupProductTypeCodeLoader();

    if (this.mode === 'edit' && this.data?.productType) {
      this.loadProductCodes(this.data.productType);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['catalogNumberOptions']) {
      this.filteredCatalogNumbers = this.catalogNumberOptions;
    }
    if (changes['productTypeOptions']) {
      this.filteredProductTypes = this.productTypeOptions;
    }
    if (changes['bagCodeOptions']) {
      this.filteredBagCodes = this.bagCodeOptions;
    }

    const dataChanged = changes['data'] && !changes['data'].firstChange;
    const modeChanged = changes['mode'] && !changes['mode'].firstChange;

    if (dataChanged || modeChanged) {
      this.reinitializePanel();
    }
  }

  private reinitializePanel(): void {
    this.destroy$.next();
    this.destroy$ = new Subject<void>();

    this.isSubmitting = false;
    this.errorMessage = null;
    this.lastChangedDateField = null;
    this.selectedProductTypeDescription = '';
    this.productCodeOptions = [];
    this.filteredProductCodes = [];

    this.catalogNumberSearchCtrl.setValue('', { emitEvent: false });
    this.productTypeSearchCtrl.setValue('', { emitEvent: false });
    this.bagCodeSearchCtrl.setValue('', { emitEvent: false });
    this.faceLabelSearchCtrl.setValue('', { emitEvent: false });

    this.filteredCatalogNumbers = this.catalogNumberOptions;
    this.filteredProductTypes = this.productTypeOptions;
    this.filteredBagCodes = this.bagCodeOptions;

    this.patchFormForCurrentData();
    this.setupDateValidationListeners();
    this.setupSearchFilters();
    this.setupModeValidators();
    this.setupProductTypeDescriptionUpdater();
    this.setupProductTypeCodeLoader();

    if (this.mode === 'edit' && this.data?.productType) {
      this.loadProductCodes(this.data.productType);
    }

    this.cdr.markForCheck();
  }

  private patchFormForCurrentData(): void {
    this.form.get('catalogNumber')?.enable({ emitEvent: false });
    this.form.get('productType')?.enable({ emitEvent: false });
    this.form.get('faceLabel')?.enable({ emitEvent: false });

    this.form.patchValue({
      catalogNumber: this.mode === 'edit' ? this.data?.catalogNumber : null,
      productType: this.data?.productType || null,
      bagCode: this.data?.bagCode || null,
      faceLabel: this.data?.faceLabel || null,
      effDate: this.data?.effDate ? moment(this.data.effDate) : null,
      termDate: this.data?.termDate ? moment(this.data.termDate) : null,
    }, { emitEvent: false });

    if (!this.data?.productType) {
      this.form.get('faceLabel')?.disable({ emitEvent: false });
    }

    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });

    if (this.mode === 'edit') {
      this.form.get('catalogNumber')?.disable({ emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupModeValidators(): void {
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      const termControl = this.form.get('termDate');
      if (termControl) {
        termControl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset));
        termControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
  }

  private setupSearchFilters(): void {
    this.filteredCatalogNumbers = this.catalogNumberOptions;
    this.filteredProductTypes = this.productTypeOptions;
    this.filteredBagCodes = this.bagCodeOptions;

    this.catalogNumberSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredCatalogNumbers = this.filterList(
          this.catalogNumberOptions, search, (c) => c.value
        );
        this.cdr.markForCheck();
      });

    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProductTypes = this.filterList(
          this.productTypeOptions, search, (p) => `${p.value} - ${p.description}`
        );
        this.cdr.markForCheck();
      });

    this.bagCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredBagCodes = this.filterList(
          this.bagCodeOptions, search, (b) => b.value
        );
        this.cdr.markForCheck();
      });

    this.faceLabelSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProductCodes = this.filterList(
          this.productCodeOptions, search, (p) => `${p.value} - ${p.description}`
        );
        this.cdr.markForCheck();
      });
  }

  private filterList<T>(list: T[], search: string | null, accessor: (item: T) => string): T[] {
    if (!search) return list;
    const term = search.toLowerCase();
    return list.filter((item) => accessor(item).toLowerCase().includes(term));
  }

  private setupProductTypeDescriptionUpdater(): void {
    this.form.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedValue: string | null) => {
        if (selectedValue) {
          const selectedType = this.productTypeOptions.find(
            (type) => type.value === selectedValue
          );
          this.selectedProductTypeDescription = selectedType?.description || '';
        } else {
          this.selectedProductTypeDescription = '';
        }
        this.cdr.markForCheck();
      });

    const initialProductType = this.form.get('productType')?.value;
    if (initialProductType) {
      const selectedType = this.productTypeOptions.find(
        (type) => type.value === initialProductType
      );
      this.selectedProductTypeDescription = selectedType?.description || '';
    }
  }

  private setupProductTypeCodeLoader(): void {
    const faceLabelCtrl = this.form.get('faceLabel');

    this.form.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productType: string | null) => {
        faceLabelCtrl?.setValue(null);
        this.productCodeOptions = [];
        this.filteredProductCodes = [];

        if (productType) {
          faceLabelCtrl?.enable({ emitEvent: false });
          this.loadProductCodes(productType);
        } else {
          faceLabelCtrl?.disable({ emitEvent: false });
        }
      });
  }

  private loadProductCodes(productType: string): void {
    this.isLoadingProductCodes = true;
    this.cdr.markForCheck();

    this.service.getProductCodes(productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.productCodeOptions = codes;
          this.filteredProductCodes = codes;
          this.isLoadingProductCodes = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.productCodeOptions = [];
          this.filteredProductCodes = [];
          this.isLoadingProductCodes = false;
          this.cdr.markForCheck();
        }
      });
  }

  onProductCodeSelected(productCode: string): void {
    if (productCode && productCode.length === 5) {
      const paddedValue = productCode + '000';
      this.form.get('faceLabel')?.setValue(paddedValue);
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      catalogNumber: [
        this.mode === 'edit' ? this.data?.catalogNumber : null,
        [Validators.required, Validators.maxLength(10)]
      ],
      productType: [this.data?.productType || null, [Validators.required, Validators.maxLength(5)]],
      bagCode: [this.data?.bagCode || null, [Validators.required, Validators.maxLength(4)]],
      faceLabel: [
        { value: this.data?.faceLabel || null, disabled: !this.data?.productType },
        [Validators.required, Validators.maxLength(8)]
      ],
      effDate: [
        this.data?.effDate ? moment(this.data.effDate) : null,
        [Validators.required]
      ],
      termDate: [
        this.data?.termDate ? moment(this.data.termDate) : null
      ],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });

    if (this.mode === 'edit') {
      this.form.get('catalogNumber')?.disable();
    }
  }

  private setupDateValidationListeners(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.cdr.markForCheck();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private updateTerminationMinDate(): void {
    const effDate = this.form?.get('effDate')?.value;
    if (effDate && moment.isMoment(effDate)) {
      this.terminationMinDate = effDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  get editEffectiveDateDisplay(): string {
    const effDate = this.form?.get('effDate')?.value;
    if (!effDate) return '-';
    return DateFieldValidationUtility.formatDateForUI(effDate)?.toUpperCase() || '-';
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

  onSave(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.save.emit(this.getFormValue());
    }
  }

  onSaveAndCreateAnother(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.saveAndCreateAnother.emit(this.getFormValue());
    }
  }

  private validateForm(): boolean {
    const termControl = this.form.get('termDate');
    const termWasTouched = this.mode === 'edit' && termControl?.touched;

    this.form.markAllAsTouched();

    if (this.mode === 'edit' && !termWasTouched && termControl) {
      termControl.markAsUntouched();
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.mode === 'edit') {
      return !this.getEffectiveDateError() && !this.getTerminationDateError();
    }

    return !this.form.invalid && !this.form.hasError('dateRangeInvalid');
  }

  resetFormForCreateAnother(): void {
    this.form.reset({
      catalogNumber: null,
      productType: null,
      bagCode: null,
      faceLabel: null,
      effDate: null,
      termDate: null,
    });
    this.form.get('catalogNumber')?.enable();
    this.form.get('productType')?.enable();
    this.form.get('faceLabel')?.disable({ emitEvent: false });
    this.selectedProductTypeDescription = '';
    this.productCodeOptions = [];
    this.filteredProductCodes = [];
    this.errorMessage = null;
    this.isSubmitting = false;

    this.catalogNumberSearchCtrl.setValue('', { emitEvent: false });
    this.productTypeSearchCtrl.setValue('', { emitEvent: false });
    this.bagCodeSearchCtrl.setValue('', { emitEvent: false });
    this.faceLabelSearchCtrl.setValue('', { emitEvent: false });

    this.filteredCatalogNumbers = this.catalogNumberOptions;
    this.filteredProductTypes = this.productTypeOptions;
    this.filteredBagCodes = this.bagCodeOptions;

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    this.cdr.markForCheck();
  }

  onCancel(): void {
    this.close.emit();
  }

  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.mode === 'edit'
    );
  }

  private getFormValue(): PrePrintedProductLabelFormValue {
    const raw = this.form.getRawValue();
    return {
      catalogNumber: raw.catalogNumber,
      productType: raw.productType,
      bagCode: raw.bagCode,
      faceLabel: raw.faceLabel,
      effDate: raw.effDate,
      termDate: raw.termDate,
    };
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      return this.form.dirty && !this.getEffectiveDateError() && !this.getTerminationDateError();
    }

    const termControl = this.form.get('termDate');
    if (termControl?.hasError('invalidDate') ||
        termControl?.hasError('invalidDateFormat') ||
        termControl?.hasError('matDatepickerParse') ||
        this.form.hasError('dateRangeInvalid')) {
      return false;
    }

    return Object.keys(this.form.controls)
      .filter(key => key !== 'termDate')
      .every(key => {
        const control = this.form.get(key);
        return !control || control.disabled || control.valid;
      });
  }

  get dialogTitle(): string {
    return this.mode === 'add' ? 'New Pre-Printed Product Label' : 'Edit Pre-Printed Product Label';
  }

  get submitButtonLabel(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  get showCreateAnotherButton(): boolean {
    return this.mode === 'add';
  }
}
