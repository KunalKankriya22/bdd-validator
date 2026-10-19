import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator to check if property code is required
 * Error code: 0080
 */
export function propertyCodeRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || value.trim() === '') {
      return { propertyCodeRequired: { errorCode: '0080' } };
    }
    return null;
  };
}

/**
 * Validator to check if user is authorized for the selected property
 * This is a placeholder - actual validation happens on backend
 * Error code: 18033
 */
export function propertyAccessValidator(validProperties: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null; // Let required validator handle empty values
    }

    if (!validProperties.includes(value)) {
      return { propertyAccessDenied: { errorCode: '18033' } };
    }

    return null;
  };
}

/**
 * Validator to check if property code is valid
 * Error code: 18036
 */
export function validPropertyCodeValidator(validCodes: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    if (!validCodes.includes(value)) {
      return { invalidPropertyCode: { errorCode: '18036' } };
    }

    return null;
  };
}

/**
 * Get error message for property code field
 */
export function getPropertyCodeErrorMessage(control: AbstractControl | null): string {
  if (!control || !(control.touched || control.dirty)) {
    return '';
  }

  if (control.hasError('required') || control.hasError('propertyCodeRequired')) {
    return 'Property code is required';
  }

  if (control.hasError('propertyAccessDenied')) {
    return 'User not authorized for this property';
  }

  if (control.hasError('invalidPropertyCode')) {
    return 'Invalid property code';
  }

  return '';
}

/**
 * Get error message for effective date field
 * Error codes: 11012 (required), 8044 (past date)
 */
export function getEffectiveDateErrorMessage(control: AbstractControl | null): string {
  if (!control || !(control.touched || control.dirty)) {
    return '';
  }

  if (control.hasError('required')) {
    return 'Effective Date cannot be null';
  }

  if (control.hasError('matDatepickerParse')) {
    return 'Invalid date format. Use DD-MMM-YYYY';
  }

  if (control.hasError('effectiveDatePast')) {
    return 'Effective Date cannot be before today';
  }

  return '';
}

/**
 * Get error message for termination date field
 * Error codes: 3115 (past date), 8052 (before effective date)
 */
export function getTerminationDateErrorMessage(control: AbstractControl | null): string {
  if (!control || !(control.touched || control.dirty)) {
    return '';
  }

  if (control.hasError('matDatepickerParse')) {
    return 'Invalid date format. Use DD-MMM-YYYY';
  }

  if (control.hasError('terminationDatePast')) {
    return 'Termination Date cannot be before current date';
  }

  if (control.hasError('terminationBeforeEffective')) {
    return 'Termination date cannot be before effective date';
  }

  return '';
}
