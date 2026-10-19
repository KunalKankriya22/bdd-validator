import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
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
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import {
  ProductAttributeFilterValue,
  ProductTypeDropdown,
  AttributeGroupDropdown,
  AttributeCodeDropdown
} from '../models/product-attribute.model';
import { ProductAttributeService } from '../services/product-attribute.service';

/**
 * Filter Panel Component for Product Type Attributes
 */
@Component({
  selector: 'app-product-attribute-filter-panel',
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
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductAttributeFilterPanel implements OnInit, OnDestroy {
  @ViewChild('effDateInput') effDateInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('termDateInput') termDateInputRef?: ElementRef<HTMLInputElement>;

  @Input() currentFilters: ProductAttributeFilterValue | null = null;
  @Output() apply = new EventEmitter<ProductAttributeFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  private effDateRawInput = '';
  private termDateRawInput = '';

  // Filter options
  productTypeOptions: ProductTypeDropdown[] = [];
  attributeGroupOptions: AttributeGroupDropdown[] = [];
  attributeCodeOptions: AttributeCodeDropdown[] = [];
  // Search controls
  productTypeSearchControl = new FormControl('');
  attributeGroupSearchControl = new FormControl('');
  attributeCodeSearchControl = new FormControl('');

  // Filtered options
  filteredProductTypeOptions: ProductTypeDropdown[] = [];
  filteredAttributeGroupOptions: AttributeGroupDropdown[] = [];
  filteredAttributeCodeOptions: AttributeCodeDropdown[] = [];

  isLoading = false;
  private initialFilterValues: ProductAttributeFilterValue | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productAttributeService: ProductAttributeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupForm();
    this.loadFilterOptions();
    this.setupSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupForm(): void {
    this.initialFilterValues = this.currentFilters ? { ...this.currentFilters } : null;

    const effDate = this.currentFilters?.effDate
      ? (moment.isMoment(this.currentFilters.effDate) ? this.currentFilters.effDate : moment(this.currentFilters.effDate))
      : null;
    const termDate = this.currentFilters?.termDate
      ? (moment.isMoment(this.currentFilters.termDate) ? this.currentFilters.termDate : moment(this.currentFilters.termDate))
      : null;

    this.filterForm = this.fb.group({
      productType: [this.currentFilters?.productType ?? null],
      attribGroup: [this.currentFilters?.attribGroup ?? null],
      attribCode: [this.currentFilters?.attribCode ?? null],
      effDatePeriod: [this.currentFilters?.effDatePeriod ?? null],
      effDate: [effDate],
      termDatePeriod: [this.currentFilters?.termDatePeriod ?? null],
      termDate: [termDate]
    });

    this.filterForm.get('effDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateEffDatePeriod();
      this.cdr.markForCheck();
    });
    this.filterForm.get('effDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateEffDatePeriod();
      this.cdr.markForCheck();
    });
    this.filterForm.get('termDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateTermDatePeriod();
      this.cdr.markForCheck();
    });
    this.filterForm.get('termDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateTermDatePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  private validateEffDatePeriod(): void {
    const effDate = this.filterForm.get('effDate')?.value;
    const effDatePeriod = this.filterForm.get('effDatePeriod')?.value;
    const periodControl = this.filterForm.get('effDatePeriod');
    const dateControl = this.filterForm.get('effDate');

    if (effDate && !effDatePeriod) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }

    if (effDatePeriod && !effDate) {
      dateControl?.setErrors({ ...(dateControl.errors || {}), required: true });
      dateControl?.markAsTouched();
    } else if (!dateControl?.hasError('invalidDate') && !dateControl?.hasError('matDatepickerParse')) {
      dateControl?.setErrors(null);
    }
  }

  private validateTermDatePeriod(): void {
    const termDate = this.filterForm.get('termDate')?.value;
    const termDatePeriod = this.filterForm.get('termDatePeriod')?.value;
    const periodControl = this.filterForm.get('termDatePeriod');
    const dateControl = this.filterForm.get('termDate');

    if (termDate && !termDatePeriod) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }

    if (termDatePeriod && !termDate) {
      dateControl?.setErrors({ ...(dateControl.errors || {}), required: true });
      dateControl?.markAsTouched();
    } else if (!dateControl?.hasError('invalidDate') && !dateControl?.hasError('matDatepickerParse')) {
      dateControl?.setErrors(null);
    }
  }

  private loadFilterOptions(): void {
    this.isLoading = true;

    forkJoin({
      productTypes: this.productAttributeService.getProductTypesFilter(),
      attributeGroups: this.productAttributeService.getAttributeGroupsFilter(),
      attributeCodes: this.productAttributeService.getAttributeCodesFilter()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productTypeOptions = response.productTypes || [];
          this.filteredProductTypeOptions = [...this.productTypeOptions];

          this.attributeGroupOptions = response.attributeGroups || [];
          this.filteredAttributeGroupOptions = [...this.attributeGroupOptions];

          this.attributeCodeOptions = response.attributeCodes || [];
          this.filteredAttributeCodeOptions = [...this.attributeCodeOptions];

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading filter options:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private setupSearchControls(): void {
    // Product Type search
    this.productTypeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        this.filteredProductTypeOptions = this.filterProductTypes(search);
        this.cdr.markForCheck();
      });

    // Attribute Group search
    this.attributeGroupSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        this.filteredAttributeGroupOptions = this.filterAttributeGroups(search);
        this.cdr.markForCheck();
      });

    // Attribute Code search
    this.attributeCodeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        this.filteredAttributeCodeOptions = this.filterAttributeCodes(search);
        this.cdr.markForCheck();
      });
  }

  private filterProductTypes(search: string | null): ProductTypeDropdown[] {
    if (!search || search.length < 1) {
      return [...this.productTypeOptions];
    }
    const lowerSearch = search.toLowerCase();
    return this.productTypeOptions.filter(
      (option) =>
        (option.productType ?? '').toLowerCase().includes(lowerSearch) ||
        (option.productTypeDesc ?? '').toLowerCase().includes(lowerSearch)
    );
  }

  private filterAttributeGroups(search: string | null): AttributeGroupDropdown[] {
    if (!search || search.length < 1) {
      return [...this.attributeGroupOptions];
    }
    const lowerSearch = search.toLowerCase();
    return this.attributeGroupOptions.filter(
      (option) =>
        (option.code ?? '').toLowerCase().includes(lowerSearch) ||
        (option.codeDesc ?? '').toLowerCase().includes(lowerSearch)
    );
  }

  private filterAttributeCodes(search: string | null): AttributeCodeDropdown[] {
    if (!search || search.length < 1) {
      return [...this.attributeCodeOptions];
    }
    const lowerSearch = search.toLowerCase();
    return this.attributeCodeOptions.filter(
      (option) =>
        (option.attribCode ?? '').toLowerCase().includes(lowerSearch) ||
        (option.attribDesc ?? '').toLowerCase().includes(lowerSearch)
    );
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm.invalid) return true;

    const formValue = this.filterForm.value;
    const hasAnyFilter = !!(
      formValue.productType ||
      formValue.attribGroup ||
      formValue.attribCode ||
      formValue.effDate ||
      formValue.termDate
    );

    if (!hasAnyFilter) return true;

    const current = this.filterForm.value;
    const initial = this.initialFilterValues;
    const isUnchanged =
      (current.productType ?? null) === (initial?.productType ?? null) &&
      (current.attribGroup ?? null) === (initial?.attribGroup ?? null) &&
      (current.attribCode ?? null) === (initial?.attribCode ?? null) &&
      (current.effDatePeriod ?? null) === (initial?.effDatePeriod ?? null) &&
      (current.termDatePeriod ?? null) === (initial?.termDatePeriod ?? null) &&
      this.toDateString(current.effDate) === this.toDateString(initial?.effDate) &&
      this.toDateString(current.termDate) === this.toDateString(initial?.termDate);
    return isUnchanged;
  }

  onApply(): void {
    this.validateEffDatePeriod();
    this.validateTermDatePeriod();
    if (this.filterForm.invalid) return;

    const { productType, attribGroup, attribCode, effDatePeriod, effDate, termDatePeriod, termDate } = this.filterForm.value;
    const filters: ProductAttributeFilterValue = {};
    if (productType) filters.productType = productType;
    if (attribGroup) filters.attribGroup = attribGroup;
    if (attribCode) filters.attribCode = attribCode;
    if (effDatePeriod) filters.effDatePeriod = effDatePeriod;
    if (effDate) filters.effDate = effDate;
    if (termDatePeriod) filters.termDatePeriod = termDatePeriod;
    if (termDate) filters.termDate = termDate;
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      productType: null,
      attribGroup: null,
      attribCode: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });

    this.productTypeSearchControl.setValue('', { emitEvent: false });
    this.filteredProductTypeOptions = [...this.productTypeOptions];
    this.attributeGroupSearchControl.setValue('', { emitEvent: false });
    this.filteredAttributeGroupOptions = [...this.attributeGroupOptions];
    this.attributeCodeSearchControl.setValue('', { emitEvent: false });
    this.filteredAttributeCodeOptions = [...this.attributeCodeOptions];
    this.effDateRawInput = '';
    this.termDateRawInput = '';

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  getProductTypeDisplay(option: ProductTypeDropdown): string {
    return `${option.productType} - ${option.productTypeDesc}`;
  }

  getAttributeGroupDisplay(option: AttributeGroupDropdown): string {
    return `${option.code} - ${option.codeDesc}`;
  }

  getAttributeCodeDisplay(option: AttributeCodeDropdown): string {
    return `${option.attribCode} - ${option.attribDesc}`;
  }

  // --- Date input handlers (following Drive Location pattern) ---

  onEffDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effDateRawInput = input.value.trim();
    const control = this.filterForm.get('effDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    setTimeout(() => {
      if (this.effDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onEffDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();
      if (controlValue && typeof controlValue === 'object' && controlValue.isValid?.()) {
        const formatted = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formatted;
        this.effDateRawInput = formatted;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.effDateRawInput;
        if (!control.hasError('invalidDate')) control.setErrors({ invalidDate: true });
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  onTermDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.termDateRawInput = input.value.trim();
    const control = this.filterForm.get('termDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    setTimeout(() => {
      if (this.termDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onTermDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();
      if (controlValue && typeof controlValue === 'object' && controlValue.isValid?.()) {
        const formatted = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formatted;
        this.termDateRawInput = formatted;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.termDateRawInput;
        if (!control.hasError('invalidDate')) control.setErrors({ invalidDate: true });
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  getEffDateError(): string {
    const control = this.filterForm.get('effDate');
    if (control?.hasError('invalidDate') || control?.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control?.hasError('required') && control?.touched) return 'Effective Date is required';
    return '';
  }

  getTermDateError(): string {
    const control = this.filterForm.get('termDate');
    if (control?.hasError('invalidDate') || control?.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (control?.hasError('required') && control?.touched) return 'Termination Date is required';
    return '';
  }

  getEffDatePeriodError(): string {
    const control = this.filterForm.get('effDatePeriod');
    return (control?.hasError('required') && control?.touched) ? 'Period is required' : '';
  }

  getTermDatePeriodError(): string {
    const control = this.filterForm.get('termDatePeriod');
    return (control?.hasError('required') && control?.touched) ? 'Period is required' : '';
  }

  private toDateString(val: import('moment').Moment | string | null | undefined): string | null {
    if (!val) return null;
    if (moment.isMoment(val)) return val.format('YYYY-MM-DD');
    return val;
  }
}
