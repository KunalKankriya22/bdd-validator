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
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import moment from 'moment';

import {
  ProductTypeFilterValue,
  ProductClassDropdown
} from '../models/product-type.model';
import { ProductTypeService } from '../services/product-type.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-product-type-filter-panel',
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
export class ProductTypeFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ProductTypeFilterValue | null = null;
  @Output() apply = new EventEmitter<ProductTypeFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  productClassOptions: ProductClassDropdown[] = [];
  productClassSearchControl = new FormControl('');
  filteredProductClassOptions: ProductClassDropdown[] = [];

  yesNoOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  periodOptions = [
    { value: 'After', display: 'After' },
    { value: 'Before', display: 'Before' }
  ];

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;
  effectiveDateRequired = false;
  terminationDateRequired = false;

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  isLoading = false;
  private initialFilterValues: ProductTypeFilterValue | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productTypeService: ProductTypeService,
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

    const parseDate = (value: string | Date | null | undefined): Date | null => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    this.filterForm = this.fb.group({
      productClass: [this.currentFilters?.productClass ?? null],
      aboOnly: [this.currentFilters?.aboOnly ?? null],
      attribFlag: [this.currentFilters?.attribFlag ?? null],
      weightRequired: [this.currentFilters?.weightRequired ?? null],
      effDatePeriod: [this.currentFilters?.effDatePeriod ?? null],
      effDate: [parseDate(this.currentFilters?.effDate), [dateFormatValidator()]],
      termDatePeriod: [this.currentFilters?.termDatePeriod ?? null],
      termDate: [parseDate(this.currentFilters?.termDate), [dateFormatValidator()]]
    });

    this.filterForm.get('effDate')?.valueChanges.subscribe(() => {
      const control = this.filterForm.get('effDate');
      if (control && !control.touched) control.markAsTouched();
      setTimeout(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('termDate')?.valueChanges.subscribe(() => {
      const control = this.filterForm.get('termDate');
      if (control && !control.touched) control.markAsTouched();
      setTimeout(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('effDatePeriod')?.valueChanges.subscribe(() => {
      this.validateEffectivePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('termDatePeriod')?.valueChanges.subscribe(() => {
      this.validateTerminationPeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  validateEffectivePeriod(): void {
    const date = this.filterForm.get('effDate')?.value;
    const period = this.filterForm.get('effDatePeriod')?.value;
    this.effectivePeriodRequired = !!date && !period;
    this.effectiveDateRequired = !!period && !date;
  }

  validateTerminationPeriod(): void {
    const date = this.filterForm.get('termDate')?.value;
    const period = this.filterForm.get('termDatePeriod')?.value;
    this.terminationPeriodRequired = !!date && !period;
    this.terminationDateRequired = !!period && !date;
  }

  private loadFilterOptions(): void {
    this.isLoading = true;

    this.productTypeService
      .getFilterOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productClassOptions = response.data?.[0]?.productClasses || [];
          this.filteredProductClassOptions = [...this.productClassOptions];
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
    this.productClassSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        this.filteredProductClassOptions = this.filterProductClasses(search);
        this.cdr.markForCheck();
      });
  }

  private filterProductClasses(search: string | null): ProductClassDropdown[] {
    if (!search || search.length < 1) return [...this.productClassOptions];
    const lowerSearch = search.toLowerCase();
    return this.productClassOptions.filter(
      (option) =>
        option.code.toLowerCase().includes(lowerSearch) ||
        (option.codeDesc?.toLowerCase() ?? '').includes(lowerSearch)
    );
  }

  get isApplyDisabled(): boolean {
    if (
      this.effectivePeriodRequired ||
      this.terminationPeriodRequired ||
      this.effectiveDateRequired ||
      this.terminationDateRequired
    ) {
      return true;
    }

    const effDateControl = this.filterForm.get('effDate');
    const termDateControl = this.filterForm.get('termDate');
    if (
      effDateControl?.hasError('invalidDateFormat') ||
      effDateControl?.hasError('matDatepickerParse') ||
      termDateControl?.hasError('invalidDateFormat') ||
      termDateControl?.hasError('matDatepickerParse')
    ) {
      return true;
    }

    const formValue = this.filterForm.value;
    const hasDropdownFilter = !!(
      formValue.productClass ||
      formValue.aboOnly ||
      formValue.attribFlag ||
      formValue.weightRequired
    );
    const hasEffDate = !!(formValue.effDatePeriod && formValue.effDate);
    const hasTermDate = !!(formValue.termDatePeriod && formValue.termDate);

    return !(hasDropdownFilter || hasEffDate || hasTermDate);
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  private convertToUTCDate(date: moment.Moment | Date | null): Date | null {
    if (!date) return null;
    if (moment.isMoment(date)) {
      return new Date(Date.UTC(date.year(), date.month(), date.date(), 0, 0, 0, 0));
    }
    return new Date(Date.UTC(
      (date as Date).getFullYear(),
      (date as Date).getMonth(),
      (date as Date).getDate(),
      0, 0, 0, 0
    ));
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: ProductTypeFilterValue = {};

    if (formValue.productClass) filters.productClass = formValue.productClass;
    if (formValue.aboOnly) filters.aboOnly = formValue.aboOnly;
    if (formValue.attribFlag) filters.attribFlag = formValue.attribFlag;
    if (formValue.weightRequired) filters.weightRequired = formValue.weightRequired;

    if (formValue.effDatePeriod && formValue.effDate) {
      filters.effDatePeriod = formValue.effDatePeriod;
      filters.effDate = this.convertToUTCDate(formValue.effDate)?.toISOString() ?? undefined;
    }

    if (formValue.termDatePeriod && formValue.termDate) {
      filters.termDatePeriod = formValue.termDatePeriod;
      filters.termDate = this.convertToUTCDate(formValue.termDate)?.toISOString() ?? undefined;
    }

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      productClass: null,
      aboOnly: null,
      attribFlag: null,
      weightRequired: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });

    this.productClassSearchControl.setValue('', { emitEvent: false });
    this.filteredProductClassOptions = [...this.productClassOptions];

    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRequired = false;
    this.terminationDateRequired = false;

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  getProductClassDisplay(option: ProductClassDropdown): string {
    const desc = option.codeDesc?.trim();
    return desc ? `${option.code} - ${desc}` : option.code;
  }
}
