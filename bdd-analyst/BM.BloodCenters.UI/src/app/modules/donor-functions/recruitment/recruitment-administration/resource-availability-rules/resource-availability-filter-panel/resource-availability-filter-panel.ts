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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { ResourceAvailabilityRulesService } from '../services/resource-availability-rules.service';
import { ResourceAvailabilityFilterValue } from '../models/resource-availability-rules.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

// Custom DateAdapter to use chapter timezone for "today"
class ChapterTimezoneCustomDateAdapter extends CustomDateAdapter {
  private chapterMinDate: Date | null = null;

  setChapterMinDate(date: Date): void {
    this.chapterMinDate = date;
  }

  override today(): Date {
    // Return chapter timezone's current date instead of browser's local date
    return this.chapterMinDate ? new Date(this.chapterMinDate) : new Date();
  }

  override format(date: Date, displayFormat: Object): string {
    // Get the default formatted date from parent
    const formatted = super.format(date, displayFormat);
    // Convert month abbreviation to uppercase (e.g., "Apr" -> "APR")
    return formatted.toUpperCase();
  }
}
@Component({
  selector: 'app-resource-availability-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterTimezoneCustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './resource-availability-filter-panel.html',
  styleUrls: ['./resource-availability-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceAvailabilityFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ResourceAvailabilityFilterValue | null = null;
  @Output() apply = new EventEmitter<ResourceAvailabilityFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  weekDays: string[] = [];
  periodOptions: string[] = ['Before', 'After'];

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: ResourceAvailabilityRulesService,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService,
    private dateAdapter: DateAdapter<Date>
  ) {
    // Get chapter timezone and set minDate based on chapter date
    const chapterTimezone = this.headerService.chapterTimeZone();
    const minDateMoment = DateFieldValidationUtility.getMinDate(chapterTimezone);
    const minDate = minDateMoment.toDate();

    // Set chapter timezone's current date as "today" for the datepicker
    if (this.dateAdapter instanceof ChapterTimezoneCustomDateAdapter) {
      this.dateAdapter.setChapterMinDate(minDate);
    }
  }

  ngOnInit(): void {
    // Load week days from API
    this.service.getWeekDays()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (days) => {
          this.weekDays = days;
          this.cdr.markForCheck();
        },
        error: () => {
          // Fallback to default values
          this.weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
          this.cdr.markForCheck();
        }
      });

    // Determine period values from current filters
    const effectiveDatePeriod = this.currentFilters?.effectiveDateFrom
      ? 'After'
      : this.currentFilters?.effectiveDateTo
        ? 'Before'
        : null;

    const terminationDatePeriod = this.currentFilters?.terminationDateFrom
      ? 'After'
      : this.currentFilters?.terminationDateTo
        ? 'Before'
        : null;

    // Determine which date value to use based on the period
    const effectiveDateStr = this.currentFilters?.effectiveDateFrom
      || this.currentFilters?.effectiveDateTo
      || null;

    const terminationDateStr = this.currentFilters?.terminationDateFrom
      || this.currentFilters?.terminationDateTo
      || null;

    // Parse dates to Date objects if they exist
    const parseDate = (dateStr: string | null): Date | null => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    // Keep 'ALL' value for the dropdown
    const dayValue = this.currentFilters?.day || null;

    this.filterForm = this.fb.group({
      day: [dayValue],
      effectiveDatePeriod: [effectiveDatePeriod],
      effectiveDate: [parseDate(effectiveDateStr), [dateFormatValidator()]],
      terminationDatePeriod: [terminationDatePeriod],
      terminationDate: [parseDate(terminationDateStr), [dateFormatValidator()]]
    });

    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectiveDatePeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        // Mark period as touched when a valid date is selected
        const hasValidDate = date && !control?.hasError('invalidDateFormat') && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectiveDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectiveDatePeriod');

        // Mark period as touched when date becomes valid
        const hasValidDate = control?.value && !control?.hasError('invalidDateFormat') && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
      });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationDatePeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        // Mark period as touched when a valid date is selected
        const hasValidDate = date && !control?.hasError('invalidDateFormat') && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationDatePeriod');

        // Mark period as touched when date becomes valid
        const hasValidDate = control?.value && !control?.hasError('invalidDateFormat') && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const effectiveDate = effectiveDateControl?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');

    // Only require period if date is valid (no date validation errors)
    const hasValidDate = effectiveDate && !effectiveDateControl?.hasError('invalidDateFormat') && !effectiveDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !effectiveDatePeriod) {
      effectiveDatePeriodControl?.setErrors({ required: true });
      effectiveDatePeriodControl?.markAsTouched();
    } else {
      effectiveDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const terminationDateControl = this.filterForm.get('terminationDate');
    const terminationDate = terminationDateControl?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    // Only require period if date is valid (no date validation errors)
    const hasValidDate = terminationDate && !terminationDateControl?.hasError('invalidDateFormat') && !terminationDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !terminationDatePeriod) {
      terminationDatePeriodControl?.setErrors({ required: true });
      terminationDatePeriodControl?.markAsTouched();
    } else {
      terminationDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    // Prevent apply if any validation errors exist
    if (effectiveDateControl?.errors ||
        terminationDateControl?.errors ||
        effectiveDatePeriodControl?.errors ||
        terminationDatePeriodControl?.errors) {
      // Mark all controls as touched to show all errors
      effectiveDateControl?.markAsTouched();
      terminationDateControl?.markAsTouched();
      effectiveDatePeriodControl?.markAsTouched();
      terminationDatePeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const effectiveDatePeriod = this.filterForm.value.effectiveDatePeriod;
    const effectiveDate = this.filterForm.value.effectiveDate;
    const terminationDatePeriod = this.filterForm.value.terminationDatePeriod;
    const terminationDate = this.filterForm.value.terminationDate;

    const formatDate = (d: any): string => {
      if (d instanceof Date && !isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return '';
    };

    const filters: ResourceAvailabilityFilterValue = {
      day: this.filterForm.value.day || null,
      effectiveDateFrom: effectiveDatePeriod === 'After' && effectiveDate
        ? formatDate(effectiveDate)
        : null,
      effectiveDateTo: effectiveDatePeriod === 'Before' && effectiveDate
        ? formatDate(effectiveDate)
        : null,
      terminationDateFrom: terminationDatePeriod === 'After' && terminationDate
        ? formatDate(terminationDate)
        : null,
      terminationDateTo: terminationDatePeriod === 'Before' && terminationDate
        ? formatDate(terminationDate)
        : null
    };
    this.apply.emit(filters);
  }

  get isApplyDisabled(): boolean {
    // Check if at least one field has a value
    const values = this.filterForm?.value;
    const hasDay = values?.day && values.day !== '';
    const hasEffectiveDate = values?.effectiveDatePeriod || values?.effectiveDate;
    const hasTerminationDate = values?.terminationDatePeriod || values?.terminationDate;

    const hasAnyValue = hasDay || hasEffectiveDate || hasTerminationDate;

    // Disable if no values OR if form has validation errors
    if (!hasAnyValue) {
      return true;
    }

    // Check for validation errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    const hasDateErrors = (effectiveDateControl?.invalid ?? false) || (terminationDateControl?.invalid ?? false);
    const hasPeriodErrors = (effectiveDatePeriodControl?.invalid ?? false) || (terminationDatePeriodControl?.invalid ?? false);

    return hasDateErrors || hasPeriodErrors;
  }

  onClear(): void {
    this.filterForm.reset();
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;

    // Mark as dirty so validator runs even if adapter rejects the value
    const control = this.filterForm.get('effectiveDate');
    if (control && !control.dirty) {
      control.markAsDirty();
    }
    // Trigger validation update
    control?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      // Mark as touched to show validation errors
      control?.markAsTouched();

      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Store raw input text when user types in termination date field
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;

    // Mark as dirty so validator runs even if adapter rejects the value
    const control = this.filterForm.get('terminationDate');
    if (control && !control.dirty) {
      control.markAsDirty();
    }
    // Trigger validation update
    control?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      // Mark as touched to show validation errors
      control?.markAsTouched();

      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
      this.cdr.markForCheck();
    }, 0);
  }
}
