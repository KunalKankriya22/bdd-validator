import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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

import { ReagentFilterValue } from '../models/commit-reagents-for-component.model';

@Component({
  selector: 'app-reagent-filter-panel',
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
  templateUrl: './reagent-filter-panel.html',
  styleUrls: ['./reagent-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReagentFilterPanel implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: ReagentFilterValue | null = null;
  @Output() apply = new EventEmitter<ReagentFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  periodOptions = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' },
    { value: 'on', display: 'On' },
  ];

  periodRequired = false;
  dateRequired = false;
  private dateRawInput = '';

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      period: [this.currentFilters?.period || null],
      expirationDate: [
        this.currentFilters?.expirationDate
          ? new Date(this.currentFilters.expirationDate)
          : null,
        [dateFormatValidator()],
      ],
    });

    this.filterForm.get('expirationDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const control = this.filterForm.get('expirationDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validatePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('period')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validatePeriod();
      this.cdr.markForCheck();
    });
  }

  validatePeriod(): void {
    const date = this.filterForm.get('expirationDate')?.value;
    const period = this.filterForm.get('period')?.value;
    this.periodRequired = !!date && !period;
    this.dateRequired = !!period && !date;
  }

  get isApplyDisabled(): boolean {
    if (this.periodRequired || this.dateRequired) {
      return true;
    }

    const dateControl = this.filterForm.get('expirationDate');
    if (
      dateControl?.hasError('invalidDateFormat') ||
      dateControl?.hasError('matDatepickerParse')
    ) {
      return true;
    }

    const values = this.filterForm.value;
    return !(values?.period && values?.expirationDate);
  }

  onDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('expirationDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('expirationDate');
      if (!control?.value && this.dateRawInput && !input.value) {
        input.value = this.dateRawInput;
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
    const filters: ReagentFilterValue = {
      period: formValue.period || '',
      expirationDate: formValue.expirationDate
        ? this.convertToUTCDate(formValue.expirationDate)?.toISOString() || null
        : null,
    };
    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset({
      period: null,
      expirationDate: null,
    });
    this.dateRawInput = '';
    this.periodRequired = false;
    this.dateRequired = false;
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
