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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { Subject, takeUntil } from 'rxjs';

import { CrxtractFilterValue } from '../../models/confirmatory-extraction.model';

@Component({
  selector: 'app-crxtract-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FilterPanelBase
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './crxtract-filter.component.html',
  styleUrls: ['./crxtract-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrxtractFilterComponent implements OnInit, OnDestroy {
  @Input() currentFilters: CrxtractFilterValue | null = null;
  @Output() apply = new EventEmitter<CrxtractFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  periodOptions: string[] = ['After', 'Before'];

  private hasChanges = false;
  private appliedFilterSnapshot!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupForm();
    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);

    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasChanges = this.normalizeFormValue(this.filterForm.value) !== this.appliedFilterSnapshot;
      this.cdr.markForCheck();
    });

    this.filterForm.get('qcDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validatePeriod('qcDatePeriod', 'qcDate');
    });

    this.filterForm.get('receivedDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validatePeriod('receivedDatePeriod', 'receivedDate');
    });

    this.filterForm.get('qcDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validatePeriod('qcDatePeriod', 'qcDate');
    });

    this.filterForm.get('receivedDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validatePeriod('receivedDatePeriod', 'receivedDate');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupForm(): void {
    const qcDatePeriod = this.currentFilters?.qcDateFrom
      ? 'After'
      : this.currentFilters?.qcDateTo ? 'Before' : null;

    const receivedDatePeriod = this.currentFilters?.receivedDateFrom
      ? 'After'
      : this.currentFilters?.receivedDateTo ? 'Before' : null;

    const qcDate = this.currentFilters?.qcDateFrom
      ? new Date(this.currentFilters.qcDateFrom)
      : this.currentFilters?.qcDateTo ? new Date(this.currentFilters.qcDateTo) : null;

    const receivedDate = this.currentFilters?.receivedDateFrom
      ? new Date(this.currentFilters.receivedDateFrom)
      : this.currentFilters?.receivedDateTo ? new Date(this.currentFilters.receivedDateTo) : null;

    this.filterForm = this.fb.group({
      qcDatePeriod: [qcDatePeriod],
      qcDate: [qcDate],
      receivedDatePeriod: [receivedDatePeriod],
      receivedDate: [receivedDate]
    });
  }

  get isClearDisabled(): boolean {
    const v = this.filterForm?.value;
    if (!v) return true;
    return !(v.qcDatePeriod || v.qcDate || v.receivedDatePeriod || v.receivedDate);
  }

  get isApplyDisabled(): boolean {
    const v = this.filterForm?.value;
    if (!v) return true;
    const hasAnyValue = !!(v.qcDate || v.receivedDate);
    return !hasAnyValue || !this.hasChanges || this.hasPeriodErrors;
  }

  private validatePeriod(periodField: string, dateField: string): void {
    const date = this.filterForm.get(dateField)?.value;
    const period = this.filterForm.get(periodField)?.value;
    const periodControl = this.filterForm.get(periodField);

    if (date && !period) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private get hasPeriodErrors(): boolean {
    return !!(
      (this.filterForm.get('qcDate')?.value && !this.filterForm.get('qcDatePeriod')?.value) ||
      (this.filterForm.get('receivedDate')?.value && !this.filterForm.get('receivedDatePeriod')?.value)
    );
  }

  onApply(): void {
    const v = this.filterForm.value;

    if (v.qcDate && !v.qcDatePeriod) {
      this.filterForm.get('qcDatePeriod')?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }
    if (v.receivedDate && !v.receivedDatePeriod) {
      this.filterForm.get('receivedDatePeriod')?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const filters: CrxtractFilterValue = {
      qcDateFrom: v.qcDatePeriod === 'After' && v.qcDate
        ? DateFieldValidationUtility.serializeDateForApi(v.qcDate) : null,
      qcDateTo: v.qcDatePeriod === 'Before' && v.qcDate
        ? DateFieldValidationUtility.serializeDateForApi(v.qcDate) : null,
      receivedDateFrom: v.receivedDatePeriod === 'After' && v.receivedDate
        ? DateFieldValidationUtility.serializeDateForApi(v.receivedDate) : null,
      receivedDateTo: v.receivedDatePeriod === 'Before' && v.receivedDate
        ? DateFieldValidationUtility.serializeDateForApi(v.receivedDate) : null
    };

    this.apply.emit(filters);
    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  private normalizeFormValue(v: typeof this.filterForm.value): string {
    return JSON.stringify({
      qcDatePeriod: v.qcDatePeriod || null,
      qcDate: v.qcDate?.format?.('YYYY-MM-DD') ?? null,
      receivedDatePeriod: v.receivedDatePeriod || null,
      receivedDate: v.receivedDate?.format?.('YYYY-MM-DD') ?? null
    });
  }
}
