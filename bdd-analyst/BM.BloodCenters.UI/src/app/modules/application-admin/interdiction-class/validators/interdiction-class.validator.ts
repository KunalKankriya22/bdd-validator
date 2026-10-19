import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Re-export shared date validators for backward compatibility
export {
  terminationAfterEffectiveValidator,
  effectiveDateNotPastValidator,
} from '@shared/validators/date.validators';

/**
 * Validator to check if a field is required after trimming whitespace
 */
export function trimmedRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || typeof value !== 'string') {
      return { trimmedRequired: true };
    }
    return value.trim().length === 0 ? { trimmedRequired: true } : null;
  };
}

/**
 * Validator to check maximum length after trimming whitespace
 */
export function trimmedMaxLengthValidator(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || typeof value !== 'string') {
      return null;
    }
    return value.trim().length > maxLength ? { trimmedMaxLength: { maxLength, actualLength: value.trim().length } } : null;
  };
}