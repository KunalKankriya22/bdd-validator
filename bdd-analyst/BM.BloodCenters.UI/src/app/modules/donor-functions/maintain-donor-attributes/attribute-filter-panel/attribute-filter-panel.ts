import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { A11yModule } from '@angular/cdk/a11y';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { AttributeFilters } from '../models/maintain-donor-attributes.models';

@Component({
  selector: 'app-attribute-filter-panel',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatIconModule, MatCheckbox, MatDatepickerModule, A11yModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './attribute-filter-panel.html',
  styleUrls: ['./attribute-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeFilterPanel implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: AttributeFilters | null = null;
  @Output() apply = new EventEmitter<AttributeFilters>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  periodOptions = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' },
  ];

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;
  effectiveDateRequired = false;
  terminationDateRequired = false;

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      showTerminated: [this.currentFilters?.showTerminated ?? false],
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [this.currentFilters?.effDate ? new Date(this.currentFilters.effDate) : null, [dateFormatValidator()]],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [this.currentFilters?.termDate ? new Date(this.currentFilters.termDate) : null, [dateFormatValidator()]],
    });

    this.filterForm.get('effDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const control = this.filterForm.get('effDate');
      if (control && !control.touched) control.markAsTouched();
      setTimeout(() => { this.validateEffectivePeriod(); this.cdr.markForCheck(); }, 0);
    });

    this.filterForm.get('termDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const control = this.filterForm.get('termDate');
      if (control && !control.touched) control.markAsTouched();
      setTimeout(() => { this.validateTerminationPeriod(); this.cdr.markForCheck(); }, 0);
    });

    this.filterForm.get('effDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateEffectivePeriod(); this.cdr.markForCheck();
    });

    this.filterForm.get('termDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateTerminationPeriod(); this.cdr.markForCheck();
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

  get isApplyDisabled(): boolean {
    if (this.effectivePeriodRequired || this.terminationPeriodRequired ||
        this.effectiveDateRequired || this.terminationDateRequired) {
      return true;
    }

    const effDateControl = this.filterForm.get('effDate');
    const termDateControl = this.filterForm.get('termDate');
    if (effDateControl?.hasError('invalidDateFormat') ||
        effDateControl?.hasError('matDatepickerParse') ||
        termDateControl?.hasError('invalidDateFormat') ||
        termDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    const values = this.filterForm.value;
    const hasShowTerminated = !!values?.showTerminated;
    const hasEffDate = values?.effDatePeriod && values?.effDate;
    const hasTermDate = values?.termDatePeriod && values?.termDate;

    return !(hasShowTerminated || hasEffDate || hasTermDate);
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
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
  }

  onApply(): void {
    const v = this.filterForm.value;
    const filters: AttributeFilters = {
      showTerminated: v.showTerminated || false,
      effDatePeriod: v.effDatePeriod || undefined,
      effDate: v.effDate ? this.convertToUTCDate(v.effDate)?.toISOString() || undefined : undefined,
      termDatePeriod: v.termDatePeriod || undefined,
      termDate: v.termDate ? this.convertToUTCDate(v.termDate)?.toISOString() || undefined : undefined,
    };
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      showTerminated: false,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRequired = false;
    this.terminationDateRequired = false;
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
