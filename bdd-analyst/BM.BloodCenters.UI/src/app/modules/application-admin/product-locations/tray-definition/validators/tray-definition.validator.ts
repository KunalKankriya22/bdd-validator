import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator to ensure Tray Number contains only alphanumeric characters
 * Max 4 characters
 */
export function trayNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const value = control.value.toString().trim();

    // Max 4 characters
    if (value.length > 4) {
      return { trayNumberMaxLength: true };
    }

    // Alphanumeric only
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(value)) {
      return { trayNumberInvalid: true };
    }

    return null;
  };
}

/**
 * Validator to ensure Item Count is within valid range (0-9999)
 */
export function itemCountValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null; // Allow empty/null values
    }

    const value = parseInt(control.value, 10);

    if (isNaN(value)) {
      return { itemCountInvalid: true };
    }

    if (value < 0) {
      return { itemCountMin: true };
    }

    if (value > 9999) {
      return { itemCountMax: true };
    }

    return null;
  };
}

/**
 * Validator to ensure Effective Date is not in the past (for create mode only)
 * This validator uses moment.js and chapter timezone service
 */
export function effectiveDateNotPastForCreateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { dateInPast: true };
    }

    return null;
  };
}

/**
 * Form-group-level validator: Termination Date must be >= Effective Date
 * Sets error on terminationDate control for proper field-level display
 */
export function terminationAfterEffectiveTrayValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const effectiveDateControl = formGroup.get('effectiveDate');
    const terminationDateControl = formGroup.get('terminationDate');

    if (!effectiveDateControl || !terminationDateControl) {
      return null;
    }

    const effectiveDate = effectiveDateControl.value;
    const terminationDate = terminationDateControl.value;

    // If either date is not set, clear error and skip validation
    if (!effectiveDate || !terminationDate) {
      clearTerminationBeforeEffectiveError(terminationDateControl);
      return null;
    }

    const effective = new Date(effectiveDate);
    const termination = new Date(terminationDate);

    // Normalize to midnight for date-only comparison
    effective.setHours(0, 0, 0, 0);
    termination.setHours(0, 0, 0, 0);

    if (termination < effective) {
      // Set error on terminationDate control
      const currentErrors = terminationDateControl.errors || {};
      terminationDateControl.setErrors(
        { ...currentErrors, terminationBeforeEffective: true }
      );
      return null; // Return null so form itself is not invalid
    }

    // Clear the error if dates are valid
    clearTerminationBeforeEffectiveError(terminationDateControl);
    return null;
  };
}

/**
 * Helper function to clear terminationBeforeEffective error
 * while preserving other errors
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
