import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validators for HH Response Groups form
 * Based on MLT-10388 specifications
 */
export class HhResponseGroupsValidators {

  /**
   * Validates that Response Code is Y, N, or U
   * Error Code: 16046
   */
  static responseCode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Required validator handles empty values
      }

      const validCodes = ['Y', 'N', 'U'];
      const value = control.value.toString().toUpperCase();

      if (!validCodes.includes(value)) {
        return {
          invalidResponseCode: {
            errorCode: '16046',
            message: 'Invalid response code (must be Y, N, or U)'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates that Group Code contains only alphanumeric characters (A-Z, 0-9)
   * Error Code: 9740
   */
  static alphanumericOnly(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const alphanumericPattern = /^[A-Z0-9]+$/i;

      if (!alphanumericPattern.test(control.value)) {
        return {
          invalidCharacters: {
            errorCode: '9740',
            message: 'Invalid characters in group code (only alphanumeric allowed)'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates that date is not in the past
   * Error Codes: 5015 (Effective Date), 3115 (Termination Date)
   */
  static notInPast(errorCode: '5015' | '3115', fieldName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      if (inputDate < today) {
        return {
          dateInPast: {
            errorCode,
            message: `${fieldName} is in the past`
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates that Termination Date is on or after Effective Date
   * Error Code: 5004
   */
  static terminationAfterEffective(effDateFieldName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Optional field
      }

      const formGroup = control.parent;
      if (!formGroup) {
        return null;
      }

      const effDateControl = formGroup.get(effDateFieldName);
      if (!effDateControl || !effDateControl.value) {
        return {
          effectiveDateRequired: {
            errorCode: '5002',
            message: 'Effective date is required'
          }
        };
      }

      const effDate = new Date(effDateControl.value);
      const termDate = new Date(control.value);

      // Reset time parts for date-only comparison
      effDate.setHours(0, 0, 0, 0);
      termDate.setHours(0, 0, 0, 0);

      if (termDate < effDate) {
        return {
          terminationBeforeEffective: {
            errorCode: '5004',
            message: 'Termination date is before effective date'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates max length for Group Description
   * Max: 240 characters
   */
  static maxLength(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      if (control.value.length > maxLength) {
        return {
          maxLengthExceeded: {
            message: `Maximum length is ${maxLength} characters`,
            actualLength: control.value.length,
            maxLength
          }
        };
      }

      return null;
    };
  }

  /**
   * Required field validator with custom error code
   * Error Code: 0080
   */
  static requiredField(fieldName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || (typeof control.value === 'string' && control.value.trim() === '')) {
        return {
          requiredField: {
            errorCode: '0080',
            message: `${fieldName} is required`
          }
        };
      }

      return null;
    };
  }
}
