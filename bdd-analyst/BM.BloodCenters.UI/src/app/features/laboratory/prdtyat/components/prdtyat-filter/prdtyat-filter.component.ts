import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductTypeAttributeFilterValue } from '../../models/product-type-attribute.model';
import {
  AnticoagulantCodeLov,
  ProductTypeLov,
  AttributeGroupLov
} from '../../models/product-type-attribute-lov.model';
import { PrdtyatService } from '../../services/prdtyat.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';

@Component({
  selector: 'app-prdtyat-filter',
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
    NgxMatSelectSearchModule,
    FilterPanelBase
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './prdtyat-filter.component.html',
  styleUrls: ['./prdtyat-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrdtyatFilterComponent implements OnInit, OnDestroy {
  @Input() currentFilters: ProductTypeAttributeFilterValue | null = null;
  @Output() apply = new EventEmitter<ProductTypeAttributeFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  anticoagulantCodeOptions: AnticoagulantCodeLov[] = [];
  productTypeOptions: ProductTypeLov[] = [];
  attributeOptions: AttributeGroupLov[] = [];

  anticoagulantSearchControl = new FormControl('');
  productTypeSearchControl = new FormControl('');
  attributeSearchControl = new FormControl('');

  filteredAnticoagulantOptions: AnticoagulantCodeLov[] = [];
  filteredProductTypeOptions: ProductTypeLov[] = [];
  filteredAttributeOptions: AttributeGroupLov[] = [];

  periodOptions: string[] = ['After', 'Before'];

  isLoading = false;
  hasChanges = false;

  private appliedFilterSnapshot!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private prdtyatService: PrdtyatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupForm();
    this.loadFilterOptions();
    this.setupSearchControls();
    this.setupValidation();

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);

    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasChanges = this.normalizeFormValue(this.filterForm.value) !== this.appliedFilterSnapshot;
      this.cdr.markForCheck();
    });

    this.filterForm.get('effectiveDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.filterForm.get('terminationDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupForm(): void {
    const effectiveDatePeriod = this.currentFilters?.effectiveDateFrom
      ? 'After'
      : this.currentFilters?.effectiveDateTo
        ? 'Before'
        : null;

    const terminationDatePeriod = this.currentFilters?.terminationDateFrom
      ? 'After'
      : this.currentFilters?.terminationDateTo
        ? 'Before'
        : null;

    const effectiveDate = this.currentFilters?.effectiveDateFrom
      ? new Date(this.currentFilters.effectiveDateFrom)
      : this.currentFilters?.effectiveDateTo
        ? new Date(this.currentFilters.effectiveDateTo)
        : null;

    const terminationDate = this.currentFilters?.terminationDateFrom
      ? new Date(this.currentFilters.terminationDateFrom)
      : this.currentFilters?.terminationDateTo
        ? new Date(this.currentFilters.terminationDateTo)
        : null;

    this.filterForm = this.fb.group({
      anticoagulantCode: [this.currentFilters?.anticoagulantCode ?? null],
      productType: [this.currentFilters?.productType ?? null],
      attribute: [this.currentFilters?.attribute ?? null],
      effectiveDatePeriod: [effectiveDatePeriod],
      effectiveDate: [effectiveDate],
      terminationDatePeriod: [terminationDatePeriod],
      terminationDate: [terminationDate]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });
  }

  private setupValidation(): void {
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.validateEffectiveDatePeriod();
        if (!value) {
          const control = this.filterForm.get('effectiveDate');
          control?.setErrors(null);
          control?.markAsUntouched();
          control?.markAsPristine();
        }
        this.cdr.markForCheck();
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.validateTerminationDatePeriod();
        if (!value) {
          const control = this.filterForm.get('terminationDate');
          control?.setErrors(null);
          control?.markAsUntouched();
          control?.markAsPristine();
        }
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const periodControl = this.filterForm.get('effectiveDatePeriod');
    const dateControl = this.filterForm.get('effectiveDate');

    if (effectiveDate && !effectiveDatePeriod) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }

    if (!effectiveDate) {
      dateControl?.setErrors(null);
      dateControl?.markAsUntouched();
      dateControl?.markAsPristine();
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const periodControl = this.filterForm.get('terminationDatePeriod');
    const dateControl = this.filterForm.get('terminationDate');

    if (terminationDate && !terminationDatePeriod) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }

    if (!terminationDate) {
      dateControl?.setErrors(null);
      dateControl?.markAsUntouched();
      dateControl?.markAsPristine();
    }
  }

  private loadFilterOptions(): void {
    this.isLoading = true;

    forkJoin({
      anticoagulantCodes: this.prdtyatService.getAnticoagulantCodesFilter(),
      productTypes: this.prdtyatService.getProductTypesFilter(),
      attributes: this.prdtyatService.getAttributesFilter()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.anticoagulantCodeOptions = response.anticoagulantCodes || [];
          this.filteredAnticoagulantOptions = [...this.anticoagulantCodeOptions];

          this.productTypeOptions = response.productTypes || [];
          this.filteredProductTypeOptions = [...this.productTypeOptions];

          this.attributeOptions = response.attributes || [];
          this.filteredAttributeOptions = [...this.attributeOptions];

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private setupSearchControls(): void {
    this.anticoagulantSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchText) => this.filterOptions(searchText || '', this.anticoagulantCodeOptions, 'anticoagulant'));

    this.productTypeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchText) => this.filterOptions(searchText || '', this.productTypeOptions, 'productType'));

    this.attributeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchText) => this.filterOptions(searchText || '', this.attributeOptions, 'attribute'));
  }

  private filterOptions(searchText: string, allOptions: any[], type: string): void {
    const filtered = !searchText
      ? [...allOptions]
      : allOptions.filter(option => {
          const lowerSearch = searchText.toLowerCase();
          return (option.code ?? '').toLowerCase().includes(lowerSearch) ||
            (option.description ?? '').toLowerCase().includes(lowerSearch);
        });

    switch (type) {
      case 'anticoagulant': this.filteredAnticoagulantOptions = filtered; break;
      case 'productType': this.filteredProductTypeOptions = filtered; break;
      case 'attribute': this.filteredAttributeOptions = filtered; break;
    }
    this.cdr.markForCheck();
  }

  onEffectiveDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value?.trim();
    DateFieldValidationUtility.handleEndDateInput(inputValue, this.filterForm.get('effectiveDate'), false);
  }

  onTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value?.trim();
    DateFieldValidationUtility.handleEndDateInput(inputValue, this.filterForm.get('terminationDate'), false);
  }

  onEffectiveDateBlur(): void {
    this.filterForm.get('effectiveDate')?.markAsTouched();
    this.cdr.markForCheck();
  }

  onTerminationDateBlur(): void {
    this.filterForm.get('terminationDate')?.markAsTouched();
    this.cdr.markForCheck();
  }

  onEffectiveDateChange(): void {
    this.cdr.markForCheck();
  }

  onTerminationDateChange(): void {
    this.cdr.markForCheck();
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.filterForm.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      this.filterForm.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.filterForm.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      this.filterForm.errors
    );
  }

  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (control?.touched && control?.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (control?.touched && control?.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  get isClearDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return true;

    return !(
      formValue.anticoagulantCode ||
      formValue.productType ||
      formValue.attribute ||
      formValue.effectiveDatePeriod ||
      formValue.effectiveDate ||
      formValue.terminationDatePeriod ||
      formValue.terminationDate
    );
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return true;

    const hasAnyValue = !!(
      formValue.anticoagulantCode ||
      formValue.productType ||
      formValue.attribute ||
      formValue.effectiveDate ||
      formValue.terminationDate
    );

    return !hasAnyValue || !this.hasChanges || this.hasValidationErrors;
  }

  get hasValidationErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');

    const effectiveDateHasFormatError = !!(
      effectiveDateControl?.hasError('invalidDateFormat') ||
      effectiveDateControl?.hasError('matDatepickerParse')
    );
    const terminationDateHasFormatError = !!(
      terminationDateControl?.hasError('invalidDateFormat') ||
      terminationDateControl?.hasError('matDatepickerParse')
    );

    return !!(
      this.filterForm.get('effectiveDatePeriod')?.invalid ||
      this.filterForm.get('terminationDatePeriod')?.invalid ||
      effectiveDateHasFormatError ||
      terminationDateHasFormatError
    );
  }

  blurField(): void {
    (document.activeElement as HTMLElement)?.blur();
  }

  onApply(): void {
    const effectiveDatePeriod = this.filterForm.value.effectiveDatePeriod;
    const effectiveDate = this.filterForm.value.effectiveDate;
    const terminationDatePeriod = this.filterForm.value.terminationDatePeriod;
    const terminationDate = this.filterForm.value.terminationDate;

    let hasError = false;

    if (effectiveDate && !effectiveDatePeriod) {
      this.validateEffectiveDatePeriod();
      hasError = true;
    }

    if (terminationDate && !terminationDatePeriod) {
      this.validateTerminationDatePeriod();
      hasError = true;
    }

    this.filterForm.get('effectiveDate')?.markAsTouched();
    this.filterForm.get('terminationDate')?.markAsTouched();

    if (this.filterForm.hasError('dateRangeInvalid')) {
      hasError = true;
    }

    if (hasError || this.hasValidationErrors) {
      this.cdr.markForCheck();
      return;
    }

    const filters: ProductTypeAttributeFilterValue = {
      anticoagulantCode: this.filterForm.value.anticoagulantCode || null,
      productType: this.filterForm.value.productType || null,
      attribute: this.filterForm.value.attribute || null,
      effectiveDateFrom: effectiveDatePeriod === 'After' && effectiveDate
        ? DateFieldValidationUtility.serializeDateForApi(effectiveDate)
        : null,
      effectiveDateTo: effectiveDatePeriod === 'Before' && effectiveDate
        ? DateFieldValidationUtility.serializeDateForApi(effectiveDate)
        : null,
      terminationDateFrom: terminationDatePeriod === 'After' && terminationDate
        ? DateFieldValidationUtility.serializeDateForApi(terminationDate)
        : null,
      terminationDateTo: terminationDatePeriod === 'Before' && terminationDate
        ? DateFieldValidationUtility.serializeDateForApi(terminationDate)
        : null
    };

    this.apply.emit(filters);
    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.anticoagulantSearchControl.setValue('');
    this.productTypeSearchControl.setValue('');
    this.attributeSearchControl.setValue('');
    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  private normalizeFormValue(formValue: typeof this.filterForm.value): string {
    return JSON.stringify({
      anticoagulantCode: formValue.anticoagulantCode || null,
      productType: formValue.productType || null,
      attribute: formValue.attribute || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate?.format?.('YYYY-MM-DD') ?? null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate?.format?.('YYYY-MM-DD') ?? null
    });
  }
}
