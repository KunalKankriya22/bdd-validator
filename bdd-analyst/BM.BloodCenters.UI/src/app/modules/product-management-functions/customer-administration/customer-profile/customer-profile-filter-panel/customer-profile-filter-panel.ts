import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT } from 'src/app/core/utils/date-adapter.util';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { CustomerProfileApiService } from '../services/customer-profile-api.service';
import { CustomerTypeDto } from '../models/customer-profile.model';

export interface CustomerProfileFilterValue {
  customerType?: string;
  effDateAfter?: string;
  effDateBefore?: string;
  termDateAfter?: string;
  termDateBefore?: string;
}

@Component({
  selector: 'app-customer-profile-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    FilterPanelBase,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './customer-profile-filter-panel.html',
  styleUrls: ['./customer-profile-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerProfileFilterPanelComponent implements OnInit, OnDestroy {
  @Input() currentFilters: CustomerProfileFilterValue | null = null;
  @Output() apply = new EventEmitter<CustomerProfileFilterValue>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(CustomerProfileApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  filterForm!: FormGroup;
  customerTypes = signal<CustomerTypeDto[]>([]);
  filteredCustomerTypes: CustomerTypeDto[] = [];
  customerTypeSearchCtrl = new FormControl<string>('');

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      customerType: [this.currentFilters?.customerType || null],
      effPeriod: [this.getInitialEffPeriod()],
      effDate: [this.getInitialEffDate()],
      termPeriod: [this.getInitialTermPeriod()],
      termDate: [this.getInitialTermDate()]
    });

    this.loadDropdownData();
    this.setupValidation();
    this.setupSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getInitialEffPeriod(): string | null {
    if (this.currentFilters?.effDateAfter) return 'After';
    if (this.currentFilters?.effDateBefore) return 'Before';
    return null;
  }

  private getInitialEffDate(): Date | null {
    const dateStr = this.currentFilters?.effDateAfter || this.currentFilters?.effDateBefore;
    return dateStr ? new Date(dateStr) : null;
  }

  private getInitialTermPeriod(): string | null {
    if (this.currentFilters?.termDateAfter) return 'After';
    if (this.currentFilters?.termDateBefore) return 'Before';
    return null;
  }

  private getInitialTermDate(): Date | null {
    const dateStr = this.currentFilters?.termDateAfter || this.currentFilters?.termDateBefore;
    return dateStr ? new Date(dateStr) : null;
  }

  private setupValidation(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePeriodRequired('effPeriod', 'effDate');
        this.cdr.markForCheck();
      });

    this.filterForm.get('effPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePeriodRequired('effPeriod', 'effDate');
        this.cdr.markForCheck();
      });

    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePeriodRequired('termPeriod', 'termDate');
        this.cdr.markForCheck();
      });

    this.filterForm.get('termPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePeriodRequired('termPeriod', 'termDate');
        this.cdr.markForCheck();
      });
  }

  private validatePeriodRequired(periodKey: string, dateKey: string): void {
    const dateValue = this.filterForm.get(dateKey)?.value;
    const periodValue = this.filterForm.get(periodKey)?.value;
    const periodControl = this.filterForm.get(periodKey);

    if (dateValue && !periodValue) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
  }

  get isApplyDisabled(): boolean {
    const v = this.filterForm.value;
    const hasAnyValue = !!(v.customerType || v.effDate || v.termDate);
    return !hasAnyValue || this.hasValidationErrors;
  }

  get hasValidationErrors(): boolean {
    return !!(this.filterForm.get('effPeriod')?.invalid || this.filterForm.get('termPeriod')?.invalid);
  }

  getEffPeriodError(): string {
    const dateControl = this.filterForm.get('effDate');
    const periodControl = this.filterForm.get('effPeriod');
    if (dateControl?.value && periodControl?.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  getTermPeriodError(): string {
    const dateControl = this.filterForm.get('termDate');
    const periodControl = this.filterForm.get('termPeriod');
    if (dateControl?.value && periodControl?.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  private loadDropdownData(): void {
    this.apiService.getCustomerTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.customerTypes.set(types);
          this.filteredCustomerTypes = types;
          this.cdr.markForCheck();
        },
        error: () => {}
      });
  }

  private setupSearchControls(): void {
    this.customerTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const search = (searchTerm || '').toLowerCase();
        this.filteredCustomerTypes = this.customerTypes().filter(t =>
          t.code.toLowerCase().includes(search) || t.description.toLowerCase().includes(search));
        this.cdr.markForCheck();
      });
  }

  onApply(): void {
    if (this.isApplyDisabled) return;

    const v = this.filterForm.value;
    const filters: CustomerProfileFilterValue = {};

    if (v.customerType) filters.customerType = v.customerType;

    if (v.effDate && v.effPeriod) {
      const dateStr = moment.isMoment(v.effDate) ? v.effDate.format('YYYY-MM-DD') : moment(v.effDate).format('YYYY-MM-DD');
      if (v.effPeriod === 'After') filters.effDateAfter = dateStr;
      else filters.effDateBefore = dateStr;
    }

    if (v.termDate && v.termPeriod) {
      const dateStr = moment.isMoment(v.termDate) ? v.termDate.format('YYYY-MM-DD') : moment(v.termDate).format('YYYY-MM-DD');
      if (v.termPeriod === 'After') filters.termDateAfter = dateStr;
      else filters.termDateBefore = dateStr;
    }

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      customerType: null,
      effPeriod: null,
      effDate: null,
      termPeriod: null,
      termDate: null
    });
    this.apply.emit({});
  }

  onClose(): void {
    this.close.emit();
  }
}
