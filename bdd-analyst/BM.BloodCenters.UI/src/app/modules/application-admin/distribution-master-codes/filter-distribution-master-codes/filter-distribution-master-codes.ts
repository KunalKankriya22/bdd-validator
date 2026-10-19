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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import moment from 'moment';

import { MasterCodeFilter } from '../services/distribution-master-codes.service';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

@Component({
  selector: 'app-filter-distribution-master-codes',
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
  templateUrl: './filter-distribution-master-codes.html',
  styleUrl: './filter-distribution-master-codes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterDistributionMasterCodesComponent implements OnInit, OnDestroy {
  @Input() currentFilters: MasterCodeFilter | null = null;
  @Output() apply = new EventEmitter<MasterCodeFilter>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  private formChanged = false;

  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null, [dateFormatValidator()]]
    });

    // Add immediate validation on date changes
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      // Mark field as touched when user types to show validation errors
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      // Mark field as touched when user types to show validation errors
      const control = this.filterForm.get('terminationDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    // Clear errors when period is selected
    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      this.validateEffectiveDatePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      this.validateTerminationDatePeriod();
      this.cdr.markForCheck();
    });
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

  ngOnDestroy(): void {
    // Cleanup handled automatically by component destruction
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    // Set invalidDateFormat error when input has text but control value is null (unparseable)
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  /**
   * Store raw input text when user types in termination date field
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    // Set invalidDateFormat error when input has text but control value is null (unparseable)
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  onApply(): void {
    if (this.isApplyDisabled) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: MasterCodeFilter = {
      effectiveDatePeriod: formValue.effectiveDatePeriod || undefined,
      effectiveDate: formValue.effectiveDate ? this.convertToUTCDate(formValue.effectiveDate) || undefined : undefined,
      terminationDatePeriod: formValue.terminationDatePeriod || undefined,
      terminationDate: formValue.terminationDate ? this.convertToUTCDate(formValue.terminationDate) || undefined : undefined
    };

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

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check for date format validation errors
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

    // Disable if form values haven't changed from initial state
    return !this.formChanged;
  }

  get hasValidationErrors(): boolean {
    return this.filterForm.get('effectiveDatePeriod')?.invalid ||
           this.filterForm.get('terminationDatePeriod')?.invalid ||
           false;
  }

  onClear(): void {
    this.filterForm.reset({
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
