import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';
import moment from 'moment';
import { ChapterTimezoneService } from '../services/chapter-timezone.service';

/**
 * Validator to check if an array has at least one element.
 * Use this instead of Validators.required for array form controls.
 *
 * @returns ValidationErrors with key 'arrayRequired' if array is empty, null otherwise
 *
 * Usage:
 * ```typescript
 * code: [[], arrayRequiredValidator()]
 * ```
 */
export function arrayRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || !Array.isArray(value) || value.length === 0) {
      return { arrayRequired: true };
    }
    return null;
  };
}

/**
 * Field-level validator: Effective Date cannot be a past date.
 *
 * @param chapterTimezoneService - Optional ChapterTimezoneService instance for chapter-aware validation
 * @returns ValidationErrors with key 'effectiveDatePast' if date is before today, null otherwise
 *
 * Error message: "Effective Date cannot be past date."
 *
 * Usage:
 * ```typescript
 * // In component constructor/ngOnInit:
 * const chapterTimezoneService = inject(ChapterTimezoneService);
 * effectiveDate: [null, [Validators.required, effectiveDateNotPastValidator(chapterTimezoneService)]]
 *
 * // Or without service (falls back to system date):
 * effectiveDate: [null, [Validators.required, effectiveDateNotPastValidator()]]
 * ```
 */
export function effectiveDateNotPastValidator(chapterTimezoneService?: ChapterTimezoneService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null; // Let Validators.required handle empty values

    const selectedDate = moment.isMoment(value) ? value : moment(value);

    // Use chapter local date if available, otherwise fall back to system date
    const today = chapterTimezoneService && chapterTimezoneService.isChapterLocalDateAvailable()
      ? chapterTimezoneService.getChapterLocalDate()
      : moment().startOf('day');

    if (selectedDate.startOf('day').isBefore(today)) {
      return { effectiveDatePast: true };
    }

    return null;
  };
}

/**
 * Field-level validator: Termination Date cannot be a past date.
 *
 * @param chapterTimezoneService - Optional ChapterTimezoneService instance for chapter-aware validation
 * @returns ValidationErrors with key 'terminationDatePast' if date is before today, null otherwise
 *
 * Error message: "Termination Date cannot be past date."
 *
 * Usage:
 * ```typescript
 * // In component constructor/ngOnInit:
 * const chapterTimezoneService = inject(ChapterTimezoneService);
 * terminationDate: [null, [terminationDateNotPastValidator(chapterTimezoneService)]]
 *
 * // Or without service (falls back to system date):
 * terminationDate: [null, [terminationDateNotPastValidator()]]
 * ```
 */
export function terminationDateNotPastValidator(chapterTimezoneService?: ChapterTimezoneService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null; // Optional field, empty is valid

    const selectedDate = moment.isMoment(value) ? value : moment(value);

    // Use chapter local date if available, otherwise fall back to system date
    const today = chapterTimezoneService && chapterTimezoneService.isChapterLocalDateAvailable()
      ? chapterTimezoneService.getChapterLocalDate()
      : moment().startOf('day');

    if (selectedDate.startOf('day').isBefore(today)) {
      return { terminationDatePast: true };
    }

    return null;
  };
}

/**
 * Form-group-level validator: Termination Date cannot be earlier than Effective Date.
 *
 * Sets error directly on the terminationDate control for proper field-level error display.
 * Returns null at form level to keep form valid (error is on field only).
 *
 * @returns null (errors are set on terminationDate control directly)
 *
 * Error key: 'terminationBeforeEffective'
 * Error message: "Termination Date cannot be earlier than the Effective Date."
 *
 * Usage:
 * ```typescript
 * this.form = this.fb.group({
 *   effectiveDate: [null, [Validators.required]],
 *   terminationDate: [null]
 * }, {
 *   validators: [terminationAfterEffectiveValidator()]
 * });
 * ```
 *
 * Template:
 * ```html
 * <mat-error *ngIf="form.get('terminationDate')?.hasError('terminationBeforeEffective')">
 *   Termination Date cannot be earlier than the Effective Date.
 * </mat-error>
 * ```
 */
export function terminationAfterEffectiveValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const effectiveDateControl = control.get('effectiveDate');
    const terminationDateControl = control.get('terminationDate');

    if (!effectiveDateControl || !terminationDateControl) {
      return null;
    }

    const effectiveDate = effectiveDateControl.value;
    const terminationDate = terminationDateControl.value;

    // If either date is not set, clear any previous error and don't validate
    if (!effectiveDate || !terminationDate) {
      clearTerminationBeforeEffectiveError(terminationDateControl);
      return null;
    }

    // Convert to moment objects if they aren't already
    const effective = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
    const termination = moment.isMoment(terminationDate) ? terminationDate : moment(terminationDate);

    // Compare dates only (not times)
    const effectiveDay = moment(effective).startOf('day');
    const terminationDay = moment(termination).startOf('day');

    if (terminationDay.isBefore(effectiveDay)) {
      // Set error on terminationDate control
      const currentErrors = terminationDateControl.errors || {};
      terminationDateControl.setErrors(
        { ...currentErrors, terminationBeforeEffective: true }
      );
      // Return null so the form itself is NOT invalid
      return null;
    }

    // Clear the error if dates are valid
    clearTerminationBeforeEffectiveError(terminationDateControl);
    return null;
  };
}

/**
 * Helper function to clear the terminationBeforeEffective error from a control
 * while preserving other errors.
 */
function clearTerminationBeforeEffectiveError(control: AbstractControl): void {
  if (control.hasError('terminationBeforeEffective')) {
    const errors = { ...control.errors };
    delete errors['terminationBeforeEffective'];
    control.setErrors(
      Object.keys(errors).length > 0 ? errors : null
    );
  }
}

/**
 * Date range validator for form groups with effectiveDate and terminationDate.
 * Validates that termination date is on or after effective date.
 *
 * Returns form-level error 'dateRangeInvalid' when validation fails.
 *
 * @returns ValidationErrors with key 'dateRangeInvalid' if termination date is before effective date
 *
 * Usage:
 * ```typescript
 * this.form = this.fb.group({
 *   effectiveDate: [null, [Validators.required]],
 *   terminationDate: [null]
 * }, {
 *   validators: [dateRangeValidator()]
 * });
 * ```
 */
export function dateRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) return null;

    const effectiveDateControl = control.get('effectiveDate');
    const terminationDateControl = control.get('terminationDate');

    if (!effectiveDateControl || !terminationDateControl) {
      return null;
    }

    const effectiveDate = effectiveDateControl.value;
    const terminationDate = terminationDateControl.value;

    // If either date is not set, no validation needed
    if (!effectiveDate || !terminationDate) {
      return null;
    }

    // Convert to Date objects if needed
    const effDate = effectiveDate instanceof Date ? effectiveDate : new Date(effectiveDate);
    const termDate = terminationDate instanceof Date ? terminationDate : new Date(terminationDate);

    // Normalize to midnight for date-only comparison
    effDate.setHours(0, 0, 0, 0);
    termDate.setHours(0, 0, 0, 0);

    // Termination Date must be >= Effective Date
    if (termDate < effDate) {
      return { dateRangeInvalid: true };
    }

    return null;
  };
}

/**
 * Shared utility function to get error message for Effective Date field.
 * Handles required, past date, invalid date, and date range validation errors.
 *
 * @param control - The effective date form control
 * @param formErrors - Optional form-level errors object
 * @returns Error message string or empty string if no errors
 *
 * Usage:
 * ```typescript
 * getEffectiveDateError(): string {
 *   return getEffectiveDateErrorMessage(
 *     this.form.get('effectiveDate'),
 *     this.form.errors
 *   );
 * }
 * ```
 *
 * Template:
 * ```html
 * <mat-error *ngIf="getEffectiveDateError()">
 *   {{ getEffectiveDateError() }}
 * </mat-error>
 * ```
 */
export function getEffectiveDateErrorMessage(
  control: AbstractControl | null,
  formErrors?: ValidationErrors | null
): string {
  if (!control || !(control.touched || control.dirty)) {
    return '';
  }

  if (control.hasError('required')) {
    return 'Effective Date is required';
  }

  if (control.hasError('matDatepickerParse')) {
    return 'Effective Date is invalid';
  }

  if (control.hasError('effectiveDatePast')) {
    return 'Effective date cannot be past date';
  }

  if (formErrors?.['dateRangeInvalid']) {
    return 'Effective Date must be less than or equal to Termination Date';
  }

  return '';
}

/**
 * Shared utility function to get error message for Termination Date field.
 * Handles invalid date, date range validation errors, and termination before effective errors.
 *
 * @param control - The termination date form control
 * @param formErrors - Optional form-level errors object
 * @returns Error message string or empty string if no errors
 *
 * Usage:
 * ```typescript
 * getTerminationDateError(): string {
 *   return getTerminationDateErrorMessage(
 *     this.form.get('terminationDate'),
 *     this.form.errors
 *   );
 * }
 * ```
 *
 * Template:
 * ```html
 * <mat-error *ngIf="getTerminationDateError()">
 *   {{ getTerminationDateError() }}
 * </mat-error>
 * ```
 */
export function getTerminationDateErrorMessage(
  control: AbstractControl | null,
  formErrors?: ValidationErrors | null
): string {
  if (!control || !(control.touched || control.dirty)) {
    return '';
  }

  if (control.hasError('matDatepickerParse')) {
    return 'Termination Date is invalid';
  }

  if (control.hasError('terminationDatePast')) {
    return 'Termination date cannot be past date';
  }

  if (control.hasError('terminationBeforeEffective')) {
    return 'Termination Date must be greater than or equal to Effective Date';
  }

  if (formErrors?.['dateRangeInvalid']) {
    return 'Termination Date must be greater than or equal to Effective Date';
  }

  return '';
}
