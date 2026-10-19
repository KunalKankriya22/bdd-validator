import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator: Tax ID must be numeric only (9 digits)
 * Error code: 5153
 */
export function taxIdNumericValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null; // Optional field

    const numericPattern = /^[0-9]{1,9}$/;
    if (!numericPattern.test(value)) {
      return { taxIdNotNumeric: true };
    }
    return null;
  };
}

/**
 * Validator: Barcode protocol must be valid from MASTER_CODES
 * Error code: 5154
 */
export function barcodeProtocolValidator(validProtocols: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return { required: true };

    if (!validProtocols.includes(value)) {
      return { invalidBarcodeProtocol: true };
    }
    return null;
  };
}

/**
 * Validator: Unit ID pattern validation based on barcode protocol
 * - For protocol '8': must be '=' or '&'
 * - For other protocols: must be null/empty
 * Error codes: 5155, 5156
 */
export function unitIdPatternValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const formGroup = control.parent;
    if (!formGroup) return null;

    const barcodeProtocol = formGroup.get('barCodeProtocol')?.value;
    const unitIdPattern = control.value;

    if (barcodeProtocol === '8') {
      // For protocol 8, pattern must be '=' or '&'
      if (!unitIdPattern) {
        return { unitIdPatternRequired: true };
      }
      if (unitIdPattern !== '=' && unitIdPattern !== '&') {
        return { invalidUnitIdPattern: true };
      }
    } else {
      // For other protocols, pattern must be null/empty
      if (unitIdPattern) {
        return { unitIdPatternNotAllowed: true };
      }
    }

    return null;
  };
}

/**
 * Validator: EDI input indicator must be 'Y' or null
 * Error code: 5157
 */
export function ediInputValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === '' || value === 'Y') {
      return null;
    }
    return { invalidEdiInput: true };
  };
}

/**
 * Validator: Result output indicator must be 'R', 'B', or 'E'
 * Error code: 5158
 */
export function resultOutputValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return { required: true };

    if (value !== 'R' && value !== 'B' && value !== 'E') {
      return { invalidResultOutput: true };
    }
    return null;
  };
}

/**
 * Validator: Confirm test flag must be 'Y' or null
 * Error code: 5159
 */
export function confirmTestFlagValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === '' || value === 'Y') {
      return null;
    }
    return { invalidConfirmTestFlag: true };
  };
}

/**
 * Validator: State code required for domestic addresses (intFlag != 'Y')
 * Error code: 5008
 */
export function stateRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const formGroup = control.parent;
    if (!formGroup) return null;

    const intFlag = formGroup.get('intFlag')?.value;
    const stateCode = control.value;

    // State required only if NOT international
    if (intFlag !== 'Y' && !stateCode) {
      return { stateRequired: true };
    }

    return null;
  };
}

/**
 * Validator: Stop label flag must be 'Y' or 'N'
 * Error code: 5164
 */
export function stopLabelFlagValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return { required: true };

    if (value !== 'Y' && value !== 'N') {
      return { invalidStopLabelFlag: true };
    }
    return null;
  };
}

/**
 * Validator: Contact type must be 'C' or 'I'
 * Error code: 5161
 */
export function contactTypeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return { required: true };

    if (value !== 'C' && value !== 'I') {
      return { invalidContactType: true };
    }
    return null;
  };
}

/**
 * Validator: Phone number format (999-999-9999)
 */
export function phoneNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null; // Optional field

    const phonePattern = /^\d{3}-\d{3}-\d{4}$/;
    if (!phonePattern.test(value)) {
      return { invalidPhoneNumber: true };
    }
    return null;
  };
}

/**
 * Validator: Duplicate test ID checker
 * Error code: 5163
 * @param existingTestIds - Array of already selected test IDs
 * @param currentTestId - Current test ID being validated (for edit mode)
 */
export function duplicateTestIdValidator(existingTestIds: string[], currentTestId?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    // In edit mode, allow the current test ID
    if (currentTestId && value === currentTestId) {
      return null;
    }

    // Check if test ID already exists
    if (existingTestIds.includes(value)) {
      return { duplicateTestId: true };
    }

    return null;
  };
}
