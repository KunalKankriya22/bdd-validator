import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

import { HHQuestionFilterValue } from '../../models/health-history.model';

@Component({
  selector: 'app-hh-questions-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './hh-questions-filter-panel.html',
  styleUrls: ['./hh-questions-filter-panel.scss']
})
export class HHQuestionsFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: HHQuestionFilterValue | null = null;
  @Output() apply = new EventEmitter<HHQuestionFilterValue>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  effDatePeriodRequired = false;
  termDatePeriodRequired = false;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      sex: [this.currentFilters?.sex || null],
      validateLookBackDate: [this.currentFilters?.validateLookBackDate || null],
      periodTypeForLookBack: [this.currentFilters?.periodTypeForLookBack || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate ? moment(this.currentFilters.effectiveDate) : null,
        [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [
        this.currentFilters?.terminationDate ? moment(this.currentFilters.terminationDate) : null,
        [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]
      ]
    });

    this.setupDatePeriodValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDatePeriodValidation(): void {
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffDatePeriod());

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffDatePeriod());

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTermDatePeriod());

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTermDatePeriod());
  }

  validateEffDatePeriod(): void {
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('effectiveDatePeriod')?.value;
    this.effDatePeriodRequired = !!date && !period;
  }

  validateTermDatePeriod(): void {
    const date = this.filterForm.get('terminationDate')?.value;
    const period = this.filterForm.get('terminationDatePeriod')?.value;
    this.termDatePeriodRequired = !!date && !period;
  }

  get isApplyDisabled(): boolean {
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) return true;
    if (this.getEffDateError() || this.getTermDateError()) return true;

    const fv = this.filterForm.value;
    const hasFilters = fv.sex || fv.validateLookBackDate || fv.periodTypeForLookBack || fv.effectiveDate || fv.terminationDate;
    return !hasFilters;
  }

  getEffDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }
    return '';
  }

  getTermDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }
    return '';
  }

  onEffDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('effectiveDate');
    if (!control) return;
    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  onTermDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('terminationDate');
    if (!control) return;
    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: HHQuestionFilterValue = {};

    if (formValue.sex) filters.sex = formValue.sex;
    if (formValue.validateLookBackDate) filters.validateLookBackDate = formValue.validateLookBackDate;
    if (formValue.periodTypeForLookBack) filters.periodTypeForLookBack = formValue.periodTypeForLookBack;
    if (formValue.effectiveDate) {
      filters.effectiveDatePeriod = formValue.effectiveDatePeriod;
      filters.effectiveDate = moment(formValue.effectiveDate).format('YYYY-MM-DD');
    }
    if (formValue.terminationDate) {
      filters.terminationDatePeriod = formValue.terminationDatePeriod;
      filters.terminationDate = moment(formValue.terminationDate).format('YYYY-MM-DD');
    }

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.effDatePeriodRequired = false;
    this.termDatePeriodRequired = false;
    this.clearAll.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}
