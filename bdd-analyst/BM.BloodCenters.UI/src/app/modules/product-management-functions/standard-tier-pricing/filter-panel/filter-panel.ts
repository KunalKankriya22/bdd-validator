import {
  Component,
  inject,
  signal,
  output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { A11yModule } from '@angular/cdk/a11y';
import { MatInputModule } from '@angular/material/input';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';
import moment from 'moment';

import { StandardTierPricingFilter } from '../models/standard-tier-pricing.model';

@Component({
  selector: 'app-enter-standard-tier-pricing-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatMomentDateModule,
    A11yModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './filter-panel.html',
  styleUrls: ['./filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterStandardTierPricingFilterPanel implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentFilters = signal<StandardTierPricingFilter>({});
  apply = output<StandardTierPricingFilter>();
  cancel = output<void>();

  filterForm!: FormGroup;

  unitPriceComparisonRequired = false;
  unitPriceRequired = false;
  effectivePeriodRequired = false;
  terminationPeriodRequired = false;

  unitPriceComparisonErrorMatcher: ErrorStateMatcher = {
    isErrorState: (): boolean => this.unitPriceComparisonRequired
  };

  unitPriceValueErrorMatcher: ErrorStateMatcher = {
    isErrorState: (): boolean => this.unitPriceRequired
  };

  effPeriodErrorMatcher: ErrorStateMatcher = {
    isErrorState: (): boolean => this.effectivePeriodRequired
  };

  termPeriodErrorMatcher: ErrorStateMatcher = {
    isErrorState: (): boolean => this.terminationPeriodRequired
  };

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor() {
    this.filterForm = this.fb.group({
      unitPriceComparison: [null],
      unitPrice: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null, [dateFormatValidator()]],
      terminationDatePeriod: [null],
      terminationDate: [null, [dateFormatValidator()]]
    });
  }

  ngOnInit(): void {
    const f = this.currentFilters();
    this.filterForm.patchValue({
      unitPriceComparison: f.unitPriceComparison || null,
      unitPrice: f.unitPrice || null,
      effectiveDatePeriod: f.effectiveDatePeriod || null,
      effectiveDate: f.effectiveDate ? moment(f.effectiveDate) : null,
      terminationDatePeriod: f.terminationDatePeriod || null,
      terminationDate: f.terminationDate ? moment(f.terminationDate) : null
    }, { emitEvent: false });

    this.filterForm.get('unitPriceComparison')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateUnitPrice();
        this.cdr.markForCheck();
      });

    this.filterForm.get('unitPrice')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateUnitPrice();
        this.cdr.markForCheck();
      });

    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) control.markAsTouched();
        setTimeout(() => {
          this.validateEffectivePeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) control.markAsTouched();
        setTimeout(() => {
          this.validateTerminationPeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      });
  }

  validateUnitPrice(): void {
    const comparison = this.filterForm.get('unitPriceComparison')?.value;
    const price = this.filterForm.get('unitPrice')?.value;
    this.unitPriceComparisonRequired = !!price && !comparison;
    this.unitPriceRequired = !!comparison && !price;
  }

  validateEffectivePeriod(): void {
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('effectiveDatePeriod')?.value;
    this.effectivePeriodRequired = !!date && !period;
  }

  validateTerminationPeriod(): void {
    const date = this.filterForm.get('terminationDate')?.value;
    const period = this.filterForm.get('terminationDatePeriod')?.value;
    this.terminationPeriodRequired = !!date && !period;
  }

  get isApplyDisabled(): boolean {
    if (this.unitPriceComparisonRequired || this.unitPriceRequired ||
        this.effectivePeriodRequired || this.terminationPeriodRequired) {
      return true;
    }

    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    if (effDateControl?.hasError('invalidDateFormat') ||
        effDateControl?.hasError('matDatepickerParse') ||
        termDateControl?.hasError('invalidDateFormat') ||
        termDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    const values = this.filterForm.value;
    const hasUnitPrice = values?.unitPriceComparison && values?.unitPrice;
    const hasEffDate = values?.effectiveDatePeriod && values?.effectiveDate;
    const hasTermDate = values?.terminationDatePeriod && values?.terminationDate;
    return !(hasUnitPrice || hasEffDate || hasTermDate);
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  onApply(): void {
    const v = this.filterForm.value;
    const filters: StandardTierPricingFilter = {};

    if (v.unitPriceComparison && v.unitPrice) {
      filters.unitPriceComparison = v.unitPriceComparison;
      filters.unitPrice = Number(v.unitPrice);
    }
    if (v.effectiveDate && v.effectiveDatePeriod) {
      filters.effectiveDatePeriod = v.effectiveDatePeriod;
      filters.effectiveDate = (v.effectiveDate as Moment).format('YYYY-MM-DD');
    }
    if (v.terminationDate && v.terminationDatePeriod) {
      filters.terminationDatePeriod = v.terminationDatePeriod;
      filters.terminationDate = (v.terminationDate as Moment).format('YYYY-MM-DD');
    }

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      unitPriceComparison: null,
      unitPrice: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.unitPriceComparisonRequired = false;
    this.unitPriceRequired = false;
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
