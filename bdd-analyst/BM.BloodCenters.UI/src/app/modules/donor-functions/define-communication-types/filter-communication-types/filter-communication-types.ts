import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { CommTypeFilter } from '../services/communication-types.service';

@Component({
  selector: 'app-filter-communication-types',
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
  templateUrl: './filter-communication-types.html',
  styleUrl: './filter-communication-types.scss',
})
export class FilterCommunicationTypesComponent implements OnInit {
  filterForm: FormGroup;
  private formChanged = false;

  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FilterCommunicationTypesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CommTypeFilter | null = null
  ) {
    this.filterForm = this.fb.group({
      searchKeyword: [''],
      effectiveDate: [null, [dateFormatValidator()]],
      terminationDate: [null, [dateFormatValidator()]],
      effectiveDatePeriod: [null],
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
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      this.validateEffectiveDatePeriod();
    });

    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      const control = this.filterForm.get('terminationDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      this.validateTerminationDatePeriod();
    });

    if (this.data) {
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const control = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate && !effectiveDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
      this.effectiveDatePeriodError = 'Period is required';
    } else {
      control?.setErrors(null);
      this.effectiveDatePeriodError = '';
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const control = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && !terminationDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
      this.terminationDatePeriodError = 'Period is required';
    } else {
      control?.setErrors(null);
      this.terminationDatePeriodError = '';
    }
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const hasDateFormatErrors = !!(
      effDateControl?.hasError('invalidDateFormat') ||
      effDateControl?.hasError('matDatepickerParse') ||
      effDateControl?.hasError('invalidDate') ||
      termDateControl?.hasError('invalidDateFormat') ||
      termDateControl?.hasError('matDatepickerParse') ||
      termDateControl?.hasError('invalidDate')
    );

    if (hasDateFormatErrors) {
      return true;
    }

    const effectiveDateIncomplete = formValue.effectiveDatePeriod !== null && !formValue.effectiveDate;
    const terminationDateIncomplete = formValue.terminationDatePeriod !== null && !formValue.terminationDate;

    const hasEffectiveDate = formValue.effectiveDate !== null;
    const hasTerminationDate = formValue.terminationDate !== null;
    const hasAnyCompleteValue = hasEffectiveDate || hasTerminationDate;

    if (!hasAnyCompleteValue || effectiveDateIncomplete || terminationDateIncomplete || this.hasValidationErrors) {
      return true;
    }

    return !this.formChanged;
  }

  get hasValidationErrors(): boolean {
    return (
      this.filterForm.get('effectiveDatePeriod')?.invalid ||
      this.filterForm.get('terminationDatePeriod')?.invalid ||
      false
    );
  }

  onApply(): void {
    if (this.isApplyDisabled) {
      return;
    }

    const effectiveDateValue = this.filterForm.get('effectiveDate')?.value;
    const terminationDateValue = this.filterForm.get('terminationDate')?.value;

    const filters: CommTypeFilter = {
      searchKeyword: this.filterForm.get('searchKeyword')?.value,
      effectiveDate: effectiveDateValue ? this.toLocalDate(effectiveDateValue) : undefined,
      terminationDate: terminationDateValue ? this.toLocalDate(terminationDateValue) : undefined,
      effectiveDatePeriod: this.filterForm.get('effectiveDatePeriod')?.value as 'BEFORE' | 'AFTER',
      terminationDatePeriod: this.filterForm.get('terminationDatePeriod')?.value as 'BEFORE' | 'AFTER',
    };
    this.dialogRef.close(filters);
  }

  private toLocalDate(date: any): Date | undefined {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (typeof date === 'object' && typeof date.toDate === 'function') {
      return date.toDate();
    }
    return undefined;
  }

  onClear(): void {
    this.filterForm.reset({
      searchKeyword: '',
      effectiveDate: null,
      terminationDate: null,
      effectiveDatePeriod: null,
      terminationDatePeriod: null,
    });
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    const control = this.filterForm.get('effectiveDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ invalidDate: true });
      }
    }
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
    const control = this.filterForm.get('terminationDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ invalidDate: true });
      }
    }
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }
}
