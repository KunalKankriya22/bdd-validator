import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';
import moment from 'moment';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

/**
 * Custom validators for Valid Collection Facilities form
 * Based on API documentation error codes and business rules
 */

/**
 * Validates that Collection ID (collId) is exactly 5 characters and NOT all numeric
 * Error Code: 9712 - Collection ID must not be all numeric
 *
 * @returns ValidationErrors | null
 */
export function collIdValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toString() || '';

    // Allow empty values (required validator handles that)
    if (!value) {
      return null;
    }

    // Must be exactly 5 characters
    if (value.length !== 5) {
      return { collIdLength: { requiredLength: 5, actualLength: value.length } };
    }

    // Cannot be all numeric (error code 9712)
    const isAllNumeric = /^\d+$/.test(value);
    if (isAllNumeric) {
      return { collIdAllNumeric: { message: 'Collection ID must not be all numeric' } };
    }

    return null;
  };
}

/**
 * Validates that Effective Date is not in the past (for new records)
 * Error Code: 8044 - Effective date cannot be in the past
 *
 * GAP FIX: Now uses ChapterTimezoneService to get chapter local date instead of browser local date
 * GAP FIX: Added isEditMode parameter to skip validation for updates (legacy Oracle Forms behavior)
 *
 * @param chapterTimezoneService - Optional ChapterTimezoneService for chapter-aware date validation
 * @param isEditMode - Signal or function that returns true when editing existing record
 * @returns ValidationErrors | null
 */
export function effectiveDateValidator(
  chapterTimezoneService?: ChapterTimezoneService,
  isEditMode?: () => boolean
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow empty values (required validator handles that)
    if (!value) {
      return null;
    }

    // GAP FIX: Skip past date validation for updates (legacy behavior)
    if (isEditMode && isEditMode()) {
      return null;
    }

    // GAP FIX: Use chapter local date if available, otherwise fall back to browser local date
    const today = chapterTimezoneService && chapterTimezoneService.isChapterLocalDateAvailable()
      ? chapterTimezoneService.getChapterLocalDate()
      : moment().startOf('day');

    const effectiveDate = moment(value).startOf('day');

    // Check if date is in the past
    if (effectiveDate.isBefore(today)) {
      return { dateInPast: { message: 'Effective Date cannot be earlier than today.' } };
    }

    return null;
  };
}

/**
 * Form group validator that checks Termination Date is >= Effective Date
 * Error Code: 8045 - Term date must be >= effective date
 *
 * @returns ValidationErrors | null
 */
export function terminationAfterEffectiveValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const form = formGroup as FormGroup;
    const effDateControl = form.get('effDate');
    const termDateControl = form.get('termDate');

    if (!effDateControl || !termDateControl) {
      return null;
    }

    const effDate = effDateControl.value;
    const termDate = termDateControl.value;

    // If either date is null/empty, no validation needed
    if (!effDate || !termDate) {
      return null;
    }

    const effectiveMoment = moment(effDate).startOf('day');
    const terminationMoment = moment(termDate).startOf('day');

    // Termination Date must be on or after Effective Date
    if (terminationMoment.isBefore(effectiveMoment)) {
      return { terminationBeforeEffective: { message: 'Termination Date must be on or after Effective Date' } };
    }

    return null;
  };
}

/**
 * Validates Collection Name length, matching legacy pipe-character bypass.
 * When a pipe '|' is present, the 100-char limit is NOT enforced (DB column is 101).
 * Error Code: 0109 - Field length exceeds maximum (100 characters)
 */
export function collNameMaxLengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toString() || '';
    if (!value) return null;

    if (value.includes('|')) {
      return value.length > 101
        ? { maxlength: { requiredLength: 101, actualLength: value.length } }
        : null;
    }

    return value.length > 100
      ? { maxlength: { requiredLength: 100, actualLength: value.length, message: 'Cannot exceed 100 characters' } }
      : null;
  };
}

/**
 * Validates field does not exceed maximum character length
 * Error Code: 0109 - Field length exceeds maximum (100 characters)
 *
 * @param maxLength Maximum allowed length
 * @returns ValidationErrors | null
 */
export function maxLengthValidatorWithMessage(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toString() || '';

    if (!value) {
      return null;
    }

    if (value.length > maxLength) {
      return {
        maxlength: {
          requiredLength: maxLength,
          actualLength: value.length,
          message: `Cannot exceed ${maxLength} characters`
        }
      };
    }

    return null;
  };
}

/**
 * Validates that a contract exists and is active
 * Note: This would typically call an API to verify, but for now it's a placeholder
 * Error Code: 1147 - Contract not found or is inactive
 *
 * @returns ValidationErrors | null
 */
export function contractIdValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toString() || '';

    // Allow empty values (required validator handles that)
    if (!value) {
      return null;
    }

    // Max 9 characters
    if (value.length > 9) {
      return { maxlength: { requiredLength: 9, actualLength: value.length } };
    }

    // TODO: Add async validation to check if contract exists and is active via API
    // For now, just basic format validation
    return null;
  };
}

/**
 * Validates that state code exists in MASTER_CODES
 * Error Code: 5008 - Invalid state code
 *
 * Note: This is a placeholder. Actual validation should check against master codes lookup
 *
 * @returns ValidationErrors | null
 */
export function stateCodeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toString() || '';

    // Allow empty values (required validator handles that)
    if (!value) {
      return null;
    }

    // Max 5 characters
    if (value.length > 5) {
      return { maxlength: { requiredLength: 5, actualLength: value.length } };
    }

    // TODO: Add validation against MASTER_CODES lookup
    // This should be done via async validator calling the states lookup API
    return null;
  };
}

/**
 * Validates phone number format (allows various formats)
 *
 * @returns ValidationErrors | null
 */
export function phoneNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toString() || '';

    // Allow empty values
    if (!value) {
      return null;
    }

    // Basic phone number validation (allows digits, spaces, dashes, parentheses, plus sign)
    const phonePattern = /^[\d\s\-\(\)\+]+$/;

    if (!phonePattern.test(value)) {
      return { invalidPhoneNumber: { message: 'Invalid phone number format' } };
    }

    return null;
  };
}

/**
 * Validates ZIP/Postal code format
 *
 * @returns ValidationErrors | null
 */
export function zipCodeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toString() || '';

    // Allow empty values
    if (!value) {
      return null;
    }

    // Max 15 characters (supports international postal codes)
    if (value.length > 15) {
      return { maxlength: { requiredLength: 15, actualLength: value.length } };
    }

    return null;
  };
}
