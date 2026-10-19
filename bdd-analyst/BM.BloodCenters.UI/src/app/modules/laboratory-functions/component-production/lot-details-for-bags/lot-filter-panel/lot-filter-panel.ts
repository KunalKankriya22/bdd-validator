import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { ValidLotFilterValue, CatalogDropdownDto } from '../models/lot-details-for-bags.model';

@Component({
  selector: 'app-lot-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './lot-filter-panel.html',
  styleUrls: ['./lot-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotFilterPanel implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: ValidLotFilterValue | null = null;
  @Input() catalogs: CatalogDropdownDto[] = [];
  @Output() apply = new EventEmitter<ValidLotFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  showExpiredOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ];

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
      showExpired: [this.currentFilters?.showExpired ?? null],
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [this.currentFilters?.effDate ? new Date(this.currentFilters.effDate) : null, [dateFormatValidator()]],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [this.currentFilters?.termDate ? new Date(this.currentFilters.termDate) : null, [dateFormatValidator()]],
    });

    this.filterForm.get('effDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const control = this.filterForm.get('effDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('termDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const control = this.filterForm.get('termDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('effDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateEffectivePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('termDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateTerminationPeriod();
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
    const hasShowExpired = values?.showExpired !== null && values?.showExpired !== undefined;
    const hasEffDate = values?.effDatePeriod && values?.effDate;
    const hasTermDate = values?.termDatePeriod && values?.termDate;

    return !(hasShowExpired || hasEffDate || hasTermDate);
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
    const formValue = this.filterForm.value;

    const filters: ValidLotFilterValue = {
      showExpired: formValue.showExpired !== null && formValue.showExpired !== undefined ? formValue.showExpired : undefined,
      effDatePeriod: formValue.effDatePeriod || undefined,
      effDate: formValue.effDate ? this.convertToUTCDate(formValue.effDate)?.toISOString() || undefined : undefined,
      termDatePeriod: formValue.termDatePeriod || undefined,
      termDate: formValue.termDate ? this.convertToUTCDate(formValue.termDate)?.toISOString() || undefined : undefined,
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      showExpired: null,
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
