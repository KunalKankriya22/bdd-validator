import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

/**
 * Validator for time format in HH.MM where minutes (decimal portion) must be <= 0.59
 * Implements the CHECK_MINUTES() function from Oracle Forms (vcryomth_fmb.xml)
 *
 * @returns ValidatorFn that checks if decimal portion (minutes) is valid
 *
 * @example
 * ```typescript
 * const control = new FormControl('', [timeFormatValidator()]);
 * control.setValue(2.30); // Valid - 2 hours 30 minutes
 * control.setValue(2.65); // Invalid - minutes > 59
 * ```
 */
export function timeFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined/empty - use with Validators.required if mandatory
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numValue = Number(value);

    // Check if it's a valid number
    if (isNaN(numValue)) {
      return null; // Let other validators handle non-numeric
    }

    // Extract decimal portion (minutes)
    // Round to 2 decimal places to avoid floating point precision issues
    const decimalPortion = Math.round((numValue - Math.floor(numValue)) * 100) / 100;

    // Check if decimal portion (minutes) is valid (0.00 to 0.59)
    // Oracle Forms CHECK_MINUTES function: hrs_and_min - floor(hrs_and_min) > 0.59
    if (decimalPortion > 0.59) {
      return {
        invalidTimeFormat: {
          actual: numValue,
          message: 'Invalid time format. Minutes must be 0-59 (e.g., 2.30 = 2 hours 30 minutes)'
        }
      };
    }

    return null;
  };
}

/**
 * Form-level validator for temperature range validation
 * Validates that minTemp <= maxTemp
 * Implements Oracle Forms WHEN-VALIDATE-RECORD trigger (Error 5230)
 *
 * @returns ValidatorFn that checks MIN_TEMP <= MAX_TEMP
 *
 * @example
 * ```typescript
 * this.form = this.fb.group({
 *   minTemp: [''],
 *   maxTemp: ['']
 * }, {
 *   validators: [temperatureRangeValidator()]
 * });
 * ```
 */
export function temperatureRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const minControl = control.get('minTemp');
    const maxControl = control.get('maxTemp');

    if (!minControl || !maxControl) {
      return null;
    }

    const minValue = minControl.value;
    const maxValue = maxControl.value;

    // If either value is not set, validation passes
    if (minValue === null || minValue === undefined || minValue === '' ||
        maxValue === null || maxValue === undefined || maxValue === '') {
      return null;
    }

    const minNum = Number(minValue);
    const maxNum = Number(maxValue);

    if (isNaN(minNum) || isNaN(maxNum)) {
      return null; // Let other validators handle non-numeric
    }

    // MIN_TEMP must be <= MAX_TEMP
    if (minNum > maxNum) {
      return { tempRangeInvalid: true };
    }

    return null;
  };
}

/**
 * Form-level validator for worksheet freeze time range validation
 * Validates that minWsFreezeTime <= maxWsFreezeTime
 * Implements Oracle Forms WHEN-VALIDATE-RECORD trigger (Error 5290)
 *
 * @returns ValidatorFn that checks MIN_WS_FREEZE_TIME <= MAX_WS_FREEZE_TIME
 *
 * @example
 * ```typescript
 * this.form = this.fb.group({
 *   minWsFreezeTime: [''],
 *   maxWsFreezeTime: ['']
 * }, {
 *   validators: [worksheetFreezeTimeRangeValidator()]
 * });
 * ```
 */
export function worksheetFreezeTimeRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const minControl = control.get('minWsFreezeTime');
    const maxControl = control.get('maxWsFreezeTime');

    if (!minControl || !maxControl) {
      return null;
    }

    const minValue = minControl.value;
    const maxValue = maxControl.value;

    // If either value is not set, validation passes
    if (minValue === null || minValue === undefined || minValue === '' ||
        maxValue === null || maxValue === undefined || maxValue === '') {
      return null;
    }

    const minNum = Number(minValue);
    const maxNum = Number(maxValue);

    if (isNaN(minNum) || isNaN(maxNum)) {
      return null; // Let other validators handle non-numeric
    }

    // MIN_WS_FREEZE_TIME must be <= MAX_WS_FREEZE_TIME
    if (minNum > maxNum) {
      return { worksheetTimeRangeInvalid: true };
    }

    return null;
  };
}

/**
 * Form-level validator for separation freeze time range validation
 * Validates that minSepFreezeTime <= maxSepFreezeTime
 * Implements Oracle Forms WHEN-VALIDATE-RECORD trigger (Error 5291)
 *
 * @returns ValidatorFn that checks MIN_SEP_FREEZE_TIME <= MAX_SEP_FREEZE_TIME
 *
 * @example
 * ```typescript
 * this.form = this.fb.group({
 *   minSepFreezeTime: [''],
 *   maxSepFreezeTime: ['']
 * }, {
 *   validators: [separationFreezeTimeRangeValidator()]
 * });
 * ```
 */
export function separationFreezeTimeRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const minControl = control.get('minSepFreezeTime');
    const maxControl = control.get('maxSepFreezeTime');

    if (!minControl || !maxControl) {
      return null;
    }

    const minValue = minControl.value;
    const maxValue = maxControl.value;

    // If either value is not set, validation passes
    if (minValue === null || minValue === undefined || minValue === '' ||
        maxValue === null || maxValue === undefined || maxValue === '') {
      return null;
    }

    const minNum = Number(minValue);
    const maxNum = Number(maxValue);

    if (isNaN(minNum) || isNaN(maxNum)) {
      return null; // Let other validators handle non-numeric
    }

    // MIN_SEP_FREEZE_TIME must be <= MAX_SEP_FREEZE_TIME
    if (minNum > maxNum) {
      return { separationTimeRangeInvalid: true };
    }

    return null;
  };
}
