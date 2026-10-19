import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import moment from 'moment';
import {
  CustomerPreferredTierFilterValue,
  ProductTypeDropdownDto
} from '../models/customer-preferred-tier.model';

@Component({
  selector: 'app-customer-preferred-tier-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './customer-preferred-tier-filter-panel.html',
  styleUrls: ['./customer-preferred-tier-filter-panel.scss']
})
export class CustomerPreferredTierFilterPanelComponent implements OnInit, OnDestroy {
  @Input() appliedFilters: CustomerPreferredTierFilterValue | null = null;
  @Input() productTypeOptions: ProductTypeDropdownDto[] = [];
  @Output() applyFilters = new EventEmitter<CustomerPreferredTierFilterValue | null>();
  @Output() closePanel = new EventEmitter<void>();

  filterForm: FormGroup;
  productTypeSearchCtrl = new FormControl('');
  productTypeOptionsSignal = signal<ProductTypeDropdownDto[]>([]);
  private productTypeSearchSignal = toSignal(this.productTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  filteredProductTypeOptions = computed(() => {
    const searchTerm = this.productTypeSearchSignal()?.toLowerCase() || '';
    const options = this.productTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(o =>
      (o.productType || '').toLowerCase().includes(searchTerm) ||
      (o.productTypeDesc || '').toLowerCase().includes(searchTerm)
    );
  });

  periodOptions: string[] = ['After', 'Before'];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      productType: [null],
      effDatePeriod: [null],
      effDateFilter: [null],
      termDatePeriod: [null],
      termDateFilter: [null]
    }, {
      validators: [
        this.dateAndPeriodValidator('effDateFilter', 'effDatePeriod'),
        this.dateAndPeriodValidator('termDateFilter', 'termDatePeriod')
      ]
    });
  }

  ngOnInit(): void {
    this.productTypeOptionsSignal.set(this.productTypeOptions);
    this.populateFormFromAppliedFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private dateAndPeriodValidator(dateField: string, periodField: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const date = group.get(dateField)?.value;
      const period = group.get(periodField)?.value;
      if (date && !period) {
        return { [`${periodField}Required`]: true };
      }
      if (period && !date) {
        return { [`${dateField}Required`]: true };
      }
      return null;
    };
  }

  private populateFormFromAppliedFilters(): void {
    if (this.appliedFilters) {
      this.filterForm.patchValue({
        productType: this.appliedFilters.productType,
        effDatePeriod: this.appliedFilters.effDatePeriod || null,
        effDateFilter: this.appliedFilters.effDateFilter ? moment(this.appliedFilters.effDateFilter) : null,
        termDatePeriod: this.appliedFilters.termDatePeriod || null,
        termDateFilter: this.appliedFilters.termDateFilter ? moment(this.appliedFilters.termDateFilter) : null
      });
    }
  }

  getProductTypeLabel(pt: ProductTypeDropdownDto): string {
    return `${pt.productType} - ${pt.productTypeDesc}`;
  }

  private toISODate(value: any): string | null {
    if (!value) return null;
    const m = moment.isMoment(value) ? value : moment(value);
    return m.isValid() ? m.format('YYYY-MM-DD') + 'T12:00:00.000Z' : null;
  }

  hasFiltersSelected(): boolean {
    const fv = this.filterForm.value;
    const hasSelection = !!(
      fv.productType ||
      (fv.effDateFilter && fv.effDatePeriod) ||
      (fv.termDateFilter && fv.termDatePeriod)
    );
    return hasSelection && this.filterForm.valid;
  }

  onApply(): void {
    const fv = this.filterForm.value;

    if (!this.hasFiltersSelected()) {
      this.applyFilters.emit(null);
      return;
    }

    this.applyFilters.emit({
      productType: fv.productType || null,
      effDatePeriod: fv.effDateFilter ? (fv.effDatePeriod || null) : null,
      effDateFilter: this.toISODate(fv.effDateFilter),
      termDatePeriod: fv.termDateFilter ? (fv.termDatePeriod || null) : null,
      termDateFilter: this.toISODate(fv.termDateFilter)
    });
  }

  onClear(): void {
    this.filterForm.reset({
      productType: null,
      effDatePeriod: null,
      effDateFilter: null,
      termDatePeriod: null,
      termDateFilter: null
    });
    this.applyFilters.emit(null);
  }

  onClose(): void {
    this.closePanel.emit();
  }

  hasEffDateError(): boolean {
    const date = this.filterForm.get('effDateFilter')?.value;
    const period = this.filterForm.get('effDatePeriod')?.value;
    if (date && !period) return true;
    if (period && !date) return true;
    return false;
  }

  getEffDateError(): string {
    const date = this.filterForm.get('effDateFilter')?.value;
    const period = this.filterForm.get('effDatePeriod')?.value;
    if (date && !period) return 'Period is required';
    if (period && !date) return 'Effective Date is required';
    return '';
  }

  hasTermDateError(): boolean {
    const date = this.filterForm.get('termDateFilter')?.value;
    const period = this.filterForm.get('termDatePeriod')?.value;
    if (date && !period) return true;
    if (period && !date) return true;
    return false;
  }

  getTermDateError(): string {
    const date = this.filterForm.get('termDateFilter')?.value;
    const period = this.filterForm.get('termDatePeriod')?.value;
    if (date && !period) return 'Period is required';
    if (period && !date) return 'Termination Date is required';
    return '';
  }
}
