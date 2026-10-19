import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator to ensure Code Type contains only alphanumeric characters (A-Z, 0-9)
 */
export function alphanumericValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    const isValid = alphanumericRegex.test(control.value);

    return isValid ? null : { alphanumeric: true };
  };
}

/**
 * Validator to ensure Termination Date is on or after Effective Date
*/
export function terminationAfterEffectiveValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const effectiveDateControl = formGroup.get('effectiveDate');
    const terminationDateControl = formGroup.get('terminationDate');

    const effectiveDate = effectiveDateControl?.value;
    const terminationDate = terminationDateControl?.value;

    if (!effectiveDate || !terminationDate) {
      if (terminationDateControl?.hasError('terminationBeforeEffective')) {
        terminationDateControl.setErrors(null);
      }
      return null;
    }

    const effectiveTime = effectiveDate instanceof Date
      ? effectiveDate.getTime()
      : effectiveDate.valueOf();

    const terminationTime = terminationDate instanceof Date
      ? terminationDate.getTime()
      : terminationDate.valueOf();

    if (terminationTime < effectiveTime) {
      terminationDateControl?.setErrors({ terminationBeforeEffective: true });
      return { terminationBeforeEffective: true };
    }
    if (terminationDateControl?.hasError('terminationBeforeEffective')) {
      terminationDateControl.setErrors(null);
    }

    return null;
  };
}

/**
 * Validator to check max length after trimming whitespace
 */
export function trimmedMaxLengthValidator(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const trimmedLength = control.value.trim().length;
    return trimmedLength > maxLength
      ? { trimmedMaxLength: { maxLength, actualLength: trimmedLength } }
      : null;
  };
}

/**
 * Validator to check if value is not empty after trimming
 */
export function trimmedRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || control.value.trim().length === 0) {
      return { trimmedRequired: true };
    }
    return null;
  };
}