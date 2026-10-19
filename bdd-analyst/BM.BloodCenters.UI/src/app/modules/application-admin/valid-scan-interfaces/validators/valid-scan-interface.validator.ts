import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Re-export shared date validators for backward compatibility
export {
  terminationAfterEffectiveValidator,
  effectiveDateNotPastValidator,
} from '@shared/validators/date.validators';

/**
 * Validator to ensure positive integer values
 */
export function positiveIntegerValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null; // Don't validate empty values (use required validator for that)
    }

    const numValue = Number(value);

    if (!Number.isInteger(numValue) || numValue <= 0) {
      return { positiveInteger: true };
    }

    return null;
  };
}

/**
 * Validator to ensure value is within a specific range
 */
export function rangeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numValue = Number(value);

    if (numValue < min || numValue > max) {
      return { range: { min, max, actual: numValue } };
    }

    return null;
  };
}
