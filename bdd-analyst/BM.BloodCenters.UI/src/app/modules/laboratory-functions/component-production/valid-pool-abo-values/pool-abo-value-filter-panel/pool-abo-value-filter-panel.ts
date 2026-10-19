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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PoolAboValueFilterValue } from '../models/pool-abo-values.model';

@Component({
  selector: 'app-pool-abo-value-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './pool-abo-value-filter-panel.html',
  styleUrls: ['./pool-abo-value-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PoolAboValueFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: PoolAboValueFilterValue | null = null;
  @Output() apply = new EventEmitter<PoolAboValueFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Validation flags for period/date combinations
  effPeriodRequired = false;
  termPeriodRequired = false;

  // Store raw input text to preserve invalid dates
  private effDateRawInput = '';
  private termDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      opos: [this.currentFilters?.opos ?? null],
      oneg: [this.currentFilters?.oneg ?? null],
      apos: [this.currentFilters?.apos ?? null],
      aneg: [this.currentFilters?.aneg ?? null],
      bpos: [this.currentFilters?.bpos ?? null],
      bneg: [this.currentFilters?.bneg ?? null],
      abpos: [this.currentFilters?.abpos ?? null],
      abneg: [this.currentFilters?.abneg ?? null],
      effDatePeriod: [this.currentFilters?.effDatePeriod ?? null],
      effDate: [this.currentFilters?.effDate ? new Date(this.currentFilters.effDate) : null, [dateFormatValidator()]],
      termDatePeriod: [this.currentFilters?.termDatePeriod ?? null],
      termDate: [this.currentFilters?.termDate ? new Date(this.currentFilters.termDate) : null, [dateFormatValidator()]]
    });

    this.setupDateValidation();
  }


  private setupDateValidation(): void {
    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => {
          this.validateEffPeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('termDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => {
          this.validateTermPeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('effDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffPeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('termDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTermPeriod();
        this.cdr.markForCheck();
      });
  }

  validateEffPeriod(): void {
    this.effPeriodRequired = this.isPeriodRequired('effDate', 'effDatePeriod');
  }

  validateTermPeriod(): void {
    this.termPeriodRequired = this.isPeriodRequired('termDate', 'termDatePeriod');
  }

  private isPeriodRequired(dateControl: string, periodControl: string): boolean {
    const date = this.filterForm.get(dateControl)?.value;
    const period = this.filterForm.get(periodControl)?.value;
    return !!date && !period;
  }

  get isApplyDisabled(): boolean {
    if (this.effPeriodRequired || this.termPeriodRequired) {
      return true;
    }

    if (this.hasDateErrors('effDate') || this.hasDateErrors('termDate')) {
      return true;
    }

    const formValue = this.filterForm.value;

    // Check for period without date - should disable APPLY
    const hasEffPeriodWithoutDate = formValue.effDatePeriod && !formValue.effDate;
    const hasTermPeriodWithoutDate = formValue.termDatePeriod && !formValue.termDate;

    if (hasEffPeriodWithoutDate || hasTermPeriodWithoutDate) {
      return true;
    }

    // Check if at least one filter field has a complete value
    const hasAnyFilter =
      formValue.opos !== null && formValue.opos !== undefined ||
      formValue.oneg !== null && formValue.oneg !== undefined ||
      formValue.apos !== null && formValue.apos !== undefined ||
      formValue.aneg !== null && formValue.aneg !== undefined ||
      formValue.bpos !== null && formValue.bpos !== undefined ||
      formValue.bneg !== null && formValue.bneg !== undefined ||
      formValue.abpos !== null && formValue.abpos !== undefined ||
      formValue.abneg !== null && formValue.abneg !== undefined ||
      (formValue.effDate !== null && formValue.effDate !== undefined && formValue.effDatePeriod) ||
      (formValue.termDate !== null && formValue.termDate !== undefined && formValue.termDatePeriod);

    return !hasAnyFilter;
  }

  private hasDateErrors(controlName: string): boolean {
    const control = this.filterForm.get(controlName);
    return control?.hasError('invalidDateFormat') ||
           control?.hasError('matDatepickerParse') ||
           control?.hasError('invalidDate') ||
           false;
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: PoolAboValueFilterValue = {};

    if (formValue.opos !== null && formValue.opos !== undefined) {
      filters.opos = formValue.opos;
    }
    if (formValue.oneg !== null && formValue.oneg !== undefined) {
      filters.oneg = formValue.oneg;
    }
    if (formValue.apos !== null && formValue.apos !== undefined) {
      filters.apos = formValue.apos;
    }
    if (formValue.aneg !== null && formValue.aneg !== undefined) {
      filters.aneg = formValue.aneg;
    }
    if (formValue.bpos !== null && formValue.bpos !== undefined) {
      filters.bpos = formValue.bpos;
    }
    if (formValue.bneg !== null && formValue.bneg !== undefined) {
      filters.bneg = formValue.bneg;
    }
    if (formValue.abpos !== null && formValue.abpos !== undefined) {
      filters.abpos = formValue.abpos;
    }
    if (formValue.abneg !== null && formValue.abneg !== undefined) {
      filters.abneg = formValue.abneg;
    }
    if (formValue.effDate) {
      filters.effDatePeriod = formValue.effDatePeriod;
      filters.effDate = this.convertToUTCDate(formValue.effDate)?.toISOString() || undefined;
    }
    if (formValue.termDate) {
      filters.termDatePeriod = formValue.termDatePeriod;
      filters.termDate = this.convertToUTCDate(formValue.termDate)?.toISOString() || undefined;
    }

    this.apply.emit(filters);
  }

  /**
   * Convert Moment date to UTC Date at midnight
   * This ensures the selected date is preserved regardless of timezone
   */
  private convertToUTCDate(date: moment.Moment | Date | null): Date | null {
    if (!date) return null;

    // Handle moment.Moment objects
    if (moment.isMoment(date)) {
      return new Date(Date.UTC(
        date.year(),
        date.month(),
        date.date(),
        0, 0, 0, 0
      ));
    }

    // Handle Date objects
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    ));
  }

  onClear(): void {
    this.filterForm.reset({
      opos: null,
      oneg: null,
      apos: null,
      aneg: null,
      bpos: null,
      bneg: null,
      abpos: null,
      abneg: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });

    // Reset raw inputs and validation flags
    this.effDateRawInput = '';
    this.termDateRawInput = '';
    this.effPeriodRequired = false;
    this.termPeriodRequired = false;

    // Clear all control errors
    this.filterForm.get('effDatePeriod')?.setErrors(null);
    this.filterForm.get('termDatePeriod')?.setErrors(null);

    this.cdr.markForCheck();
  }

  onEffDateInput(event: Event): void {
    this.handleDateInput(event, 'effDate', 'effDateRawInput');
  }

  onEffDateBlur(input: HTMLInputElement): void {
    this.handleDateBlur(input, 'effDate', this.effDateRawInput);
  }

  onTermDateInput(event: Event): void {
    this.handleDateInput(event, 'termDate', 'termDateRawInput');
  }

  onTermDateBlur(input: HTMLInputElement): void {
    this.handleDateBlur(input, 'termDate', this.termDateRawInput);
  }

  private handleDateInput(event: Event, controlName: string, rawInputProp: 'effDateRawInput' | 'termDateRawInput'): void {
    const input = event.target as HTMLInputElement;
    this[rawInputProp] = input.value;
    const control = this.filterForm.get(controlName);
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ invalidDate: true });
      }
    }
  }

  private handleDateBlur(input: HTMLInputElement, controlName: string, rawInput: string): void {
    setTimeout(() => {
      const control = this.filterForm.get(controlName);
      if (!control?.value && rawInput && !input.value) {
        input.value = rawInput;
      }
    }, 0);
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
