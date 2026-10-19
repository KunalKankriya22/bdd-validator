import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';
import { CodabarScheme } from '@shared/enums/codabar-scheme.enum';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment from 'moment';

//institutionName: required, max length 50
export function institutionNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return { required: true };

    // Reject empty or whitespace-only values
    if (!value.trim()) {
      return { required: true };
    }

    // Reject '0', '00', '000', etc. and trimmed '0'
    if (value.trim() === '0' || /^0+$/.test(value.trim())) {
      return { zeroValue: true };
    }

    // Allow only letters, numbers, spaces, and pipe (|) for line splitting
    if (!/^[A-Za-z0-9\s|]+$/.test(value)) {
      return { specialChars: true };
    }

    if (value.length > 50) {
      return { maxLength: { requiredLength: 50, actualLength: value.length } };
    }
    if (value.length > 40 && !value.includes('|')) {
      return { pipeRule: true };
    }

    return null;
  };
}
// Validator for facilityShortName: required, max length 50
export function shortNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return { required: true };

    // Reject '0', '00', '000', etc. and trimmed '0'
    if (value.trim() === '0' || /^0+$/.test(value.trim())) {
      return { zeroValue: true };
    }

    // Only allow letters, numbers, and spaces
    if (!/^[A-Za-z0-9\s]+$/.test(value)) {
      return { specialChars: true };
    }

    if (value.length > 50) {
      return { maxLength: { requiredLength: 50, actualLength: value.length } };
    }

    return null;
  };
}

//printHeader: required, max length 50
export function printHeaderValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return { required: true };

    // Reject empty or whitespace-only values
    if (!value.trim()) {
      return { required: true };
    }

    // Reject '0', '00', '000', etc. and trimmed '0'
    if (value.trim() === '0' || /^0+$/.test(value.trim())) {
      return { zeroValue: true };
    }

    // Only allow letters, numbers, and spaces (no special characters)
    if (!/^[A-Za-z0-9\s]+$/.test(value)) {
      return { specialChars: true };
    }

    if (value.length > 50) {
      return { maxLength: { requiredLength: 50, actualLength: value.length } };
    }

    return null;
  };
}

// Validator for systemName: required, max length 50
export function systemNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return { required: true };

    // Reject empty or whitespace-only values
    if (!value.trim()) {
      return { required: true };
    }

    // Reject '0', '00', '000', etc. and trimmed '0'
    if (value.trim() === '0' || /^0+$/.test(value.trim())) {
      return { zeroValue: true };
    }

    // Only allow letters, numbers, and spaces (no special characters)
    if (!/^[A-Za-z0-9\s]+$/.test(value)) {
      return { specialChars: true };
    }

    if (value.length > 50) {
      return { maxlength: { requiredLength: 50, actualLength: value.length } };
    }

    return null;
  };
}

// Validator for contractPrefix: required, alphabetic characters and spaces only, max length 3
export function contractPrefixValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return { required: true };

    if (!/^[A-Za-z]{3}$/.test(value)) {
      return { invalidContractPrefix: true };
    }

    return null;
  };
}

//validation for city: required, max length 20, alphabetic only
export function cityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return { required: true };

    if (!/^[A-Za-z\s]+$/.test(value)) {
      return { alphabeticOnly: true };
    }

    if (value.length > 75) {
      return { maxlength: { requiredLength: 75, actualLength: value.length } };
    }

    return null;
  };
}

export function stateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) return null;

    const isInternational = control.parent.get('isInternational')?.value;

    // If international → NO validation
    if (isInternational) {
      return null;
    }

    const value = control.value as string;

    if (!value) {
      return { required: true };
    }

    // Must be exactly 2 alphabetic characters
    if (!/^[A-Za-z]{2}$/.test(value)) {
      return { invalidLength: true };
    }

    return null;
  };
}

//validation for postal code:
// - US (not international): required, exactly 5 digits
// - International: required, alphanumeric with special characters allowed, max length 9
export function postalCodeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) return null;

    const value = control.value as string;
    if (!value) return { required: true };

    const isInternational = control.parent.get('isInternational')?.value;

    if (isInternational) {
      // International: Allow alphanumeric and common special characters (hyphens, spaces, periods, slashes, etc.)
      // Covers formats like: A1A 1A1 (Canada), SW1A-1AA (UK), 12345-678 (Brazil), etc.
      if (!/^[A-Za-z0-9\s\-./,#+]+$/.test(value)) {
        return { invalidInternationalPostalCode: true };
      }

      if (value.length > 9) {
        return { maxLength: { requiredLength: 9, actualLength: value.length } };
      }
    } else {
      // US (Domestic): Must be exactly 5 digits
      if (!/^\d{5}$/.test(value)) {
        return { invalidUSZipCode: true };
      }
    }

    return null;
  };
}

//validation for country: required, max length 15, alphabetic only
export function countryValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return { required: true };

    if (!/^[A-Za-z\s]+$/.test(value)) {
      return { alphabeticOnly: true };
    }

    if (value.length > 15) {
      return { maxlength: { requiredLength: 15, actualLength: value.length } };
    }

    return null;
  };
}

//validation for phone: optional, digits only, format 111-111-1111
export function phoneFaxValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) return null;

    const digitsOnly = value.replace(/\D/g, '');

    if (!/^[\d-]*$/.test(value)) {
      return { numbersOnly: true };
    }

    if (digitsOnly.length !== 10) {
      return {
        exactLength: {
          requiredLength: 10,
          actualLength: digitsOnly.length,
        },
      };
    }

    return null;
  };
}

// Validation for fax: optional, digits only, format 111-111-1111
export function faxValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) return null;

    const digitsOnly = value.replace(/\D/g, '');

    if (!/^[\d-]*$/.test(value)) {
      return { numbersOnly: true };
    }

    if (digitsOnly.length > 10) {
      return {
        maxlength: {
          requiredLength: 10,
          actualLength: digitsOnly.length,
        },
      };
    }

    return null;
  };
}

//validation for international phone and fax: optional, digits and special characters (no spaces), max length 15
export function internationalPhoneFaxValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) return null;

    // Only digits and special characters (+, -, (, )) - NO SPACES
    if (!/^[\d+\-()]+$/.test(value)) {
      return { invalidCharacters: true };
    }

    if (value.length > 15) {
      return {
        maxlength: {
          requiredLength: 15,
          actualLength: value.length,
        },
      };
    }

    return null;
  };
}

//validation for codabarScheme: optional, must be 'A', 'N', '8', or null
export function codabarSchemeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/empty (optional field)
    if (!value) return null;

    if (!Object.values(CodabarScheme).includes(value)) {
      return { invalidCodabarScheme: true };
    }

    return null;
  };
}

/**
 * Validator for registrationNumber: optional, max length 30
 * Oracle Forms FMB: REG_NO has WHEN-VALIDATE-ITEM with "begin null; end;" (no validation)
 * Only enforces maxlength to prevent database overflow
 */
export function registrationNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value;

    // Optional field
    if (!value) return null;

    // Max length only (no character restrictions per Oracle Forms)
    if (value.length > 30) {
      return {
        maxlength: {
          requiredLength: 30,
          actualLength: value.length,
        },
      };
    }
    return null;
  };
}

//validation for alphaNumeric: optional, must be 'Y', 'N', or null (error code 1017 in FMB)
export function alphaNumericValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    // Optional field
    if (!value) return null;

    if (!/^[YN]$/.test(value)) {
      return { invalidAlphaNumeric: true };
    }

    return null;
  };
}

//validation for taxId: optional, alphanumeric only, max length 9
export function taxIdValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    // Optional field
    if (!value) return null;

    // Only letters and numbers - no spaces or special characters
    if (!/^[A-Za-z0-9]+$/.test(value)) {
      return { specialChars: true };
    }

    if (value.length > 9) {
      return {
        maxlength: {
          requiredLength: 9,
          actualLength: value.length,
        },
      };
    }

    return null;
  };
}

// Re-export shared date validators
export { effectiveDateNotPastValidator } from '@shared/validators/date.validators';

/**
 * Validator for effectiveDate: required field
 * Oracle Forms Logic: Date >= today validation only in CREATE mode (record_status = 'NEW')
 *
 * Validations:
 * - Required field (FMB error code 5002)
 * - In CREATE mode: must be >= today (FMB error code 5003)
 *
 * Note: The datepicker's [min] attribute provides UI-level blocking for calendar selection.
 * This validator provides the actual validation logic for both manual input and programmatic changes.
 */
export function effectiveDateValidator(mode: 'create' | 'edit' = 'create'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return { required: true };

    const selected = moment.isMoment(value) ? value : moment(value);
    const today = moment().startOf('day');

    // Oracle Forms FMB line 1100: Check that effective date is >= today (CREATE mode only, error 5003)
    if (mode === 'create' && selected.isBefore(today, 'day')) {
      return { dateInPast: true }; // Error code 5003
    }

    return null;
  };
}

/**
 * Validator for terminationDate: optional, must be >= effectiveDate (FMB error code 8045)
 */
export function terminationDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Optional field
    if (!value) return null;

    // Cross-field validation: Termination Date >= Effective Date (FMB error code 8045)
    if (control.parent) {
      const effDate = control.parent.get('effectiveDate')?.value;
      if (effDate) {
        const termMoment = moment.isMoment(value) ? value : moment(value);
        const effMoment = moment.isMoment(effDate) ? effDate : moment(effDate);

        if (termMoment.isBefore(effMoment, 'day')) {
          return { beforeEffectiveDate: true }; // Error code 8045
        }
      }
    }

    return null;
  };
}

/**
 * Validator for licenseNumber: optional, max length 30
 * Oracle Forms FMB: LIC_NO has WHEN-VALIDATE-ITEM with "begin null; end;" (no validation)
 * Only enforces maxlength to prevent database overflow
 */
export function licenseNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) return null;

    // Max length only (no character restrictions per Oracle Forms)
    if (value.length > 30) {
      return {
        maxlength: {
          requiredLength: 30,
          actualLength: value.length,
        },
      };
    }

    return null;
  };
}

export function addressLineValidator(isRequired: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    // Required only when configured
    if (isRequired && (!value || !value.trim())) {
      return { required: true };
    }

    // Optional field → skip further validation if empty
    if (!value) return null;

    if (value.length > 50) {
      return {
        maxlength: {
          requiredLength: 50,
          actualLength: value.length,
        },
      };
    }
    return null;
  };
}

//validation for email: optional, must be valid email format, max length 50
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    // Optional field
    if (!value) return null;

    // Email format validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(value)) {
      return { invalidEmail: true };
    }

    // Max length check
    if (value.length > 50) {
      return {
        maxlength: {
          requiredLength: 50,
          actualLength: value.length,
        },
      };
    }

    return null;
  };
}

/**
 * Address completeness validator for contactInfo FormGroup
 * Oracle Forms equivalent: check_address procedure called on WHEN-VALIDATE-ITEM trigger (FMB line 1011)
 *
 * Ensures that if ANY address field is filled, ALL required fields must be completed.
 * This provides early validation feedback when user navigates away from address section.
 */
export function addressCompletenessValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) {
      return null;
    }

    const addr1 = group.get('addr_1')?.value as string;
    const addr2 = group.get('addr_2')?.value as string;
    const addr3 = group.get('addr_3')?.value as string;
    const city = group.get('city')?.value as string;
    const state = group.get('state')?.value as string;
    const zipCode = group.get('zipCode')?.value as string;
    const country = group.get('country')?.value as string;
    const isInternational = group.get('isInternational')?.value as boolean;

    // Check if ANY address field has been filled
    const hasAnyAddressData = !!(
      addr1?.trim() ||
      addr2?.trim() ||
      addr3?.trim() ||
      city?.trim() ||
      state?.trim() ||
      zipCode?.trim() ||
      country?.trim()
    );

    // If no address data entered yet, no validation needed
    if (!hasAnyAddressData) {
      return null;
    }

    // If ANY field filled, validate that ALL required fields are complete
    const missingFields: string[] = [];

    if (!addr1?.trim()) {
      missingFields.push('Address Line 1');
    }
    if (!city?.trim()) {
      missingFields.push('City');
    }
    if (!zipCode?.trim()) {
      missingFields.push('Postal Code');
    }
    if (!country?.trim()) {
      missingFields.push('Country');
    }

    // State is required only for domestic addresses
    if (!isInternational && !state?.trim()) {
      missingFields.push('State');
    }

    if (missingFields.length > 0) {
      return {
        incompleteAddress: {
          missingFields,
          message: `Address is incomplete. Please fill: ${missingFields.join(', ')}`
        }
      };
    }

    return null;
  };
}
