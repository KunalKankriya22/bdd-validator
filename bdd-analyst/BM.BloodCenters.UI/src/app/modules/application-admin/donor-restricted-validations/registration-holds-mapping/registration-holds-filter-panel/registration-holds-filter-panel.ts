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
import { MatInputModule } from '@angular/material/input';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { RegistrationHoldsMappingFilterValue } from '../models/registration-holds-mapping.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

@Component({
  selector: 'app-registration-holds-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './registration-holds-filter-panel.html',
  styleUrls: ['./registration-holds-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationHoldsFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: RegistrationHoldsMappingFilterValue | null = null;
  @Output() apply = new EventEmitter<RegistrationHoldsMappingFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  periodOptions: { value: string; display: string }[] = [
    { value: 'After', display: 'After' },
    { value: 'Before', display: 'Before' }
  ];

  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  // Error state matchers for date fields using DateFieldUtility
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.effDateError);
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.termDateError);

  private formChanged = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Moment>
  ) { }

  ngOnInit(): void {
    // Initialize form without custom validators - validation handled through DateFieldUtility
    this.filterForm = this.fb.group({
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate ? moment.utc(this.currentFilters.effectiveDate) : null],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate ? moment.utc(this.currentFilters.terminationDate) : null]
    });

    this.setupValidation();

    // Run initial validation if data was provided
    if (this.currentFilters) {
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formChanged = true;
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formChanged = true;
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formChanged = true;
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formChanged = true;
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectivePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const control = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate && (!effectivePeriod || effectivePeriod === '')) {
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
    const terminationPeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const control = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && (!terminationPeriod || terminationPeriod === '')) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
      this.terminationDatePeriodError = 'Period is required';
    } else {
      control?.setErrors(null);
      this.terminationDatePeriodError = '';
    }
  }

  onApply(): void {
    // Validate before applying
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: RegistrationHoldsMappingFilterValue = {
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.apply.emit(filters);
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

    // Clear all control errors
    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);
    this.filterForm.get('effectiveDate')?.setErrors(null);
    this.filterForm.get('terminationDate')?.setErrors(null);

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check for date format validation errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const hasDateFormatErrors = !!(
      effectiveDateControl?.hasError('invalidDateFormat') ||
      effectiveDateControl?.hasError('matDatepickerParse') ||
      effectiveDateControl?.hasError('invalidDate') ||
      terminationDateControl?.hasError('invalidDateFormat') ||
      terminationDateControl?.hasError('matDatepickerParse') ||
      terminationDateControl?.hasError('invalidDate')
    );

    if (hasDateFormatErrors) {
      return true;
    }

    // Check for incomplete date pairs (period selected without date)
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
    return this.filterForm.get('effectiveDatePeriod')?.invalid ||
           this.filterForm.get('terminationDatePeriod')?.invalid ||
           false;
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
        control?.setErrors({ invalidDate: true });
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

      this.validateEffectiveDatePeriod();
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
        control?.setErrors({ invalidDate: true });
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

      this.validateTerminationDatePeriod();
      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Get error message for effective date field.
   * Used by error state matcher.
   */
  get effDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Invalid date';
    }
    return '';
  }

  /**
   * Get error message for termination date field.
   * Used by error state matcher.
   */
  get termDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Invalid date';
    }
    return '';
  }

  /**
   * Getter method for effective date period error (for tests)
   */
  getEffectiveDatePeriodError(): string {
    return this.effectiveDatePeriodError;
  }

  /**
   * Getter method for termination date period error (for tests)
   */
  getTerminationDatePeriodError(): string {
    return this.terminationDatePeriodError;
  }
}
