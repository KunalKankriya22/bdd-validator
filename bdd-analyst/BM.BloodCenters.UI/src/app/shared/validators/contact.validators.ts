import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Contact Validators
 * Reusable validators for contact-related fields across the application
 *
 * Usage:
 * - Contact names (first, middle, last)
 * - Contact information (phone, email, fax)
 * - Contact titles and salutations
 */

// =============================================================================
// NAME VALIDATORS
// =============================================================================

/**
 * Validator for contact name fields (first name, middle name, last name)
 * Allows: Letters (including accented), spaces, hyphens, apostrophes, periods
 *
 * Pattern: A-Z, a-z, À-ÿ (accented), space, hyphen, apostrophe, period
 *
 * @returns ValidationErrors if name contains invalid characters
 *
 * @example
 * // Valid: "John", "Mary-Jane", "O'Brien", "José", "Dr. Smith", "Anne Marie"
 * // Invalid: "John123", "Name@", "Test_Name"
 *
 * // In component
 * firstName: ['', [contactNameValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('invalidContactName')">
 *   Name can only contain letters, spaces, hyphens, apostrophes, and periods
 * </mat-error>
 */
export function contactNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value);

    // Check for whitespace-only
    if (stringValue.trim().length === 0) {
      return { whitespaceOnly: true };
    }

    // Pattern: Letters (including accented), space, hyphen, apostrophe, period
    const namePattern = /^[A-Za-zÀ-ÿ'\-. ]+$/;

    if (!namePattern.test(stringValue)) {
      return { invalidContactName: true };
    }

    return null;
  };
}

/**
 * Validator for required contact name with max length
 * Combines required, name pattern, and max length validation
 *
 * @param maxLength - Maximum allowed length (default: 50)
 * @returns ValidatorFn array with combined validators
 *
 * @example
 * // In component
 * firstName: ['', contactNameRequiredValidator(50)]
 * lastName: ['', contactNameRequiredValidator()]
 */
export function contactNameRequiredValidator(maxLength: number = 50): ValidatorFn[] {
  return [
    (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || String(control.value).trim() === '') {
        return { required: true };
      }
      return null;
    },
    contactNameValidator(),
    (control: AbstractControl): ValidationErrors | null => {
      if (control.value && String(control.value).length > maxLength) {
        return { maxlength: { requiredLength: maxLength, actualLength: String(control.value).length } };
      }
      return null;
    }
  ];
}

/**
 * Validator for optional contact name with max length
 * Validates name pattern and max length only if value is provided
 *
 * @param maxLength - Maximum allowed length (default: 50)
 * @returns ValidatorFn array with validators
 *
 * @example
 * // In component
 * middleName: ['', contactNameOptionalValidator(50)]
 */
export function contactNameOptionalValidator(maxLength: number = 50): ValidatorFn[] {
  return [
    contactNameValidator(),
    (control: AbstractControl): ValidationErrors | null => {
      if (control.value && String(control.value).length > maxLength) {
        return { maxlength: { requiredLength: maxLength, actualLength: String(control.value).length } };
      }
      return null;
    }
  ];
}

// =============================================================================
// PHONE NUMBER VALIDATORS
// =============================================================================

/**
 * Phone/fax number validator for contact fields
 * Strips hyphens, spaces, parentheses, and plus signs
 * Validates that remaining characters are digits only
 * Checks length is 7, 8, 10, or 12 digits (standard US and international formats)
 *
 * Valid lengths:
 * - 7 digits: Local number (e.g., 555-1234)
 * - 8 digits: Some international formats
 * - 10 digits: Standard US (e.g., 555-555-5555)
 * - 12 digits: International with country code (e.g., +1-555-555-5555)
 *
 * @returns ValidationErrors if phone number format is invalid
 *
 * @example
 * // Valid: "555-1234", "555-555-5555", "5555555555", "+1-555-555-5555"
 * // Invalid: "555", "55555", "555-555-555A", "abcd"
 *
 * // In component
 * dayPhoneNo: ['', [contactPhoneValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('invalidPhoneNumber')">
 *   {{control.errors?.['invalidPhoneNumber']?.message}}
 * </mat-error>
 */
export function contactPhoneValidator(): ValidatorFn {
  const VALID_LENGTHS = [7, 8, 10, 12];

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value);

    // Strip hyphens, spaces, parentheses, and plus signs
    const stripped = stringValue.replace(/[-\s\(\)\+]/g, '');

    // Check if remaining characters are digits only
    if (/\D/.test(stripped)) {
      return {
        invalidPhoneNumber: {
          message: 'Phone number must contain only digits'
        }
      };
    }

    // Check if length is valid (7, 8, 10, or 12 digits)
    if (stripped.length > 0 && !VALID_LENGTHS.includes(stripped.length)) {
      return {
        invalidPhoneNumber: {
          message: 'Phone number must be 7, 8, 10, or 12 digits'
        }
      };
    }

    return null;
  };
}

/**
 * Required phone validator for contact fields
 * Combines required validation with phone format validation
 *
 * @returns ValidatorFn array with combined validators
 *
 * @example
 * // In component
 * dayPhoneNo: ['', contactPhoneRequiredValidator()]
 */
export function contactPhoneRequiredValidator(): ValidatorFn[] {
  return [
    (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value || String(value).trim() === '') {
        return { required: true };
      }
      return null;
    },
    contactPhoneValidator()
  ];
}

// =============================================================================
// EMAIL VALIDATORS
// =============================================================================

/**
 * Email validator for contact fields
 * Strict email validation with proper format requirements:
 * - Username: alphanumeric, dots, hyphens, underscores (must start/end with alphanumeric)
 * - @ symbol (exactly one)
 * - Domain: alphanumeric, dots, hyphens (must start/end with alphanumeric)
 * - TLD: at least 2 characters, only letters
 *
 * @returns ValidationErrors if email format is invalid
 *
 * @example
 * // Valid: "user@example.com", "name.test@domain.co.in", "test@mail.org"
 * // Invalid: "user@", "@domain.com", "user@domain", "nodomain"
 *
 * // In component
 * email: ['', [contactEmailValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('invalidEmail')">
 *   Please enter a valid email address (e.g., name@example.com)
 * </mat-error>
 */
export function contactEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value).trim();

    // Check for whitespace-only
    if (stringValue.length === 0) {
      return null;
    }

    // Strict email pattern matching input.validators.ts
    const emailPattern = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(stringValue)) {
      return { invalidEmail: true };
    }

    // Ensure exactly one @ symbol
    const atCount = (stringValue.match(/@/g) || []).length;
    if (atCount !== 1) {
      return { invalidEmail: true };
    }

    return null;
  };
}

/**
 * Required email validator for contact fields
 * Combines required validation with email format validation
 *
 * @param maxLength - Maximum allowed length (default: 128)
 * @returns ValidatorFn array with combined validators
 *
 * @example
 * // In component
 * email: ['', contactEmailRequiredValidator(128)]
 */
export function contactEmailRequiredValidator(maxLength: number = 128): ValidatorFn[] {
  return [
    (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value || String(value).trim() === '') {
        return { required: true };
      }
      return null;
    },
    contactEmailValidator(),
    (control: AbstractControl): ValidationErrors | null => {
      if (control.value && String(control.value).length > maxLength) {
        return { maxlength: { requiredLength: maxLength, actualLength: String(control.value).length } };
      }
      return null;
    }
  ];
}

// =============================================================================
// SALUTATION AND TITLE VALIDATORS
// =============================================================================

/**
 * Validator for contact salutation fields (Mr., Mrs., Ms., Dr., etc.)
 * Allows: Letters, spaces, periods
 *
 * @returns ValidationErrors if salutation contains invalid characters
 *
 * @example
 * // Valid: "Mr.", "Mrs.", "Ms.", "Dr.", "Prof."
 * // Invalid: "Mr123", "Dr@"
 *
 * // In component
 * salutation: ['', [contactSalutationValidator()]]
 */
export function contactSalutationValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value);

    // Check for whitespace-only
    if (stringValue.trim().length === 0) {
      return { whitespaceOnly: true };
    }

    // Pattern: Letters, spaces, periods only
    const salutationPattern = /^[A-Za-z. ]+$/;

    if (!salutationPattern.test(stringValue)) {
      return { invalidSalutation: true };
    }

    return null;
  };
}

/**
 * Validator for contact title/position fields
 * Allows: Letters (including accented), spaces, hyphens, apostrophes, periods, ampersands, commas
 *
 * @returns ValidationErrors if title contains invalid characters
 *
 * @example
 * // Valid: "CEO", "Vice President", "Director of Sales", "Manager, IT Dept."
 * // Invalid: "CEO123", "Title@Company"
 *
 * // In component
 * title: ['', [contactTitleValidator()]]
 */
export function contactTitleValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value);

    // Check for whitespace-only
    if (stringValue.trim().length === 0) {
      return { whitespaceOnly: true };
    }

    // Pattern: Letters, spaces, common title punctuation
    const titlePattern = /^[A-Za-zÀ-ÿ'\-., &]+$/;

    if (!titlePattern.test(stringValue)) {
      return { invalidTitle: true };
    }

    return null;
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Strips formatting from phone number (removes hyphens, spaces, parentheses, plus signs)
 * Returns only the digits
 *
 * @param phoneNumber - Phone number string to strip
 * @returns String with only digits, or null if input is null/undefined
 *
 * @example
 * stripPhoneFormatting('555-555-5555') // returns '5555555555'
 * stripPhoneFormatting('+1 (555) 555-5555') // returns '15555555555'
 */
export function stripPhoneFormatting(phoneNumber: string | null | undefined): string | null {
  if (!phoneNumber) {
    return null;
  }
  return phoneNumber.replace(/[-\s\(\)\+]/g, '');
}

/**
 * Formats a 10-digit phone number to XXX-XXX-XXXX format
 * Formats a 7-digit phone number to XXX-XXXX format
 * Returns original value for other lengths
 *
 * @param phoneNumber - Phone number string to format
 * @returns Formatted phone number string
 *
 * @example
 * formatPhoneNumber('5555555555') // returns '555-555-5555'
 * formatPhoneNumber('5555555') // returns '555-5555'
 */
export function formatPhoneNumber(phoneNumber: string | null | undefined): string | null {
  if (!phoneNumber) {
    return null;
  }

  const digits = stripPhoneFormatting(phoneNumber);
  if (!digits) {
    return null;
  }

  if (digits.length === 10) {
    return `${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`;
  } else if (digits.length === 7) {
    return `${digits.substring(0, 3)}-${digits.substring(3)}`;
  }

  return phoneNumber;
}

/**
 * Validates if a phone number has a valid length (7, 8, 10, or 12 digits)
 *
 * @param phoneNumber - Phone number string to validate
 * @returns true if valid length, false otherwise
 *
 * @example
 * isValidPhoneLength('555-555-5555') // returns true (10 digits)
 * isValidPhoneLength('55555') // returns false (5 digits)
 */
export function isValidPhoneLength(phoneNumber: string | null | undefined): boolean {
  if (!phoneNumber) {
    return false;
  }

  const digits = stripPhoneFormatting(phoneNumber);
  if (!digits) {
    return false;
  }

  const VALID_LENGTHS = [7, 8, 10, 12];
  return VALID_LENGTHS.includes(digits.length);
}

// =============================================================================
// ERROR MESSAGE HELPERS
// =============================================================================

/**
 * Gets a user-friendly error message for contact field validation errors
 *
 * @param control - The form control to check
 * @param fieldName - Display name of the field for error messages
 * @returns Error message string or empty string if no error
 *
 * @example
 * getContactValidationError(form.get('firstName'), 'First Name')
 * // Returns: "First Name is required" or "First Name can only contain letters..."
 */
export function getContactValidationError(control: AbstractControl | null, fieldName: string = 'Field'): string {
  if (!control || !control.touched) {
    return '';
  }

  if (control.hasError('required')) {
    return `${fieldName} is required`;
  }

  if (control.hasError('whitespaceOnly')) {
    return `${fieldName} cannot contain only spaces`;
  }

  if (control.hasError('invalidContactName')) {
    return `${fieldName} can only contain letters, spaces, hyphens, apostrophes, and periods`;
  }

  if (control.hasError('invalidPhoneNumber')) {
    const errorMsg = control.getError('invalidPhoneNumber')?.message;
    return errorMsg || `${fieldName} is invalid`;
  }

  if (control.hasError('invalidEmail')) {
    return 'Please enter a valid email address (e.g., name@example.com)';
  }

  if (control.hasError('invalidSalutation')) {
    return `${fieldName} can only contain letters, spaces, and periods`;
  }

  if (control.hasError('invalidTitle')) {
    return `${fieldName} can only contain letters, spaces, and common punctuation`;
  }

  if (control.hasError('maxlength')) {
    const error = control.getError('maxlength');
    return `${fieldName} cannot exceed ${error.requiredLength} characters`;
  }

  if (control.hasError('minlength')) {
    const error = control.getError('minlength');
    return `${fieldName} must be at least ${error.requiredLength} characters`;
  }

  return '';
}
