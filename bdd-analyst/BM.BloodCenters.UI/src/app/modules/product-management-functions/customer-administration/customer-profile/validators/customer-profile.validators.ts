import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import moment, { Moment } from 'moment';

/**
 * Custom Validators for Customer Profile
 * JIRA: MLT-14094
 */

const OFFSET_REGEX = /^[+-]\d{2}:\d{2}$/;

function getChapterToday(chapterTimeZone?: string): Moment {
  if (chapterTimeZone && OFFSET_REGEX.test(chapterTimeZone)) {
    const sign = chapterTimeZone[0] === '+' ? 1 : -1;
    const [hh, mm] = chapterTimeZone.slice(1).split(':').map(Number);
    const nowUtc = new Date();
    const chapterMs = nowUtc.getTime() + sign * (hh * 60 + mm) * 60000;
    const chapterDate = new Date(chapterMs);
    return moment([chapterDate.getUTCFullYear(), chapterDate.getUTCMonth(), chapterDate.getUTCDate()]);
  }
  return moment().startOf('day');
}

/**
 * Validator: Effective date cannot be in the past (for create mode only)
 * Error Code: 5015
 */
export function effectiveDateNotPastValidator(chapterTimeZone?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Required validator handles empty values
    }

    const inputDate = moment(control.value).startOf('day');
    const today = getChapterToday(chapterTimeZone);

    if (inputDate.isBefore(today)) {
      return { effectiveDateInPast: { message: 'Effective date cannot be in past', errorCode: '5015' } };
    }

    return null;
  };
}

/**
 * Validator: Termination date must be >= Effective date
 * Error Code: 5004
 * Applied at form group level
 */
export function terminationAfterEffectiveValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const effDateControl = formGroup.get('effDate');
    const termDateControl = formGroup.get('termDate');

    if (!effDateControl || !termDateControl || !termDateControl.value) {
      return null;
    }

    const effDate = moment(effDateControl.value).startOf('day');
    const termDate = moment(termDateControl.value).startOf('day');

    if (termDate.isBefore(effDate)) {
      return {
        terminationBeforeEffective: {
          message: 'Termination date must be on or after Effective date',
          errorCode: '5004'
        }
      };
    }

    return null;
  };
}

/**
 * Validator: Termination date cannot be in the past
 * Error Code: 3115
 */
export function terminationDateNotPastValidator(chapterTimeZone?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const inputDate = moment(control.value).startOf('day');
    const today = getChapterToday(chapterTimeZone);

    if (inputDate.isBefore(today)) {
      return { terminationDateInPast: { message: 'Termination date cannot be in past', errorCode: '3115' } };
    }

    return null;
  };
}

/**
 * Validator: Y/N flag values
 * Error Code: 0318
 */
export function ynFlagValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = control.value.toUpperCase();
    if (value !== 'Y' && value !== 'N') {
      return { invalidYNFlag: { message: "A 'Y' or 'N' must be entered", errorCode: '0318' } };
    }

    return null;
  };
}

/**
 * Validator: Return Accepted Flag values (Y/N/Q)
 * Error Code: 7201
 */
export function returnAcceptedFlagValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = control.value.toUpperCase();
    if (value !== 'Y' && value !== 'N' && value !== 'Q') {
      return { invalidReturnAcceptedFlag: { message: 'Invalid return accepted flag value', errorCode: '7201' } };
    }

    return null;
  };
}

/**
 * Validator: Numeric-only field (for FiPriceSchNo)
 * Error Code: 0241
 */
export function numericOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const numericPattern = /^[0-9]+$/;
    if (!numericPattern.test(control.value)) {
      return { invalidNumber: { message: 'Invalid price schedule number', errorCode: '0241' } };
    }

    return null;
  };
}

/**
 * Validator: State required when intFlag is not 'Y'
 * Conditional validator
 */
export function stateRequiredWhenDomesticValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const intFlagControl = formGroup.get('intFlag');
    const stateControl = formGroup.get('state');

    if (!intFlagControl || !stateControl) {
      return null;
    }

    const intFlag = intFlagControl.value;
    const state = stateControl.value;

    // State is required when intFlag is not 'Y'
    if (intFlag !== 'Y' && !state) {
      return {
        stateRequiredForDomestic: {
          message: 'State is required for domestic addresses',
          errorCode: 'CUSTOM'
        }
      };
    }

    return null;
  };
}

/**
 * Phone/fax number validator matching FMB check_numbers procedure.
 * Strips hyphens/spaces, checks digits-only, validates length is 7/8/10/12.
 * Errors: 0220 (non-numeric), 0323 (invalid length).
 */
export function phoneNumberValidator(): ValidatorFn {
  const VALID_LENGTHS = [7, 8, 10, 12];
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const stripped = control.value.replace(/[-\s\(\)\+]/g, '');

    if (/\D/.test(stripped)) {
      return { invalidPhoneNumber: { message: 'Invalid number' } };
    }

    if (stripped.length > 0 && !VALID_LENGTHS.includes(stripped.length)) {
      return { invalidPhoneNumber: { message: 'Invalid length' } };
    }

    return null;
  };
}

export const DOMESTIC_ZIP_MAX_LENGTH = 15;
export const INTERNATIONAL_ZIP_MAX_LENGTH = 15;
export const DOMESTIC_ZIP_PATTERN = /^[0-9]*$/;
export const INTERNATIONAL_ZIP_PATTERN = /^[a-zA-Z0-9]*$/;

export function applyZipValidators(zipControl: AbstractControl | null, isInternational: boolean): void {
  if (!zipControl) return;
  if (isInternational) {
    zipControl.setValidators([
      Validators.required,
      Validators.maxLength(INTERNATIONAL_ZIP_MAX_LENGTH),
      Validators.pattern(INTERNATIONAL_ZIP_PATTERN)
    ]);
  } else {
    zipControl.setValidators([
      Validators.required,
      Validators.maxLength(DOMESTIC_ZIP_MAX_LENGTH),
      Validators.pattern(DOMESTIC_ZIP_PATTERN)
    ]);
  }
  zipControl.updateValueAndValidity();
}

/**
 * Alphabetic-only validator matching FMB validate_character procedure.
 * Allows: A-Z, a-z, spaces, and periods.
 */
export function alphabeticOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    if (/[^A-Za-z\s.]/.test(control.value)) {
      return { alphabeticOnly: { message: 'Only letters, spaces and periods allowed' } };
    }

    return null;
  };
}
