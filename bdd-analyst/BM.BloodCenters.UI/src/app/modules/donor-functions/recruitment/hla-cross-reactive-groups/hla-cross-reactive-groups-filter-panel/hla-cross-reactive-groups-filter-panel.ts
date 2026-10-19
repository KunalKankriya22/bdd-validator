import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { HlaCrossReactiveGroupFilterValue } from '../models/hla-cross-reactive-groups.model';

/**
 * Filter panel component for HLA Cross-Reactive Groups
 * Provides filters for Reference, Effective Date with Period, and Termination Date with Period
 */
@Component({
  selector: 'app-hla-cross-reactive-groups-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatIconModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './hla-cross-reactive-groups-filter-panel.html',
  styleUrls: ['./hla-cross-reactive-groups-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HlaCrossReactiveGroupsFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: HlaCrossReactiveGroupFilterValue | null = null;
  @Input() hlaStandardOptions: { code: string; description: string }[] = [];
  @Output() apply = new EventEmitter<HlaCrossReactiveGroupFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm: FormGroup;

  // Search controls
  referenceSearchControl = new FormControl('');

  // Filtered options
  filteredReferenceOptions: { code: string; description: string }[] = [];

  // Period validation errors
  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Moment>
  ) {
    this.filterForm = this.fb.group({
      hlaStandard: [''],
      effectivePeriod: [''],
      effectiveDate: [null, [dateFormatValidator()]],
      terminationPeriod: [''],
      terminationDate: [null, [dateFormatValidator()]]
    });
  }

  ngOnInit(): void {
    // Initialize filtered options
    this.filteredReferenceOptions = this.hlaStandardOptions;

    // Setup search filtering
    this.setupSearchFilters();

    this.populateFilters();
    this.setupPeriodValidation();
  }

  /**
   * Setup search filtering for dropdowns
   */
  private setupSearchFilters(): void {
    // Reference search
    this.referenceSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterReferenceOptions();
      });
  }

  /**
   * Filter reference options based on search text
   */
  private filterReferenceOptions(): void {
    const searchTerm = (this.referenceSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredReferenceOptions = this.hlaStandardOptions;
    } else {
      this.filteredReferenceOptions = this.hlaStandardOptions.filter(option =>
        option.code.toLowerCase().includes(searchTerm) ||
        option.description.toLowerCase().includes(searchTerm)
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup period validation watchers
   */
  private setupPeriodValidation(): void {
    // Validate effectiveDatePeriod when effectiveDate changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Validate terminationDatePeriod when terminationDate changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    // Validate when period values change
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

  /**
   * Validate effective date period
   */
  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectivePeriod = this.filterForm.get('effectivePeriod')?.value;

    // Show error only if date is selected but period is not
    if (effectiveDate && (!effectivePeriod || effectivePeriod === '')) {
      this.effectiveDatePeriodError = 'Period is required';
    } else {
      this.effectiveDatePeriodError = '';
    }
  }

  /**
   * Validate termination date period
   */
  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationPeriod = this.filterForm.get('terminationPeriod')?.value;

    // Show error only if date is selected but period is not
    if (terminationDate && (!terminationPeriod || terminationPeriod === '')) {
      this.terminationDatePeriodError = 'Period is required';
    } else {
      this.terminationDatePeriodError = '';
    }
  }

  /**
   * Populate form with current filter values
   */
  private populateFilters(): void {
    if (this.currentFilters) {
      this.filterForm.patchValue({
        hlaStandard: this.currentFilters.hlaStandard || '',
        effectivePeriod: this.currentFilters.effectivePeriod || '',
        effectiveDate: this.currentFilters.effectiveDate ? moment(this.currentFilters.effectiveDate) : null,
        terminationPeriod: this.currentFilters.terminationPeriod || '',
        terminationDate: this.currentFilters.terminationDate ? moment(this.currentFilters.terminationDate) : null
      });

      // Run initial validation if data was provided
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  /**
   * Parse input date string using configured date formats
   */
  private parseInputDate(inputValue: string): Moment | null {
    const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
      ? DD_MON_YYYY_FORMATS.parse.dateInput
      : [DD_MON_YYYY_FORMATS.parse.dateInput];
    return this.dateAdapter.parse(inputValue, formats);
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    const control = this.filterForm.get('effectiveDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ ...control.errors, invalidDate: true });
      }
    }
  }

  /**
   * Restore invalid text when Material clears it on blur and validate
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      const inputValue = input.value?.trim() || '';

      // If control has no value but we have raw input, restore it
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const parsed = this.parseInputDate(inputValue);

        if (parsed?.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          input.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
        } else if (control) {
          // Failed to parse - set invalid error
          control.setErrors({ ...control.errors, invalidDate: true });
          control.markAsTouched();
        }
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        // Clear custom error if input is empty or has valid value
        const errors = { ...control.errors };
        delete errors['invalidDate'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
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
    const control = this.filterForm.get('terminationDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ ...control.errors, invalidDate: true });
      }
    }
  }

  /**
   * Restore invalid text when Material clears it on blur and validate
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      const inputValue = input.value?.trim() || '';

      // If control has no value but we have raw input, restore it
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const parsed = this.parseInputDate(inputValue);

        if (parsed?.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          input.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
        } else if (control) {
          // Failed to parse - set invalid error
          control.setErrors({ ...control.errors, invalidDate: true });
          control.markAsTouched();
        }
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        // Clear custom error if input is empty or has valid value
        const errors = { ...control.errors };
        delete errors['invalidDate'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Apply filters and emit the result
   */
  onApply(): void {
    // Validate before applying
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: HlaCrossReactiveGroupFilterValue = {
      hlaStandard: formValue.hlaStandard || undefined,
      effectivePeriod: formValue.effectivePeriod || undefined,
      effectiveDate: formValue.effectiveDate
        ? (formValue.effectiveDate as Moment).format('YYYY-MM-DD')
        : undefined,
      terminationPeriod: formValue.terminationPeriod || undefined,
      terminationDate: formValue.terminationDate
        ? (formValue.terminationDate as Moment).format('YYYY-MM-DD')
        : undefined
    };

    this.apply.emit(filters);
  }

  /**
   * Clear all filters
   */
  onClearAll(): void {
    this.filterForm.reset({
      hlaStandard: '',
      effectivePeriod: '',
      effectiveDate: null,
      terminationPeriod: '',
      terminationDate: null
    });
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    // Clear all control errors
    this.filterForm.get('effectivePeriod')?.setErrors(null);
    this.filterForm.get('terminationPeriod')?.setErrors(null);

    this.cdr.markForCheck();
  }

  /**
   * Close the filter panel
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Check if Apply button should be disabled
   */
  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if there are any period validation errors
    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return true;
    }

    // Check for invalid date format errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');

    if (effectiveDateControl?.hasError('invalidDate') ||
        effectiveDateControl?.hasError('invalidDateFormat') ||
        effectiveDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    if (terminationDateControl?.hasError('invalidDate') ||
        terminationDateControl?.hasError('invalidDateFormat') ||
        terminationDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    // Check if at least one field has a value
    const hasAnyValue =
      (formValue.hlaStandard !== null && formValue.hlaStandard !== '') ||
      formValue.effectiveDate !== null ||
      formValue.terminationDate !== null;

    return !hasAnyValue;
  }
}
