import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { ValidInstrumentTestScheduleFilter } from '../../models/instrument-test-results.model';

@Component({
  selector: 'app-instrument-test-results-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './instrument-test-results-filter.html',
  styleUrl: './instrument-test-results-filter.scss',
})
export class InstrumentTestResultsFilterComponent implements OnInit {
  filterForm: FormGroup;
  private formChanged = false;

  effectiveDatePeriodError   = '';
  terminationDatePeriodError = '';

  private effectiveDateRawInput   = '';
  private terminationDateRawInput = '';


  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InstrumentTestResultsFilterComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ValidInstrumentTestScheduleFilter | null
  ) {
    this.filterForm = this.fb.group({
      effectiveDate:         [null, [dateFormatValidator()]],
      terminationDate:       [null, [dateFormatValidator()]],
      effectiveDatePeriod:   [null],
      terminationDatePeriod: [null],
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.filterForm.patchValue(this.data);
    }

    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      this.validateEffectiveDatePeriod();
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      this.validateTerminationDatePeriod();
    });

    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      const ctrl = this.filterForm.get('effectiveDate');
      if (ctrl && !ctrl.touched) ctrl.markAsTouched();
      this.validateEffectiveDatePeriod();
    });

    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      const ctrl = this.filterForm.get('terminationDate');
      if (ctrl && !ctrl.touched) ctrl.markAsTouched();
      this.validateTerminationDatePeriod();
    });

    if (this.data) {
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  private validateEffectiveDatePeriod(): void {
    const hasDate   = !!this.filterForm.get('effectiveDate')?.value;
    const hasPeriod = !!this.filterForm.get('effectiveDatePeriod')?.value;
    const ctrl      = this.filterForm.get('effectiveDatePeriod');
    if (hasDate && !hasPeriod) {
      ctrl?.setErrors({ required: true });
      ctrl?.markAsTouched();
      this.effectiveDatePeriodError = 'Period is required';
    } else {
      ctrl?.setErrors(null);
      this.effectiveDatePeriodError = '';
    }
  }

  private validateTerminationDatePeriod(): void {
    const hasDate   = !!this.filterForm.get('terminationDate')?.value;
    const hasPeriod = !!this.filterForm.get('terminationDatePeriod')?.value;
    const ctrl      = this.filterForm.get('terminationDatePeriod');
    if (hasDate && !hasPeriod) {
      ctrl?.setErrors({ required: true });
      ctrl?.markAsTouched();
      this.terminationDatePeriodError = 'Period is required';
    } else {
      ctrl?.setErrors(null);
      this.terminationDatePeriodError = '';
    }
  }

  get isApplyDisabled(): boolean {
    const fv = this.filterForm.value;
    const effCtrl  = this.filterForm.get('effectiveDate');
    const termCtrl = this.filterForm.get('terminationDate');

    const hasDateErrors = !!(
      effCtrl?.hasError('invalidDateFormat')  || effCtrl?.hasError('matDatepickerParse')  || effCtrl?.hasError('invalidDate') ||
      termCtrl?.hasError('invalidDateFormat') || termCtrl?.hasError('matDatepickerParse') || termCtrl?.hasError('invalidDate')
    );
    if (hasDateErrors) return true;

    const effIncomplete  = fv.effectiveDatePeriod   !== null && !fv.effectiveDate;
    const termIncomplete = fv.terminationDatePeriod  !== null && !fv.terminationDate;
    const hasAnyValue    = !!fv.effectiveDate || !!fv.terminationDate;

    if (!hasAnyValue || effIncomplete || termIncomplete || this.hasValidationErrors) return true;

    return !this.formChanged;
  }

  get hasValidationErrors(): boolean {
    return !!(
      this.filterForm.get('effectiveDatePeriod')?.invalid ||
      this.filterForm.get('terminationDatePeriod')?.invalid
    );
  }

  onApply(): void {
    if (this.isApplyDisabled) return;

    const fv = this.filterForm.value;
    const filters: ValidInstrumentTestScheduleFilter = {
      effectiveDate:         fv.effectiveDate   ? this.toLocalDate(fv.effectiveDate)   : null,
      effectiveDatePeriod:   fv.effectiveDatePeriod   as 'BEFORE' | 'AFTER' | null,
      terminationDate:       fv.terminationDate ? this.toLocalDate(fv.terminationDate) : null,
      terminationDatePeriod: fv.terminationDatePeriod as 'BEFORE' | 'AFTER' | null,
    };
    this.dialogRef.close(filters);
  }

  private toLocalDate(date: any): Date | undefined {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (typeof date === 'object' && typeof date.toDate === 'function') return date.toDate();
    return undefined;
  }

  onClear(): void {
    this.filterForm.reset({
      effectiveDate:         null,
      terminationDate:       null,
      effectiveDatePeriod:   null,
      terminationDatePeriod: null,
    });
    this.effectiveDatePeriodError   = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateRawInput      = '';
    this.terminationDateRawInput    = '';
    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    const ctrl = this.filterForm.get('effectiveDate');
    if (input.value?.trim()) {
      ctrl?.markAsTouched();
      ctrl?.markAsDirty();
      if (!ctrl?.value) ctrl?.setErrors({ invalidDate: true });
    }
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const ctrl = this.filterForm.get('effectiveDate');
      if (!ctrl?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    const ctrl = this.filterForm.get('terminationDate');
    if (input.value?.trim()) {
      ctrl?.markAsTouched();
      ctrl?.markAsDirty();
      if (!ctrl?.value) ctrl?.setErrors({ invalidDate: true });
    }
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const ctrl = this.filterForm.get('terminationDate');
      if (!ctrl?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }
}
