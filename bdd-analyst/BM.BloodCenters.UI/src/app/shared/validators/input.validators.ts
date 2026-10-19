import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Shared Input Validators
 *
 * This file contains reusable validators for common input validation scenarios:
 * - Text fields: whitespace validation, trimming
 * - Number fields: numeric validation, whitespace prevention
 * - Code fields: alphanumeric with symbols, at least one alphanumeric character
 */

// =============================================================================
// TEXT FIELD VALIDATORS
// =============================================================================

/**
 * Validates that a text field is not empty or whitespace-only.
 * Use this instead of Validators.required for text inputs.
 *
 * @returns ValidationErrors if value is empty or whitespace-only, null otherwise
 *
 * @example
 * // In component
 * firstName: ['', [noWhitespaceOnlyValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('whitespaceOnly')">
 *   Field cannot be empty or contain only spaces
 * </mat-error>
 */
export function noWhitespaceOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined - use with Validators.required if field is mandatory
    if (value === null || value === undefined) {
      return null;
    }

    // Check if string is empty or contains only whitespace
    if (typeof value === 'string' && value.trim().length === 0 && value.length > 0) {
      return { whitespaceOnly: true };
    }

    return null;
  };
}

/**
 * Validates that a required text field is not empty or whitespace-only.
 * Combines required validation with whitespace check.
 *
 * @returns ValidationErrors if value is missing, empty, or whitespace-only
 *
 * @example
 * // In component
 * firstName: ['', [requiredTrimmedValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('required')">Field is required</mat-error>
 * <mat-error *ngIf="control.hasError('whitespaceOnly')">Field cannot contain only spaces</mat-error>
 */
export function requiredTrimmedValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Check for null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return { required: true };
    }

    // Check if string is whitespace-only
    if (typeof value === 'string' && value.trim().length === 0) {
      return { whitespaceOnly: true };
    }

    return null;
  };
}

/**
 * Validates max length after trimming whitespace.
 *
 * @param maxLength - Maximum allowed length after trimming
 * @returns ValidationErrors if trimmed length exceeds maxLength
 *
 * @example
 * // In component
 * description: ['', [trimmedMaxLengthValidator(50)]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('trimmedMaxLength')">
 *   Maximum {{control.errors?.['trimmedMaxLength']?.maxLength}} characters allowed
 * </mat-error>
 */
export function trimmedMaxLengthValidator(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || typeof value !== 'string') {
      return null;
    }

    const trimmedLength = value.trim().length;

    if (trimmedLength > maxLength) {
      return {
        trimmedMaxLength: {
          maxLength,
          actualLength: trimmedLength
        }
      };
    }

    return null;
  };
}

/**
 * Validates min length after trimming whitespace.
 *
 * @param minLength - Minimum required length after trimming
 * @returns ValidationErrors if trimmed length is less than minLength
 */
export function trimmedMinLengthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || typeof value !== 'string') {
      return null;
    }

    const trimmedLength = value.trim().length;

    if (trimmedLength > 0 && trimmedLength < minLength) {
      return {
        trimmedMinLength: {
          minLength,
          actualLength: trimmedLength
        }
      };
    }

    return null;
  };
}

/**
 * Validates that a text field has no leading or trailing whitespace
 * and no multiple consecutive spaces between words.
 *
 * @returns ValidationErrors if value has leading/trailing spaces or multiple consecutive spaces
 *
 * @example
 * // Valid: "hello world", "test"
 * // Invalid: " hello", "hello ", "hello  world"
 *
 * // In component
 * description: ['', [noLeadingTrailingWhitespaceValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('leadingTrailingWhitespace')">
 *   Leading or trailing spaces are not allowed
 * </mat-error>
 * <mat-error *ngIf="control.hasError('multipleSpaces')">
 *   Only one space is allowed between words
 * </mat-error>
 */
export function noLeadingTrailingWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      if (value !== value.trim()) {
        return { leadingTrailingWhitespace: true };
      }

      if (/\s{2,}/.test(value)) {
        return { multipleSpaces: true };
      }
    }

    return null;
  };
}

// =============================================================================
// NUMBER FIELD VALIDATORS
// =============================================================================

/**
 * Validates that a number field contains a valid numeric value.
 * Prevents whitespace-only values and ensures valid numbers.
 *
 * @returns ValidationErrors if value is whitespace-only or not a valid number
 *
 * @example
 * // In component
 * quantity: ['', [numericFieldValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('whitespaceOnly')">Cannot be empty or spaces</mat-error>
 * <mat-error *ngIf="control.hasError('notNumeric')">Must be a valid number</mat-error>
 */
export function numericFieldValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value).trim();

    // Check for whitespace-only
    if (stringValue.length === 0) {
      return { whitespaceOnly: true };
    }

    // Check if it's a valid number (integers and decimals)
    if (!/^-?\d+(\.\d+)?$/.test(stringValue)) {
      return { notNumeric: true };
    }

    return null;
  };
}

/**
 * Validates that a field contains only positive integers.
 *
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: Infinity)
 * @returns ValidationErrors if value is invalid
 *
 * @example
 * // In component
 * sequence: ['', [positiveIntegerValidator(0, 9999)]]
 */
export function positiveIntegerValidator(min: number = 0, max: number = Infinity): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value).trim();

    // Check for whitespace-only
    if (stringValue.length === 0) {
      return { whitespaceOnly: true };
    }

    // Check if it's digits only
    if (!/^\d+$/.test(stringValue)) {
      return { notInteger: true };
    }

    const numValue = parseInt(stringValue, 10);

    if (isNaN(numValue)) {
      return { notInteger: true };
    }

    if (numValue < min || numValue > max) {
      return {
        outOfRange: {
          min,
          max,
          actual: numValue
        }
      };
    }

    return null;
  };
}

// =============================================================================
// CODE FIELD VALIDATORS
// =============================================================================

/**
 * Validates code fields according to requirements:
 * - Symbols are allowed
 * - Spaces are allowed
 * - Must contain at least one alphanumeric character (A-Z, a-z, 0-9)
 * - Values containing only symbols are invalid
 *
 * @returns ValidationErrors if code is invalid
 *
 * @example
 * // Valid: "ABC123", "ABC-123", "A@123", "123", "ABC", "ABC 123"
 * // Invalid: "@@@@", "###", "   "
 *
 * // In component
 * chapterId: ['', [codeFieldValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('whitespaceOnly')">Code cannot be empty or spaces</mat-error>
 * <mat-error *ngIf="control.hasError('noAlphanumeric')">Code must contain at least one letter or number</mat-error>
 */
export function codeFieldValidator(): ValidatorFn {
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

    // Check if code contains at least one alphanumeric character
    if (!/[a-zA-Z0-9]/.test(stringValue)) {
      return { noAlphanumeric: true };
    }

    return null;
  };
}

/**
 * Validates code fields that must be alphanumeric only (no symbols).
 * Spaces are allowed between alphanumeric characters.
 *
 * @returns ValidationErrors if code contains non-alphanumeric characters (except spaces)
 *
 * @example
 * // Valid: "ABC123", "ABC", "123", "ABC 123"
 * // Invalid: "ABC-123", "A@123"
 *
 * // In component
 * codeType: ['', [alphanumericCodeValidator()]]
 */
export function alphanumericCodeValidator(): ValidatorFn {
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

    // Check if alphanumeric only (allowing spaces)
    if (!/^[a-zA-Z0-9\s]+$/.test(stringValue)) {
      return { alphanumericOnly: true };
    }

    return null;
  };
}

/**
 * Validates code fields that must be alphanumeric with hyphens allowed.
 * Spaces and hyphens are allowed between alphanumeric characters.
 *
 * @returns ValidationErrors if code contains special characters (except spaces and hyphens)
 *
 * @example
 * // Valid: "ABC123", "ABC-123", "ABC 123", "ABC-XYZ 123"
 * // Invalid: "ABC@123", "A#123"
 *
 * // In component
 * shortId: ['', [alphanumericWithHyphenValidator()]]
 */
export function alphanumericWithHyphenValidator(): ValidatorFn {
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

    // Check if alphanumeric with hyphens only (allowing spaces)
    if (!/^[a-zA-Z0-9\s\-]+$/.test(stringValue)) {
      return { alphanumericOnly: true };
    }

    return null;
  };
}

/**
 * Validates notation code fields (alphanumeric + underscore only).
 * Used for notation codes that must contain only letters, numbers, and underscores.
 *
 * @returns ValidationErrors if code contains invalid characters
 *
 * @example
 * // Valid: "TEST01", "TEST_CODE", "ABC_123"
 * // Invalid: "TEST-01", "TEST@123", "TEST CODE" (spaces not allowed)
 *
 * // In component
 * notationCode: ['', [notationCodeValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('invalidNotationCode')">
 *   Notation code must contain only alphanumeric characters and underscores
 * </mat-error>
 */
export function notationCodeValidator(): ValidatorFn {
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

    // Check if alphanumeric + underscore only (no spaces, no other symbols)
    if (!/^[a-zA-Z0-9_]+$/.test(stringValue)) {
      return { invalidNotationCode: true };
    }

    return null;
  };
}

/**
 * Validates numeric-only code fields (e.g., error codes).
 * Validates digits only (trims spaces before validation).
 *
 * @param minDigits - Minimum number of digits (optional)
 * @param maxDigits - Maximum number of digits (optional)
 * @returns ValidationErrors if code is invalid
 *
 * @example
 * // In component
 * errorCode: ['', [numericCodeValidator(1, 4)]]
 */
export function numericCodeValidator(minDigits?: number, maxDigits?: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value).trim();

    // Check for whitespace-only
    if (stringValue.length === 0) {
      return { whitespaceOnly: true };
    }

    // Check if digits only
    if (!/^\d+$/.test(stringValue)) {
      return { numericOnly: true };
    }

    // Check digit count constraints
    if (minDigits !== undefined && stringValue.length < minDigits) {
      return {
        minDigits: {
          required: minDigits,
          actual: stringValue.length
        }
      };
    }

    if (maxDigits !== undefined && stringValue.length > maxDigits) {
      return {
        maxDigits: {
          required: maxDigits,
          actual: stringValue.length
        }
      };
    }

    return null;
  };
}

/**
 * Validator for Numerical Value — Oracle NUMBER(10,3)
 * Up to 7 integer digits and up to 3 decimal digits, negative values allowed
 * Range: -9999999.999 to 9999999.999
 */
export function numericalValueValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null;
    }

    const value = control.value.toString().trim();

    if (value === '' || value === '-') {
      return null;
    }

    // Up to 7 integer digits, up to 3 decimal digits, optional negative sign
    const numberRegex = /^-?\d{1,7}(\.\d{1,3})?$/;
    return numberRegex.test(value) ? null : { numericalValue: true };
  };
}

/**
 * Validator for integer fields that allow negative values (Sequence 1, 2, 3)
 * Accepts whole numbers only — positive or negative, no decimals
 */
export function integerValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null;
    }

    const value = control.value.toString().trim();

    if (value === '' || value === '-') {
      return null;
    }

    const integerRegex = /^-?\d+$/;
    return integerRegex.test(value) ? null : { integer: true };
  };
}

// =============================================================================
// URL VALIDATORS
// =============================================================================

/**
 * Validates URL format.
 * Accepts both absolute URLs (http://, https://) and relative URLs (/path/to/resource).
 *
 * @returns ValidationErrors if URL format is invalid
 *
 * @example
 * // Valid: "https://example.com", "http://example.com/page", "/dashboard", "/admin/users"
 * // Invalid: "htp://example", "invalid..com", "http://nitor123@1.@.%.6.UI.().com"
 *
 * // In component
 * webUrl: ['', [urlValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('invalidUrl')">
 *   Please enter a valid URL (e.g., https://example.com, www.example.com or /path)
 * </mat-error>
 */
export function urlValidator(): ValidatorFn {
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

    // Check for consecutive dots (invalid in URLs)
    if (/\.\./.test(stringValue)) {
      return { invalidUrl: true };
    }

    // Check for multiple @ symbols (invalid)
    const atCount = (stringValue.match(/@/g) || []).length;
    if (atCount > 1) {
      return { invalidUrl: true };
    }

    // Relative URL pattern (starts with /)
    const relativeUrlPattern = /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/;

    // Check if it's a relative URL
    if (stringValue.startsWith('/')) {
      return relativeUrlPattern.test(stringValue) ? null : { invalidUrl: true };
    }

    // For absolute URLs or domains, validate the structure more strictly
    let urlToValidate = stringValue;

    // Check if it has protocol and remove it for validation
    if (/^https?:\/\//i.test(urlToValidate)) {
      // Extract the part after protocol
      urlToValidate = urlToValidate.replace(/^https?:\/\//i, '');
    }

    // Extract and remove query string and hash fragment before parsing
    let queryAndHash = '';
    const queryIndex = urlToValidate.indexOf('?');
    const hashIndex = urlToValidate.indexOf('#');

    if (queryIndex !== -1 || hashIndex !== -1) {
      // Find the first occurrence of either ? or #
      const splitIndex = queryIndex !== -1 && hashIndex !== -1
        ? Math.min(queryIndex, hashIndex)
        : Math.max(queryIndex, hashIndex);

      queryAndHash = urlToValidate.substring(splitIndex);
      urlToValidate = urlToValidate.substring(0, splitIndex);
    }

    // Split into authority (domain + optional auth) and path
    const parts = urlToValidate.split('/');
    const authority = parts[0];
    const path = parts.slice(1).join('/');

    // Validate authority part (domain with optional user info)
    let domain = authority;
    let userInfo = '';

    // Check for user authentication info (user:pass@domain or user@domain)
    if (authority.includes('@')) {
      const authParts = authority.split('@');
      if (authParts.length !== 2) {
        return { invalidUrl: true };
      }
      userInfo = authParts[0];
      domain = authParts[1];

      // Validate user info format (alphanumeric, dots, hyphens, underscores, colons)
      if (!/^[a-zA-Z0-9._:\-]+$/.test(userInfo)) {
        return { invalidUrl: true };
      }
    }

    // Remove port if present
    const domainWithoutPort = domain.split(':')[0];

    // Validate domain structure
    // Domain should not contain invalid characters like %, (), etc.
    if (/[%(){}[\]<>|\\^`]/.test(domainWithoutPort)) {
      return { invalidUrl: true };
    }

    // Explicitly reject localhost (not a valid production URL)
    if (domainWithoutPort.toLowerCase() === 'localhost') {
      return { invalidUrl: true };
    }

    // Check for valid domain pattern
    // Domain parts should be alphanumeric with hyphens, separated by dots
    // Each part should start and end with alphanumeric
    const domainParts = domainWithoutPort.split('.');

    // Must have at least 2 parts (e.g., example.com)
    if (domainParts.length < 2) {
      return { invalidUrl: true };
    }

    // Validate each domain part
    for (const part of domainParts) {
      if (part.length === 0) {
        return { invalidUrl: true }; // Empty part (consecutive dots)
      }

      // Each part should contain only alphanumeric and hyphens
      // Should not start or end with hyphen
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(part)) {
        return { invalidUrl: true };
      }

      // Domain part cannot be just numbers (like "1" or "123")
      // unless it's an IP address (which we validate separately)
      if (part.length > 3 && /^\d+$/.test(part)) {
        return { invalidUrl: true };
      }
    }

    // Validate TLD (last part) - should be 2-6 characters and only letters
    // unless it's an IP address
    const isIPAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(domainWithoutPort);
    if (!isIPAddress) {
      const tld = domainParts[domainParts.length - 1];
      // TLD must be 2-6 alphabetic characters (covers most common TLDs: com, org, net, info, museum, etc.)
      // This rejects ambiguous cases like 'www.example' where 'example' (7 chars) is too long to be a typical TLD
      if (!/^[a-zA-Z]{2,6}$/.test(tld)) {
        return { invalidUrl: true };
      }
    } else {
      // Validate IP address format
      const ipParts = domainWithoutPort.split('.');
      for (const ipPart of ipParts) {
        const num = parseInt(ipPart, 10);
        if (isNaN(num) || num < 0 || num > 255) {
          return { invalidUrl: true };
        }
      }
    }

    // Validate port if present
    if (domain.includes(':')) {
      const portPart = domain.split(':')[1];
      if (portPart) {
        const port = parseInt(portPart, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
          return { invalidUrl: true };
        }
      }
    }

    // Validate path part if present
    if (path.length > 0) {
      // Path should not contain invalid characters
      if (!/^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/.test(path)) {
        return { invalidUrl: true };
      }
    }

    // Validate query string and hash if present
    if (queryAndHash.length > 0) {
      // Query and hash should contain valid URL characters
      if (!/^[?#][a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/.test(queryAndHash)) {
        return { invalidUrl: true };
      }
    }

    return null;
  };
}

// =============================================================================
// EMAIL VALIDATORS
// =============================================================================

/**
 * Validates email address with strict format requirements:
 * - Must have username part before @
 * - Must have @ symbol
 * - Must have domain name after @
 * - Must have proper TLD (top-level domain) with at least 2 characters
 *
 * @returns ValidationErrors if email format is invalid
 *
 * @example
 * // Valid: "user@example.com", "name.test@domain.co.in", "test@mail.org"
 * // Invalid: "ks@m", "user@domain", "user@", "@domain.com", "nodomain"
 *
 * // In component
 * email: ['', [strictEmailValidator()]]
 *
 * // In template
 * <mat-error *ngIf="control.hasError('invalidEmail')">
 *   Please enter a valid email address in the format name@example.com
 * </mat-error>
 */
export function strictEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow null/undefined/empty - use with Validators.required if field is mandatory
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value).trim();

    // Check for whitespace-only
    if (stringValue.length === 0) {
      return null; // Let whitespaceOnly validator handle this
    }

    // Strict email pattern:
    // - Username: alphanumeric, dots, hyphens, underscores (must start/end with alphanumeric)
    // - @ symbol (exactly one)
    // - Domain: alphanumeric, dots, hyphens (must start/end with alphanumeric)
    // - TLD: at least 2 characters, only letters
    const emailPattern = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(stringValue)) {
      return { invalidEmail: true };
    }

    // Additional check: ensure there's only one @ symbol
    const atCount = (stringValue.match(/@/g) || []).length;
    if (atCount !== 1) {
      return { invalidEmail: true };
    }

    return null;
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Trims whitespace from a form control value.
 * Can be used as a value accessor or in component logic.
 *
 * @param control - The form control to trim
 */
export function trimControlValue(control: AbstractControl): void {
  const value = control.value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== value) {
      control.setValue(trimmed, { emitEvent: false });
    }
  }
}

/**
 * Creates a blur event handler that trims the control value.
 * Use this to trim values when user leaves the field.
 *
 * @param control - The form control to trim on blur
 * @returns Event handler function
 *
 * @example
 * // In template
 * <input [formControl]="nameControl" (blur)="onTrimBlur($event)">
 *
 * // In component
 * onTrimBlur = createTrimOnBlur(this.form.get('name')!);
 */
export function createTrimOnBlur(control: AbstractControl): () => void {
  return () => trimControlValue(control);
}

// =============================================================================
// ERROR MESSAGE HELPERS
// =============================================================================

/**
 * Gets a user-friendly error message for input validation errors.
 *
 * @param control - The form control to check
 * @param fieldName - Display name of the field for error messages
 * @returns Error message string or empty string if no error
 */
export function getInputValidationError(control: AbstractControl | null, fieldName: string = 'Field'): string {
  if (!control || !control.touched) {
    return '';
  }

  if (control.hasError('required')) {
    return `${fieldName} is required`;
  }

  if (control.hasError('whitespaceOnly')) {
    return `${fieldName} cannot contain only spaces`;
  }

  if (control.hasError('invalidEmail')) {
    return 'Please enter a valid email address in the format name@example.com';
  }

  if (control.hasError('invalidUrl')) {
    return 'Please enter a valid URL (e.g., https://example.com or /path)';
  }

  if (control.hasError('leadingTrailingWhitespace')) {
    return `${fieldName} must not have leading or trailing spaces`;
  }

  if (control.hasError('multipleSpaces')) {
    return `${fieldName} must not have multiple consecutive spaces`;
  }

  if (control.hasError('noAlphanumeric')) {
    return `Only alphanumeric characters allowed`;
  }

  if (control.hasError('alphanumericOnly')) {
    return `Only alphanumeric characters allowed`;
  }

  if (control.hasError('notNumeric')) {
    return `Only numbers are allowed`;
  }

  if (control.hasError('notInteger')) {
    return `${fieldName} must be a whole number`;
  }

  if (control.hasError('numericOnly')) {
    return `Only numbers are allowed`;
  }

  if (control.hasError('trimmedMaxLength')) {
    const error = control.getError('trimmedMaxLength');
    return `${fieldName} cannot exceed ${error.maxLength} characters`;
  }

  if (control.hasError('trimmedMinLength')) {
    const error = control.getError('trimmedMinLength');
    return `${fieldName} must be at least ${error.minLength} characters`;
  }

  if (control.hasError('outOfRange')) {
    const error = control.getError('outOfRange');
    return `${fieldName} must be between ${error.min} and ${error.max}`;
  }

  if (control.hasError('minDigits')) {
    const error = control.getError('minDigits');
    return `${fieldName} must have at least ${error.required} digits`;
  }

  if (control.hasError('maxDigits')) {
    const error = control.getError('maxDigits');
    return `${fieldName} cannot have more than ${error.required} digits`;
  }

  return '';
}
