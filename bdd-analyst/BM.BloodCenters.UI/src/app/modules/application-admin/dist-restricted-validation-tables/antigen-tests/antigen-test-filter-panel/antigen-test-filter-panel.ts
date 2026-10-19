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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { AntigenTestFilterValue } from '../models/antigen-test.model';

@Component({
  selector: 'app-antigen-test-filter-panel',
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
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './antigen-test-filter-panel.html',
  styleUrls: ['./antigen-test-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AntigenTestFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: AntigenTestFilterValue | null = null;
  @Output() apply = new EventEmitter<AntigenTestFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Range options for price
  rangeOptions: string[] = ['Over', 'Under'];

  // Period options for dates (API uses After and Before)
  periodOptions: string[] = ['After', 'Before'];

  minDate = DateFieldValidationUtility.getMinDate();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';
  private initialFilterValues: AntigenTestFilterValue | null = null;

  get hasPriceValue(): boolean {
    const price = this.filterForm?.get('price')?.value;
    return price !== null && price !== '' && price !== undefined;
  }

  get effDatePeriodRequired(): boolean {
    const formValue = this.filterForm?.value;
    return !!(formValue?.effectiveDate && !formValue?.effectiveDatePeriod);
  }

  get termDatePeriodRequired(): boolean {
    const formValue = this.filterForm?.value;
    return !!(formValue?.terminationDate && !formValue?.terminationDatePeriod);
  }

  get isApplyDisabled(): boolean {
    // Check if form is invalid (any validation errors)
    if (this.filterForm?.invalid) {
      return true;
    }

    // Check if period validation fails (date selected but no period)
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) {
      return true;
    }

    // Prevent applying with only range (no price) or only period (no date)
    const formValue = this.filterForm?.value;

    // Check for price range without price value
    if (formValue?.priceRange && (formValue.price === null || formValue.price === '' || formValue.price === undefined)) {
      return true; // Disable apply - range selected but no price
    }

    // Check for effective date period without date
    if (formValue?.effectiveDatePeriod && !formValue.effectiveDate) {
      return true; // Disable apply - period selected but no date
    }

    // Check for termination date period without date
    if (formValue?.terminationDatePeriod && !formValue.terminationDate) {
      return true; // Disable apply - period selected but no date
    }

    // Check if form has date errors
    if (this.hasDateErrors()) {
      return true;
    }

    // Check if there are any error messages showing
    if (this.getEffectiveDateError() || this.getTerminationDateError() ||
        this.getEffectiveDatePeriodError() || this.getTerminationDatePeriodError() ||
        this.getPriceRangeError()) {
      return true;
    }

    // Check if any field has a value
    if (!formValue) {
      return true;
    }

    const hasAnyValue =
      (formValue.priceRange && (formValue.price !== null && formValue.price !== '' && formValue.price !== undefined)) ||
      (formValue.effectiveDatePeriod && formValue.effectiveDate) ||
      (formValue.terminationDatePeriod && formValue.terminationDate);

    if (!hasAnyValue) {
      return true;
    }

    // Check if form values have changed from initial values
    if (!this.hasFormChanged()) {
      return true;
    }

    return false;
  }

  hasDateErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDateHasFormatError = effectiveDateControl?.hasError('invalidDateFormat') ||
                                        effectiveDateControl?.hasError('matDatepickerParse');
    const terminationDateHasFormatError = terminationDateControl?.hasError('invalidDateFormat') ||
                                          terminationDateControl?.hasError('matDatepickerParse');

    const hasRangeError = this.filterForm.hasError('dateRangeInvalid');

    return effectiveDateHasFormatError || terminationDateHasFormatError || hasRangeError || false;
  }

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      priceRange: [this.currentFilters?.priceRange || null],
      price: [this.currentFilters?.price || null, [Validators.min(0), Validators.max(99999.99)]],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null, [dateFormatValidator()]]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Store initial values to track changes
    if (this.currentFilters) {
      this.initialFilterValues = { ...this.currentFilters };
    } else {
      this.initialFilterValues = null;
    }

    // Setup validation listeners
    this.filterForm.get('price')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePriceRange();
        this.cdr.markForCheck();
      });

    this.filterForm.get('priceRange')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePriceRange();
        this.cdr.markForCheck();
      });

    // Watch effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch termination date period changes
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch all form changes to update Apply button state
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Watch form status changes (valid/invalid) to update Apply button state
    this.filterForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Initial validation check in case filters were pre-populated
    this.validatePriceRange();
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    // Setup listeners to clear validation when fields are cleared
    this.setupClearValidationListeners();
  }

  /**
   * Setup listeners to clear validation errors when fields are cleared
   */
  private setupClearValidationListeners(): void {
    // Price Range dropdown
    this.filterForm.get('priceRange')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.filterForm.get('priceRange');
        if (!value && control) {
          control.setErrors(null);
          control.markAsPristine();
          control.markAsUntouched();
        }
      });

    // Effective Date Period dropdown
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.filterForm.get('effectiveDatePeriod');
        if (!value && control) {
          control.setErrors(null);
          control.markAsPristine();
          control.markAsUntouched();
        }
      });

    // Termination Date Period dropdown
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.filterForm.get('terminationDatePeriod');
        if (!value && control) {
          control.setErrors(null);
          control.markAsPristine();
          control.markAsUntouched();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private validatePriceRange(): void {
    const price = this.filterForm.get('price')?.value;
    const priceRange = this.filterForm.get('priceRange')?.value;
    const priceRangeControl = this.filterForm.get('priceRange');

    if ((price !== null && price !== '' && price !== undefined) && !priceRange) {
      priceRangeControl?.setErrors({ required: true });
      priceRangeControl?.markAsTouched();
    } else {
      priceRangeControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const control = this.filterForm.get('effectiveDatePeriod');

    // Only validate: if date is selected but period is not, mark period as required
    // Do NOT validate the reverse (period selected but no date) - this is intentional
    if (effectiveDate && !effectiveDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const control = this.filterForm.get('terminationDatePeriod');

    // Only validate: if date is selected but period is not, mark period as required
    // Do NOT validate the reverse (period selected but no date) - this is intentional
    if (terminationDate && !terminationDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    // Check for validation errors (date errors or period required)
    if (this.hasDateErrors() || this.effDatePeriodRequired || this.termDatePeriodRequired) {
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    // Convert dates to Date objects - handle both Moment objects and Date objects
    let effectiveDateValue: Date | null = null;
    if (formValue.effectiveDate) {
      if (formValue.effectiveDate instanceof Date) {
        effectiveDateValue = formValue.effectiveDate;
      } else if (formValue.effectiveDate.toDate) {
        // Moment object
        effectiveDateValue = formValue.effectiveDate.toDate();
      }
    }

    let terminationDateValue: Date | null = null;
    if (formValue.terminationDate) {
      if (formValue.terminationDate instanceof Date) {
        terminationDateValue = formValue.terminationDate;
      } else if (formValue.terminationDate.toDate) {
        // Moment object
        terminationDateValue = formValue.terminationDate.toDate();
      }
    }

    const filters: AntigenTestFilterValue = {
      priceRange: formValue.priceRange || null,
      price: formValue.price !== null && formValue.price !== '' ? Number(formValue.price) : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: effectiveDateValue,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: terminationDateValue
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    // CRITICAL: Update initial filter values to match cleared state
    // This ensures Apply button remains disabled when reopening filter after clear
    this.initialFilterValues = {
      priceRange: null,
      price: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    };

    // Clear all control errors
    this.filterForm.get('priceRange')?.setErrors(null);
    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-numeric characters except decimal point
    inputValue = inputValue.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to 5 digits before decimal and 2 digits after (max: 99999.99)
    if (parts.length === 2) {
      const integerPart = parts[0].substring(0, 5);
      const decimalPart = parts[1].substring(0, 2);
      inputValue = integerPart + '.' + decimalPart;
    } else {
      inputValue = inputValue.substring(0, 5);
    }

    // Update input value
    input.value = inputValue;

    const value = parseFloat(inputValue);

    // Validate min and max values
    if (!isNaN(value)) {
      if (value < 0) {
        input.value = '0';
        this.filterForm.patchValue({ price: 0 }, { emitEvent: false });
      } else if (value > 99999.99) {
        input.value = '99999.99';
        this.filterForm.patchValue({ price: 99999.99 }, { emitEvent: false });
      }
    }
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    DateFieldValidationUtility.handleEndDateInput(
      input.value, this.filterForm.get('effectiveDate'), false
    );
    this.cdr.markForCheck();
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    const control = this.filterForm.get('effectiveDate');

    if (!control) return;

    const inputValue = input.value?.trim();

    if (control?.hasError('invalidDateFormat') || control?.hasError('matDatepickerParse') || control?.hasError('invalidDate')) {
      setTimeout(() => {
        input.value = this.effectiveDateRawInput;
        this.cdr.markForCheck();
      }, 0);
    } else if (!inputValue) {
      // If field is empty on blur, keep it pristine/untouched (prevents validation on blur)
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
      this.cdr.markForCheck();
    }
  }

  /**
   * Store raw input text when user types in termination date field
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    DateFieldValidationUtility.handleEndDateInput(
      input.value, this.filterForm.get('terminationDate'), false
    );
    this.cdr.markForCheck();
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    const control = this.filterForm.get('terminationDate');

    if (!control) return;

    const inputValue = input.value?.trim();

    if (control?.hasError('invalidDateFormat') || control?.hasError('matDatepickerParse') || control?.hasError('invalidDate')) {
      setTimeout(() => {
        input.value = this.terminationDateRawInput;
        this.cdr.markForCheck();
      }, 0);
    } else if (!inputValue) {
      // If field is empty on blur, keep it pristine/untouched (prevents validation on blur)
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
      this.cdr.markForCheck();
    }
  }

  getPriceRangeError(): string {
    const control = this.filterForm.get('priceRange');
    if (control?.hasError('required') && control?.touched) {
      return 'Price Range is required';
    }
    return '';
  }

  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getEffectiveDateError(): string {
    // Only show cross-field date range errors and format errors
    // Do NOT show "Date is required" error when only period is selected
    const formErrors = this.lastChangedDateField === 'effective' ? this.filterForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.filterForm.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    // Only show cross-field date range errors and format errors
    // Do NOT show "Date is required" error when only period is selected
    const formErrors = this.lastChangedDateField === 'termination' ? this.filterForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.filterForm.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  private hasFormChanged(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) {
      return false;
    }

    // If no initial values were set, consider it changed if there are values
    if (!this.initialFilterValues) {
      return true;
    }

    // Compare each field
    const currentEffectiveDate = formValue.effectiveDate ? this.formatDateForComparison(formValue.effectiveDate) : null;
    const currentTerminationDate = formValue.terminationDate ? this.formatDateForComparison(formValue.terminationDate) : null;

    const initialEffectiveDate = this.initialFilterValues.effectiveDate ? this.formatDateForComparison(new Date(this.initialFilterValues.effectiveDate)) : null;
    const initialTerminationDate = this.initialFilterValues.terminationDate ? this.formatDateForComparison(new Date(this.initialFilterValues.terminationDate)) : null;

    const isChanged =
      formValue.priceRange !== this.initialFilterValues.priceRange ||
      formValue.price !== this.initialFilterValues.price ||
      formValue.effectiveDatePeriod !== this.initialFilterValues.effectiveDatePeriod ||
      currentEffectiveDate !== initialEffectiveDate ||
      formValue.terminationDatePeriod !== this.initialFilterValues.terminationDatePeriod ||
      currentTerminationDate !== initialTerminationDate;

    return isChanged;
  }

  private formatDateForComparison(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
