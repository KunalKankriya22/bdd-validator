import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import moment, { Moment } from 'moment';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { inject } from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { ChapterTimezoneService } from '../../services/chapter-timezone.service';
import { getDateInTimezone } from '../../date/timezone.util';

/**
 * DateFieldValidationUtility
 *
 * Shared reusable validation utility for handling Effective Date and Termination Date
 * validation logic across all components that use Add and Edit modals.
 *
 * This utility provides:
 * - Date filter functions to disable past dates in datepickers
 * - Validators for effective date and termination date
 * - Error message functions
 * - Helper methods for common date validation scenarios
 *
 * Reference implementation: Box Capacity component
 *
 * IMPORTANT: This utility now uses the ChapterTimezoneService to get the chapter's local date
 * instead of the system date. This ensures date validations are based on the chapter's timezone.
 */
export class DateFieldValidationUtility {
  /**
   * Chapter timezone service instance
   * Used to get the chapter's local date for validation
   */
  private static chapterTimezoneService: ChapterTimezoneService | null = null;

  /**
   * Set the chapter timezone service instance
   * This should be called once during application initialization
   * @param service - ChapterTimezoneService instance
   */
  public static setChapterTimezoneService(service: ChapterTimezoneService): void {
    this.chapterTimezoneService = service;
  }

  /**
   * Get "today" based on chapter local date from the API.
   * Falls back to chapter timezone offset if local date is not available,
   * and ultimately to browser's local time if neither is available.
   *
   * @param chapterOffset - Optional chapter timezone offset (fallback if service not available)
   * @returns Moment object representing the start of today in the chapter's timezone
   */
  private static getToday(chapterOffset?: string): Moment {
    // Priority 1: Use chapter local date from the API (most accurate)
    if (this.chapterTimezoneService && this.chapterTimezoneService.isChapterLocalDateAvailable()) {
      return this.chapterTimezoneService.getChapterLocalDate();
    }

    // Priority 2: Use chapter timezone offset (fallback)
    if (chapterOffset && chapterOffset !== 'UTC') {
      try {
        const { year, month, day } = getDateInTimezone(chapterOffset);
        return moment([year, month, day]);
      } catch {
        // Fallback: try as offset string (e.g., "-05:00")
        return moment.utc().utcOffset(chapterOffset).startOf('day');
      }
    }

    // Priority 3: Use browser's local time (last resort)
    return moment().startOf('day');
  }

  /**
   * Get the minimum date (today at start of day).
   * Used to prevent selection of past dates in Add mode.
   *
   * @param chapterOffset - Optional chapter timezone offset (e.g., '+05:30', '-06:00')
   * @returns Moment object representing today at midnight
   */
  static getMinDate(chapterOffset?: string): Moment {
    return this.getToday(chapterOffset);
  }

  /**
   * Get current date/time for insertDate field using chapter's local date.
   * Returns Date object for immediate use in record creation.
   * Falls back to system date if chapter date is not available.
   *
   * Use this when the API expects a Date object for insertDate.
   *
   * @returns Date object representing current moment in chapter's timezone
   *
   * Usage:
   * ```typescript
   * insertDate: DateFieldValidationUtility.getChapterLocalDateForInsert()
   * ```
   */
  static getChapterLocalDateForInsert(): Date {
    // Priority 1: Use chapter local date from the API (most accurate)
    if (this.chapterTimezoneService && this.chapterTimezoneService.isChapterLocalDateAvailable()) {
      return this.chapterTimezoneService.getChapterLocalDate().toDate();
    }

    // Priority 2: Fallback to system date if chapter date not available
    // This ensures the app doesn't break if chapter timezone service fails
    return new Date();
  }

  /**
   * Get current date/time as ISO string for insertDate field.
   * Uses chapter's local date when available.
   *
   * Use this when the API expects an ISO string for insertDate.
   *
   * @returns ISO string for insertDate field
   *
   * Usage:
   * ```typescript
   * insertDate: DateFieldValidationUtility.getChapterLocalDateForInsertISO()
   * ```
   */
  static getChapterLocalDateForInsertISO(): string {
    return this.getChapterLocalDateForInsert().toISOString();
  }

  /**
   * Date filter function for Effective Date picker.
   * Disables all dates before today (using chapter local date).
   *
   * Usage in template:
   * ```html
   * <input matInput [matDatepicker]="picker"
   *        [matDatepickerFilter]="effectiveDateFilter"
   *        [min]="minDate">
   * ```
   *
   * @param date - The date to check
   * @returns true if date is selectable (today or future), false otherwise
   */
  static effectiveDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;
    const today = DateFieldValidationUtility.getToday();
    const checkDate = moment.isMoment(date) ? date : moment(date);
    return checkDate.format('YYYY-MM-DD') >= today.format('YYYY-MM-DD');
  };

  /**
   * Creates a chapter-aware date filter for Effective Date picker.
   *
   * @param chapterOffset - Chapter timezone offset string (e.g., '+05:30', '-06:00')
   * @returns Filter function that disables dates before chapter's today
   */
  static createEffectiveDateFilter(chapterTimezone: string): (date: Moment | null) => boolean {
    return (date: Moment | null): boolean => {
      if (!date) return true;
      const today = DateFieldValidationUtility.getToday(chapterTimezone);
      const checkDate = moment.isMoment(date) ? date : moment(date);
      return checkDate.format('YYYY-MM-DD') >= today.format('YYYY-MM-DD');
    };
  }

  /**
   * Creates a date filter function for Termination Date picker that disables
   * dates before the selected Effective Date.
   *
   * Usage in component:
   * ```typescript
   * getTerminationDateFilter = (): ((date: Moment | null) => boolean) => {
   *   return DateFieldValidationUtility.createTerminationDateFilter(
   *     this.form.get('effectiveDate')?.value
   *   );
   * };
   * ```
   *
   * Usage in template:
   * ```html
   * <input matInput [matDatepicker]="picker"
   *        [matDatepickerFilter]="getTerminationDateFilter()"
   *        [min]="form.get('effectiveDate')?.value">
   * ```
   *
   * @param effectiveDate - The selected effective date (Moment or Date)
   * @returns Filter function that returns true if date is selectable
   */
  static createTerminationDateFilter(effectiveDate: Moment | Date | null): (date: Moment | null) => boolean {
    return (date: Moment | null): boolean => {
      if (!date || !effectiveDate) return true;

      const effDate = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      const checkDate = moment(date).startOf('day');
      const effDay = moment(effDate).startOf('day');

      return checkDate.isSameOrAfter(effDay);
    };
  }

  /**
   * Field-level validator: Validates that the date is a valid calendar date.
   * Prevents invalid dates like day 32, month 13, etc.
   *
   * @returns ValidationErrors with key 'invalidDate' if date is not valid
   *
   * Usage:
   * ```typescript
   * effectiveDate: [null, [
   *   Validators.required,
   *   DateFieldValidationUtility.validDateValidator()
   * ]]
   * ```
   */
  static validDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null; // Let Validators.required handle empty values

      const selectedDate = moment.isMoment(value) ? value : moment(value);

      // Check if the date is valid (catches invalid days like 32, months like 13, etc.)
      if (!selectedDate.isValid()) {
        return { invalidDate: true };
      }

      return null;
    };
  }

  /**
   * Field-level validator: Effective Date cannot be a past date.
   * Only applies in Add mode - should not be used in Edit mode for existing records.
   *
   * @returns ValidationErrors with key 'effectiveDatePast' if date is before today
   *
   * Usage:
   * ```typescript
   * effectiveDate: [null, [
   *   Validators.required,
   *   DateFieldValidationUtility.effectiveDateNotPastValidator()
   * ]]
   * ```
   */
  static effectiveDateNotPastValidator(chapterTimezone?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null; // Let Validators.required handle empty values

      const selectedDate = moment.isMoment(value) ? value : moment(value);

      // First check if date is valid
      if (!selectedDate.isValid()) {
        return null; // Let validDateValidator handle this
      }

      const today = DateFieldValidationUtility.getToday(chapterTimezone);

      // Compare as calendar date strings to avoid timezone issues in moment's isBefore()
      if (selectedDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
        return { effectiveDatePast: true };
      }

      return null;
    };
  }

  /**
   * Field-level validator: Termination Date cannot be a past date (for Add mode only).
   * Similar to effectiveDateNotPastValidator but for termination date.
   *
   * @returns ValidationErrors with key 'terminationDatePast' if date is before today
   *
   * Usage:
   * ```typescript
   * terminationDate: [null, [
   *   DateFieldValidationUtility.terminationDateNotPastValidator()
   * ]]
   * ```
   */
  static terminationDateNotPastValidator(chapterTimezone?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null; // Termination date is optional

      const selectedDate = moment.isMoment(value) ? value : moment(value);

      // First check if date is valid
      if (!selectedDate.isValid()) {
        return null; // Let validDateValidator handle this
      }

      const today = DateFieldValidationUtility.getToday(chapterTimezone);

      // Compare as calendar date strings to avoid timezone issues in moment's isBefore()
      if (selectedDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
        return { terminationDatePast: true };
      }

      return null;
    };
  }

  /**
   * Field-level validator for Termination Date in Edit mode.
   * Allows the original past termination date but blocks manually entering NEW past dates.
   *
   * Use this in edit mode when a record might already have a past termination date.
   * The validator compares the current value against the original value:
   * - If the value matches the original past date: ALLOWED
   * - If the value is a NEW date and it's in the past: BLOCKED
   *
   * @param originalTerminationDate - The original termination date from the database (YYYY-MM-DD format or null)
   * @param chapterTimezone - Optional chapter timezone offset (e.g., '+05:30', '-06:00')
   * @returns ValidatorFn that returns null if valid, or error object if invalid
   *
   * Usage:
   * ```typescript
   * // Store original value when loading record in edit mode
   * this.originalTerminationDate = record.terminationDate
   *   ? moment(record.terminationDate).format('YYYY-MM-DD')
   *   : null;
   *
   * // Apply validator to termination date control
   * terminationDate: [
   *   record.terminationDate ? moment(record.terminationDate) : null,
   *   [DateFieldValidationUtility.editModeTerminationDateValidator(this.originalTerminationDate)]
   * ]
   * ```
   */
  static editModeTerminationDateValidator(originalTerminationDate: string | null, chapterTimezone?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null; // Termination date is optional

      const selectedDate = moment.isMoment(value) ? value : moment(value);

      // First check if date is valid
      if (!selectedDate.isValid()) {
        return null; // Let validDateValidator handle this
      }

      const selectedDateStr = selectedDate.format('YYYY-MM-DD');

      // If the selected date matches the original value (even if it's in the past), allow it
      if (originalTerminationDate && selectedDateStr === originalTerminationDate) {
        return null;
      }

      // If it's a NEW value (different from original), check if it's in the past
      const today = DateFieldValidationUtility.getToday(chapterTimezone);

      // Compare as calendar date strings to avoid timezone issues in moment's isBefore()
      if (selectedDateStr < today.format('YYYY-MM-DD')) {
        return { terminationDatePast: true };
      }

      return null;
    };
  }

  /**
   * Form-group-level validator: Validates date range.
   * Ensures Termination Date >= Effective Date.
   *
   * Returns form-level error 'dateRangeInvalid' when validation fails.
   *
   * @returns ValidationErrors with key 'dateRangeInvalid' if termination < effective
   *
   * Usage:
   * ```typescript
   * this.form = this.fb.group({
   *   effectiveDate: [null, [Validators.required]],
   *   terminationDate: [null]  // Optional field
   * }, {
   *   validators: [DateFieldValidationUtility.dateRangeValidator()]
   * });
   * ```
   */
  static dateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) return null;

      // Support multiple naming conventions: effectiveDate/terminationDate, effDate/termDate, effDateTime/termDateTime
      const effectiveDateControl = control.get('effectiveDate') || control.get('effDate') || control.get('effDateTime');
      const terminationDateControl = control.get('terminationDate') || control.get('termDate') || control.get('termDateTime');

      if (!effectiveDateControl || !terminationDateControl) {
        return null;
      }

      const effectiveDate = effectiveDateControl.value;
      const terminationDate = terminationDateControl.value;

      // If termination date is not set (optional), validation passes
      if (!effectiveDate || !terminationDate) {
        return null;
      }

      // Convert to moment objects for comparison
      const effDate = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      const termDate = moment.isMoment(terminationDate) ? terminationDate : moment(terminationDate);

      // Normalize to day level for comparison
      const effDay = moment(effDate).startOf('day');
      const termDay = moment(termDate).startOf('day');

      // Termination Date must be >= Effective Date
      if (termDay.isBefore(effDay)) {
        return { dateRangeInvalid: true };
      }

      return null;
    };
  }

  /**
   * Get error message for Effective Date field.
   * Handles all validation errors: required, past date, invalid date, and date range.
   *
   * @param control - The effective date form control
   * @param formErrors - Optional form-level errors object
   * @returns Error message string or empty string if no errors
   *
   * Usage:
   * ```typescript
   * getEffectiveDateError(): string {
   *   return DateFieldValidationUtility.getEffectiveDateErrorMessage(
   *     this.form.get('effectiveDate'),
   *     this.form.errors
   *   );
   * }
   * ```
   */
  static getEffectiveDateErrorMessage(
    control: AbstractControl | null,
    formErrors?: ValidationErrors | null
  ): string {
    if (!control) {
      return '';
    }

    // Only check other errors if touched or dirty
    if (!(control.touched || control.dirty)) {
      return '';
    }

    // Check matDatepickerParse first - user typed something but datepicker couldn't parse it
    // Must be checked before 'required' because an unparseable input sets value to null, triggering required
    if (control.hasError('matDatepickerParse')) {
      return 'Effective date is invalid';
    }

    // Check for required error - field is truly empty
    if (control.hasError('required')) {
      return 'Effective Date is required';
    }

    // Then check for invalid date format errors
    if (control.hasError('invalidDateFormat')) {
      return 'Effective date is invalid';
    }

    if (control.hasError('invalidDate')) {
      return 'Effective date is invalid';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Effective date cannot be past date';
    }

    return '';
  }

  /**
   * Get error message for Termination Date field.
   * Handles invalid date and date range validation errors.
   *
   * @param control - The termination date form control
   * @param formErrors - Optional form-level errors object
   * @returns Error message string or empty string if no errors
   *
   * Usage:
   * ```typescript
   * getTerminationDateError(): string {
   *   return DateFieldValidationUtility.getTerminationDateErrorMessage(
   *     this.form.get('terminationDate'),
   *     this.form.errors
   *   );
   * }
   * ```
   */
  static getTerminationDateErrorMessage(
    control: AbstractControl | null,
    formErrors?: ValidationErrors | null
  ): string {
    if (!control) {
      return '';
    }

    // Only check other errors if touched or dirty
    if (!(control.touched || control.dirty)) {
      return '';
    }

    // Check for invalid date format errors first
    if (control.hasError('invalidDateFormat')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('invalidDate')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('terminationDatePast')) {
      return 'Termination date cannot be past date';
    }

    if (control.hasError('matDatepickerMin')) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    if (formErrors?.['dateRangeInvalid']) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    return '';
  }

  /**
   * Setup validators for Add mode.
   * Effective Date: required, cannot be past date, enabled
   * Termination Date: optional, cannot be past date
   * Form-level: date range validation
   *
   * @param form - The form group to configure
   *
   * Usage:
   * ```typescript
   * DateFieldValidationUtility.setupAddModeValidators(this.form);
   * ```
   */
  static setupAddModeValidators(form: FormGroup, chapterOffset?: string): void {
    // Support multiple naming conventions: effectiveDate/terminationDate, effDate/termDate, effDateTime/termDateTime
    const effectiveDateControl = form.get('effectiveDate') || form.get('effDate') || form.get('effDateTime');
    const terminationDateControl = form.get('terminationDate') || form.get('termDate') || form.get('termDateTime');

    if (effectiveDateControl) {
      effectiveDateControl.clearValidators();
      effectiveDateControl.setValidators([
        Validators.required,
        dateFormatValidator(),
        this.validDateValidator(),
        this.effectiveDateNotPastValidator(chapterOffset)
      ]);
      effectiveDateControl.enable();
      effectiveDateControl.updateValueAndValidity();
    }

    if (terminationDateControl) {
      terminationDateControl.clearValidators();
      terminationDateControl.setValidators([
        dateFormatValidator(),
        this.validDateValidator(),
        this.terminationDateNotPastValidator(chapterOffset)
      ]);
      terminationDateControl.updateValueAndValidity();
    }
  }

  static setupEditModeValidators(form: FormGroup, _chapterOffset?: string): void {
    // Support multiple naming conventions: effectiveDate/terminationDate, effDate/termDate, effDateTime/termDateTime
    const effectiveDateControl = form.get('effectiveDate') || form.get('effDate') || form.get('effDateTime');
    const terminationDateControl = form.get('terminationDate') || form.get('termDate') || form.get('termDateTime');

    if (effectiveDateControl) {
      effectiveDateControl.clearValidators();
      // In edit mode, disable effective date field to prevent changes to existing records
      effectiveDateControl.disable();
      effectiveDateControl.updateValueAndValidity();
    }

    if (terminationDateControl) {
      terminationDateControl.clearValidators();
      terminationDateControl.setValidators([
        dateFormatValidator(),
        this.validDateValidator()
      ]);
      terminationDateControl.updateValueAndValidity();
    }
  }

  /**
   * Check if a date is in the past.
   *
   * @param date - Date to check (Moment or Date object)
   * @returns true if date is before today, false otherwise
   */
  static isPastDate(date: Moment | Date | null, chapterTimezone?: string): boolean {
    if (!date) return false;
    const checkDate = moment.isMoment(date) ? date : moment(date);
    const today = this.getToday(chapterTimezone);
    return checkDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD');
  }

  /**
   * Serialize date for API transmission.
   * Converts Moment or Date to YYYY-MM-DD string format to avoid timezone issues.
   *
   * When dates are sent as JavaScript Date objects, Angular's HttpClient
   * serializes them to ISO strings with timezone offsets, which can cause
   * the backend to receive a different date than selected (timezone shift issue).
   *
   * Example: User selects March 14, 2026
   * - Wrong: .toDate() → "2026-03-14T07:00:00.000Z" (shifts to previous day in PST)
   * - Right: format('YYYY-MM-DD') → "2026-03-14" (exact date selected)
   *
   * @param date - Moment or Date object
   * @returns YYYY-MM-DD formatted string or null
   *
   * Usage:
   * ```typescript
   * const dto = {
   *   effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
   *   terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
   * };
   * ```
   */
  static serializeDateForApi(date: Moment | Date | null | undefined): string | null {
    if (!date) return null;

    const momentDate = moment.isMoment(date) ? date : moment(date);
    return momentDate.format('YYYY-MM-DD');
  }

  /**
   * Check if effective date is valid (not in the past for Add mode).
   *
   * @param date - Effective date to validate
   * @param mode - 'add' or 'edit'
   * @returns true if valid, false otherwise
   */
  static isValidEffectiveDate(date: Moment | Date | null, mode: 'add' | 'edit'): boolean {
    if (!date) return false;
    if (mode === 'edit') return true; // In edit mode, existing dates are always valid
    return !this.isPastDate(date);
  }

  /**
   * Validate date range: termination >= effective.
   *
   * @param effectiveDate - Effective date
   * @param terminationDate - Termination date
   * @returns true if valid (termination is null or >= effective), false otherwise
   */
  static isValidDateRange(
    effectiveDate: Moment | Date | null,
    terminationDate: Moment | Date | null
  ): boolean {
    if (!effectiveDate || !terminationDate) return true; // Termination is optional

    const effDate = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
    const termDate = moment.isMoment(terminationDate) ? terminationDate : moment(terminationDate);

    const effDay = moment(effDate).startOf('day');
    const termDay = moment(termDate).startOf('day');

    return termDay.isSameOrAfter(effDay);
  }

  /**
   * Convenience method: Get error message for Effective Date from FormGroup.
   *
   * @param form - The FormGroup containing effectiveDate control
   * @returns Error message string or empty string if no errors
   *
   * Usage:
   * ```typescript
   * getEffectiveDateError(): string {
   *   return DateFieldValidationUtility.getEffectiveDateError(this.form);
   * }
   * ```
   */
  static getEffectiveDateError(form: FormGroup): string {
    // Support multiple naming conventions: effectiveDate, effDate, effDateTime
    const control = form.get('effectiveDate') || form.get('effDate') || form.get('effDateTime');
    return this.getEffectiveDateErrorMessage(control, form.errors);
  }

  /**
   * Convenience method: Get error message for Termination Date from FormGroup.
   *
   * @param form - The FormGroup containing terminationDate control
   * @returns Error message string or empty string if no errors
   *
   * Usage:
   * ```typescript
   * getTerminationDateError(): string {
   *   return DateFieldValidationUtility.getTerminationDateError(this.form);
   * }
   * ```
   */
  static getTerminationDateError(form: FormGroup): string {
    // Support multiple naming conventions: terminationDate, termDate, termDateTime
    const control = form.get('terminationDate') || form.get('termDate') || form.get('termDateTime');
    return this.getTerminationDateErrorMessage(control, form.errors);
  }

  /**
   * Form-group-level validator: Validates From Date / To Date range.
   * Ensures To Date >= From Date.
   *
   * Returns form-level error 'dateRangeInvalid' when validation fails.
   *
   * @param fromDateKey - The form control key for the from date (e.g., 'fromDate')
   * @param toDateKey - The form control key for the to date (e.g., 'toDate')
   * @returns ValidationErrors with key 'dateRangeInvalid' if toDate < fromDate
   *
   * Usage:
   * ```typescript
   * this.form = this.fb.group({
   *   fromDate: [null],
   *   toDate: [null]
   * }, {
   *   validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')]
   * });
   * ```
   */
  static fromToDateRangeValidator(fromDateKey: string, toDateKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) return null;

      const fromDateControl = control.get(fromDateKey);
      const toDateControl = control.get(toDateKey);

      if (!fromDateControl || !toDateControl) {
        return null;
      }

      const fromDate = fromDateControl.value;
      const toDate = toDateControl.value;

      // If either date is not set, validation passes
      if (!fromDate || !toDate) {
        return null;
      }

      // Convert to moment objects for comparison
      const fromMoment = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
      const toMoment = moment.isMoment(toDate) ? toDate : moment(toDate);

      // Normalize to day level for comparison
      const fromDay = moment(fromMoment).startOf('day');
      const toDay = moment(toMoment).startOf('day');

      // To Date must be >= From Date
      if (toDay.isBefore(fromDay)) {
        return { dateRangeInvalid: true };
      }

      return null;
    };
  }

  /**
   * Generic date error message generator for any date field.
   * Use this for custom date fields like "From Date" and "To Date" that don't
   * follow the Effective Date / Termination Date naming convention.
   *
   * @param control - Form control to check for errors
   * @param formErrors - Form-level errors (for date range validation)
   * @param fieldLabel - Label like "From Date", "To Date"
   * @param rangeErrorMessage - Custom message for date range error (optional)
   * @returns Error message string or empty string if no errors
   *
   * Usage:
   * ```typescript
   * getFromDateError(): string {
   *   return DateFieldValidationUtility.getDateErrorMessage(
   *     this.filterForm.get('fromDate'),
   *     this.filterForm.errors,
   *     'From Date'
   *   );
   * }
   *
   * getToDateError(): string {
   *   return DateFieldValidationUtility.getDateErrorMessage(
   *     this.filterForm.get('toDate'),
   *     this.filterForm.errors,
   *     'To Date',
   *     'To Date must be on or after From Date'
   *   );
   * }
   * ```
   */
  static getDateErrorMessage(
    control: AbstractControl | null,
    formErrors: ValidationErrors | null,
    fieldLabel: string,
    rangeErrorMessage?: string
  ): string {
    if (!control) {
      return '';
    }

    // Only show errors if touched or dirty
    if (!(control.touched || control.dirty)) {
      return '';
    }

    // Check for required error first
    if (control.hasError('required')) {
      return `${fieldLabel} is required`;
    }

    // Check for invalid date format errors
    if (control.hasError('invalidDateFormat') ||
        control.hasError('invalidDate') ||
        control.hasError('matDatepickerParse')) {
      return `${fieldLabel} is invalid`;
    }

    // Check for date range error (only if rangeErrorMessage is provided)
    if (formErrors?.['dateRangeInvalid'] && rangeErrorMessage) {
      return rangeErrorMessage;
    }

    return '';
  }

  /**
   * Format date for UI display in DD-MMM-YYYY format (e.g., "18-MAR-2026").
   * Provides consistent date formatting across the application.
   *
   * @param date - Moment or Date object to format
   * @returns Formatted date string in DD-MMM-YYYY format or empty string if invalid
   *
   * Usage:
   * ```typescript
   * const formattedDate = DateFieldValidationUtility.formatDateForUI(myDate);
   * // Returns: "18-MAR-2026"
   * ```
   */
  static formatDateForUI(date: Moment | Date | null | undefined): string {
    if (!date) return '';

    const momentDate = moment.isMoment(date) ? date : moment(date);

    // Check if valid date
    if (!momentDate.isValid()) {
      return '';
    }

    return momentDate.format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Formats a date as DD-MMM-YYYY  DayName (e.g., "01-JAN-2025  Monday")
   * Uses uppercase month via .toUpperCase().
   *
   * Usage:
   * ```typescript
   * const formatted = DateFieldValidationUtility.formatDateWithDay(myDate);
   * // Returns: "01-JAN-2025  Monday"
   * ```
   */
  static formatDateWithDay(date: Moment | Date | string | null | undefined): string {
    if (!date) return '';

    const momentDate = moment.isMoment(date) ? date : moment(date);

    if (!momentDate.isValid()) {
      return '';
    }

    const datePart = momentDate.format('DD-MMM-YYYY').toUpperCase();
    const dayName = momentDate.format('dddd');
    return `${datePart}  ${dayName}`;
  }

  /**
   * Formats a date+time as DD-MMM-YYYY, HH:mm (e.g., "15-JAN-2026, 14:30")
   * Uses uppercase month. 24-hour time format.
   * Use for displaying Last Modified timestamps.
   *
   * Usage:
   * ```typescript
   * const formatted = DateFieldValidationUtility.formatDateTimeForUI(myDate);
   * // Returns: "15-JAN-2026, 14:30"
   * ```
   */
  static formatDateTimeForUI(date: Moment | Date | string | null | undefined): string {
    if (!date) return '';

    const momentDate = moment.isMoment(date) ? date : moment(date);

    if (!momentDate.isValid()) {
      return '';
    }

    return momentDate.format('DD-MMM-YYYY, HH:mm').toUpperCase();
  }

  /**
   * Formats a date+time as DD-MMM-YYYY, hh:mm AM/PM (e.g., "04-APR-2026, 02:30 PM")
   * Uses uppercase month. 12-hour time format with meridiem.
   * Use for displaying timestamps in 12-hour format.
   *
   * Usage:
   * ```typescript
   * const formatted = DateFieldValidationUtility.formatDateTimeWithMeridiem(myDate);
   * // Returns: "04-APR-2026, 02:30 PM"
   * ```
   */
  static formatDateTimeWithMeridiem(date: Moment | Date | string | null | undefined): string {
    if (!date) return '';

    const momentDate = moment.isMoment(date) ? date : moment(date);

    if (!momentDate.isValid()) {
      return '';
    }

    return momentDate.format('DD-MMM-YYYY, hh:mm A').toUpperCase();
  }

  // ─── Generic Cross-Field Date Range Validation ─────────────────────

  /**
   * Generic cross-field date range validator.
   *
   * Returns form-level 'dateRangeInvalid' error when start date > end date.
   * Use with DateRangePairErrorStateMatcher on mat-form-field to show
   * mat-error based on form-level errors.
   *
   * Cross-Field Validation Rules:
   * - Start Date > End Date  → Error: { dateRangeInvalid: true }
   * - Start Date = End Date  → Valid
   * - Start Date < End Date  → Valid
   *
   * @param startDateKey - Form control name for the start/effective date
   * @param endDateKey - Form control name for the end/termination date
   * @returns ValidatorFn for use as a form-group-level validator
   *
   * Usage:
   * ```typescript
   * // Form setup with any field names:
   * this.form = this.fb.group({
   *   effectiveDate: [null, [Validators.required]],
   *   terminationDate: [null]
   * }, {
   *   validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
   * });
   *
   * // Use DateRangePairErrorStateMatcher so mat-error shows for form-level errors:
   * dateRangeErrorMatcher = new DateRangePairErrorStateMatcher(() => this.form);
   * // Then in template: [errorStateMatcher]="dateRangeErrorMatcher"
   * ```
   */
  static crossFieldDateRangeValidator(
    startDateKey: string,
    endDateKey: string
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) return null;

      const startControl = control.get(startDateKey);
      const endControl = control.get(endDateKey);

      if (!startControl || !endControl) return null;

      const startDate = startControl.value;
      const endDate = endControl.value;

      // If either date is not set, validation passes
      if (!startDate || !endDate) return null;

      const startMoment = moment.isMoment(startDate) ? startDate : moment(startDate);
      const endMoment = moment.isMoment(endDate) ? endDate : moment(endDate);

      if (!startMoment.isValid() || !endMoment.isValid()) return null;

      const startDay = startMoment.clone().startOf('day');
      const endDay = endMoment.clone().startOf('day');

      // Start Date must be <= End Date (equal is valid)
      if (startDay.isAfter(endDay)) {
        return { dateRangeInvalid: true };
      }

      return null;
    };
  }

  /**
   * Get cross-field error message for a start/effective date field.
   *
   * Handles all standard date errors (required, invalid, past date)
   * plus cross-field range error with configurable labels.
   *
   * @param control - The start date form control
   * @param startLabel - Display label for the start date (e.g., 'Effective Date', 'Start Date', 'From Date')
   * @param endLabel - Display label for the end date (e.g., 'Termination Date', 'End Date', 'To Date')
   * @param formErrors - Optional form-level errors
   * @returns Error message string or empty string
   *
   * Usage:
   * ```typescript
   * getEffectiveDateError(): string {
   *   return DateFieldValidationUtility.getStartDateCrossFieldError(
   *     this.form.get('effectiveDate'),
   *     'Effective Date',
   *     'Termination Date',
   *     this.form.errors
   *   );
   * }
   *
   * // Or with custom labels:
   * getStartDateError(): string {
   *   return DateFieldValidationUtility.getStartDateCrossFieldError(
   *     this.form.get('startDate'),
   *     'Start Date',
   *     'End Date',
   *     this.form.errors
   *   );
   * }
   * ```
   */
  static getStartDateCrossFieldError(
    control: AbstractControl | null,
    startLabel: string,
    endLabel: string,
    formErrors?: ValidationErrors | null
  ): string {
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return `${startLabel} is invalid`;
    }

    if (control.hasError('required')) {
      return `${startLabel} is required`;
    }

    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return `${startLabel} is invalid`;
    }

    if (control.hasError('effectiveDatePast')) {
      return `${startLabel} cannot be past date`;
    }

    if (formErrors?.['dateRangeInvalid']) {
      return `${startLabel} must be less than or equal to ${endLabel}`;
    }

    return '';
  }

  /**
   * Get cross-field error message for an end/termination date field.
   *
   * Handles all standard date errors (required, invalid, past date)
   * plus cross-field range error with configurable labels.
   *
   * @param control - The end date form control
   * @param endLabel - Display label for the end date (e.g., 'Termination Date', 'End Date', 'To Date')
   * @param startLabel - Display label for the start date (e.g., 'Effective Date', 'Start Date', 'From Date')
   * @param formErrors - Optional form-level errors
   * @returns Error message string or empty string
   *
   * Usage:
   * ```typescript
   * getTerminationDateError(): string {
   *   return DateFieldValidationUtility.getEndDateCrossFieldError(
   *     this.form.get('terminationDate'),
   *     'Termination Date',
   *     'Effective Date',
   *     this.form.errors
   *   );
   * }
   *
   * // Or with custom labels:
   * getEndDateError(): string {
   *   return DateFieldValidationUtility.getEndDateCrossFieldError(
   *     this.form.get('endDate'),
   *     'End Date',
   *     'Start Date',
   *     this.form.errors
   *   );
   * }
   * ```
   */
  static getEndDateCrossFieldError(
    control: AbstractControl | null,
    endLabel: string,
    startLabel: string,
    formErrors?: ValidationErrors | null
  ): string {
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return `${endLabel} is invalid`;
    }

    if (control.hasError('required')) {
      return `${endLabel} is required`;
    }

    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return `${endLabel} is invalid`;
    }

    if (control.hasError('terminationDatePast')) {
      return `${endLabel} cannot be past date`;
    }

    if (control.hasError('matDatepickerMin')) {
      return `${endLabel} must be greater than or equal to ${startLabel}`;
    }

    if (formErrors?.['dateRangeInvalid']) {
      return `${endLabel} must be greater than or equal to ${startLabel}`;
    }

    return '';
  }

  // ─── Component-Level Helpers (remove boilerplate from components) ──

  /**
   * Handle keyboard input for a required date field (e.g., Effective Date).
   * Call from the (input) event in template.
   *
   * Usage:
   * ```typescript
   * onEffectiveDateInput(event: Event): void {
   *   DateFieldValidationUtility.handleStartDateInput(
   *     (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
   *   );
   * }
   * ```
   */
  static handleStartDateInput(inputValue: string, control: AbstractControl | null): void {
    if (!control) return;
    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.markAsTouched();
      control.setErrors({ required: true });
    } else {
      control.markAsTouched();
      control.markAsDirty();
      // If input has text but control value is null, datepicker couldn't parse it
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  /**
   * Handle keyboard input for an optional date field (e.g., Termination Date).
   * Call from the (input) event in template.
   *
   * @param isEditMode - In edit mode, clearing a value keeps the form dirty
   *
   * Usage:
   * ```typescript
   * onTerminationDateInput(event: Event): void {
   *   DateFieldValidationUtility.handleEndDateInput(
   *     (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.isEditMode
   *   );
   * }
   * ```
   */
  static handleEndDateInput(inputValue: string, control: AbstractControl | null, isEditMode: boolean = false): void {
    if (!control) return;
    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      if (isEditMode) {
        control.markAsDirty();
      } else {
        control.markAsPristine();
        control.markAsUntouched();
      }
      control.updateValueAndValidity();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      // If input has text but control value is null, datepicker couldn't parse it
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  /**
   * Clear errors on an optional date field before form submission.
   * Prevents false red state on empty optional fields after markAllAsTouched().
   *
   * Usage:
   * ```typescript
   * onSubmit(): void {
   *   this.form.markAllAsTouched();
   *   DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
   *   if (this.form.invalid) return;
   *   ...
   * }
   * ```
   */
  static clearOptionalDateErrors(form: FormGroup, controlName: string): void {
    const control = form.get(controlName);
    if (control && !control.value) {
      control.markAsUntouched();
      control.markAsPristine();
      control.setErrors(null);
    }
  }

  /**
   * Create an ErrorStateMatcher that shows error state when the error message
   * function returns a non-empty string. Use this for fields that need to show
   * form-level errors (like cross-field dateRangeInvalid) via mat-error.
   *
   * Usage:
   * ```typescript
   * effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
   *   () => this.getEffectiveDateError()
   * );
   * termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
   *   () => this.getTerminationDateError()
   * );
   * ```
   */
  static createDateErrorStateMatcher(getErrorFn: () => string): ErrorStateMatcher {
    return {
      isErrorState: (control: FormControl | null): boolean => {
        if (!control) return false;
        const touchedOrDirty = control.touched || control.dirty;
        return touchedOrDirty && !!getErrorFn();
      }
    };
  }
}
