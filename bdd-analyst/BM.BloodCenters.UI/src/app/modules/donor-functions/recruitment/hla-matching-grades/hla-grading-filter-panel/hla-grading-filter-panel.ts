import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';
import moment from 'moment';

import { HlaGradingFilterValue } from '../models/hla-grading.model';

@Component({
  selector: 'app-hla-grading-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatIconModule,
    MatMomentDateModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './hla-grading-filter-panel.html',
  styleUrls: ['./hla-grading-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HlaGradingFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: HlaGradingFilterValue | null = null;
  @Output() apply = new EventEmitter<HlaGradingFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Moment>
  ) {
    this.filterForm = this.fb.group({
      effectivePeriod: [''],
      effectiveDate: [null, [dateFormatValidator()]],
      terminationPeriod: [''],
      terminationDate: [null, [dateFormatValidator()]]
    });
  }

  ngOnInit(): void {
    this.populateFilters();
    this.setupPeriodValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPeriodValidation(): void {
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) control.markAsTouched();
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) control.markAsTouched();
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('effectivePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectivePeriod = this.filterForm.get('effectivePeriod')?.value;
    this.effectiveDatePeriodError = effectiveDate && (!effectivePeriod || effectivePeriod === '')
      ? 'Period is required' : '';
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationPeriod = this.filterForm.get('terminationPeriod')?.value;
    this.terminationDatePeriodError = terminationDate && (!terminationPeriod || terminationPeriod === '')
      ? 'Period is required' : '';
  }

  private populateFilters(): void {
    if (this.currentFilters) {
      this.filterForm.patchValue({
        effectivePeriod: this.currentFilters.effectivePeriod || '',
        effectiveDate: this.currentFilters.effectiveDate ? moment(this.currentFilters.effectiveDate) : null,
        terminationPeriod: this.currentFilters.terminationPeriod || '',
        terminationDate: this.currentFilters.terminationDate ? moment(this.currentFilters.terminationDate) : null
      });
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  private parseInputDate(inputValue: string): Moment | null {
    const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
      ? DD_MON_YYYY_FORMATS.parse.dateInput
      : [DD_MON_YYYY_FORMATS.parse.dateInput];
    return this.dateAdapter.parse(inputValue, formats);
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    const control = this.filterForm.get('effectiveDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) control?.setErrors({ ...control.errors, invalidDate: true });
    }
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      const inputValue = input.value?.trim() || '';
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
      if (inputValue && !control?.value) {
        const parsed = this.parseInputDate(inputValue);
        if (parsed?.isValid()) {
          control?.setValue(parsed);
          input.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
        } else if (control) {
          control.setErrors({ ...control.errors, invalidDate: true });
          control.markAsTouched();
        }
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        const errors = { ...control.errors };
        delete errors['invalidDate'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      this.cdr.markForCheck();
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    const control = this.filterForm.get('terminationDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) control?.setErrors({ ...control.errors, invalidDate: true });
    }
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      const inputValue = input.value?.trim() || '';
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
      if (inputValue && !control?.value) {
        const parsed = this.parseInputDate(inputValue);
        if (parsed?.isValid()) {
          control?.setValue(parsed);
          input.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
        } else if (control) {
          control.setErrors({ ...control.errors, invalidDate: true });
          control.markAsTouched();
        }
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        const errors = { ...control.errors };
        delete errors['invalidDate'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      this.cdr.markForCheck();
    }, 0);
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();
    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) return;

    const formValue = this.filterForm.value;
    const filters: HlaGradingFilterValue = {
      effectivePeriod: formValue.effectivePeriod || undefined,
      effectiveDate: formValue.effectiveDate
        ? (formValue.effectiveDate as Moment).format('YYYY-MM-DD') : undefined,
      terminationPeriod: formValue.terminationPeriod || undefined,
      terminationDate: formValue.terminationDate
        ? (formValue.terminationDate as Moment).format('YYYY-MM-DD') : undefined
    };
    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset({
      effectivePeriod: '',
      effectiveDate: null,
      terminationPeriod: '',
      terminationDate: null
    });
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.filterForm.get('effectivePeriod')?.setErrors(null);
    this.filterForm.get('terminationPeriod')?.setErrors(null);
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) return true;

    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');

    if (effectiveDateControl?.hasError('invalidDate') ||
        effectiveDateControl?.hasError('invalidDateFormat') ||
        effectiveDateControl?.hasError('matDatepickerParse')) return true;

    if (terminationDateControl?.hasError('invalidDate') ||
        terminationDateControl?.hasError('invalidDateFormat') ||
        terminationDateControl?.hasError('matDatepickerParse')) return true;

    const formValue = this.filterForm.value;
    const hasAnyValue = formValue.effectiveDate !== null || formValue.terminationDate !== null;
    return !hasAnyValue;
  }
}
