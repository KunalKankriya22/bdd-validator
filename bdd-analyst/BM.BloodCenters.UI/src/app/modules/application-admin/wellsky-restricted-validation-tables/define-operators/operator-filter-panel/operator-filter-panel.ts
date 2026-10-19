import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { A11yModule } from '@angular/cdk/a11y';
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
import moment from 'moment';

import {
  ValidOperatorFilterValue,
  VALUE_STYLE_OPTIONS,
  DatePeriod
} from '../models/define-operators.model';

@Component({
  selector: 'app-operator-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    A11yModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './operator-filter-panel.html',
  styleUrls: ['./operator-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperatorFilterPanel implements OnInit {
  @Input() currentFilters: ValidOperatorFilterValue | null = null;
  @Output() apply = new EventEmitter<ValidOperatorFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  valueStyleOptions = VALUE_STYLE_OPTIONS;
  filteredValueStyleOptions = [...VALUE_STYLE_OPTIONS];
  valueStyleSearchControl = new FormControl('');

  periodOptions: { value: DatePeriod; label: string }[] = [
    { value: 'BEFORE', label: 'Before' },
    { value: 'AFTER', label: 'After' }
  ];

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;
  effectiveDateRequired = false;
  terminationDateRequired = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      valueStyle: [this.currentFilters?.valueStyle || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate
          ? new Date(this.currentFilters.effectiveDate)
          : null,
        [dateFormatValidator()]
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      termDate: [
        this.currentFilters?.terminationDate
          ? new Date(this.currentFilters.terminationDate)
          : null,
        [dateFormatValidator()]
      ]
    });

    this.valueStyleSearchControl.valueChanges.subscribe((term) => {
      const search = (term || '').toLowerCase();
      this.filteredValueStyleOptions = this.valueStyleOptions.filter(
        (o) => o.label.toLowerCase().includes(search) || o.value.toLowerCase().includes(search)
      );
    });

    // Add immediate validation on date changes
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      // Mark field as touched when user types to show validation errors
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('termDate')?.valueChanges.subscribe(() => {
      // Mark field as touched when user types to show validation errors
      const control = this.filterForm.get('termDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    // Clear errors when period is selected
    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.validateEffectivePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.validateTerminationPeriod();
      this.cdr.markForCheck();
    });
  }

  validateEffectivePeriod(): void {
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('effectiveDatePeriod')?.value;
    // Period is required when date is filled
    this.effectivePeriodRequired = !!date && !period;
    // Date is required when period is filled
    this.effectiveDateRequired = !!period && !date;
  }

  validateTerminationPeriod(): void {
    const date = this.filterForm.get('termDate')?.value;
    const period = this.filterForm.get('terminationDatePeriod')?.value;
    // Period is required when date is filled
    this.terminationPeriodRequired = !!date && !period;
    // Date is required when period is filled
    this.terminationDateRequired = !!period && !date;
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
      const control = this.filterForm.get('termDate');
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
      const control = this.filterForm.get('termDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  get isApplyDisabled(): boolean {
    // Check if there are validation errors (period without date or date without period)
    if (this.effectivePeriodRequired || this.terminationPeriodRequired ||
        this.effectiveDateRequired || this.terminationDateRequired) {
      return true;
    }

    // Check for invalid date format errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('termDate');
    if (effectiveDateControl?.hasError('invalidDateFormat') ||
        effectiveDateControl?.hasError('matDatepickerParse') ||
        terminationDateControl?.hasError('invalidDateFormat') ||
        terminationDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    // Check if at least one field has a value
    const values = this.filterForm.value;
    const hasValueStyle = values?.valueStyle !== null && values?.valueStyle !== undefined;
    // Both period AND date must be filled for effective/termination dates
    const hasEffectiveDate = values?.effectiveDatePeriod && values?.effectiveDate;
    const hasTerminationDate = values?.terminationDatePeriod && values?.termDate;

    return !(hasValueStyle || hasEffectiveDate || hasTerminationDate);
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: ValidOperatorFilterValue = {
      valueStyle: formValue.valueStyle || null,
      effectiveDate: formValue.effectiveDate ? this.convertToUTCDate(formValue.effectiveDate)?.toISOString() || null : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      terminationDate: formValue.termDate ? this.convertToUTCDate(formValue.termDate)?.toISOString() || null : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null
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

  onClear(): void {
    this.filterForm.reset({
      valueStyle: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      termDate: null
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRequired = false;
    this.terminationDateRequired = false;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
