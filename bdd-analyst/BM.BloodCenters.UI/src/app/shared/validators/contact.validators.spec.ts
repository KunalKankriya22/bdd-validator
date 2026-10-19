import { FormControl } from '@angular/forms';
import {
  contactNameValidator,
  contactNameRequiredValidator,
  contactNameOptionalValidator,
  contactPhoneValidator,
  contactPhoneRequiredValidator,
  contactEmailValidator,
  contactEmailRequiredValidator,
  contactSalutationValidator,
  contactTitleValidator,
  stripPhoneFormatting,
  formatPhoneNumber,
  isValidPhoneLength,
  getContactValidationError
} from './contact.validators';

describe('Contact Validators', () => {

  // =============================================================================
  // NAME VALIDATORS
  // =============================================================================

  describe('contactNameValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);
      const result = contactNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for undefined value', () => {
      const control = new FormControl(undefined);
      const result = contactNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      const result = contactNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for valid simple name', () => {
      const control = new FormControl('John');
      const result = contactNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for name with apostrophe', () => {
      const control = new FormControl("O'Brien");
      const result = contactNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for hyphenated name', () => {
      const control = new FormControl('Mary-Jane');
      const result = contactNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for name with period', () => {
      const control = new FormControl('Dr. Smith');
      const result = contactNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for name with spaces', () => {
      const control = new FormControl('Anne Marie');
      const result = contactNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for accented characters', () => {
      const control = new FormControl('José');
      const result = contactNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should return error for whitespace-only value', () => {
      const control = new FormControl('   ');
      const result = contactNameValidator()(control);
      expect(result).toEqual({ whitespaceOnly: true });
    });

    it('should return error for name with numbers', () => {
      const control = new FormControl('John123');
      const result = contactNameValidator()(control);
      expect(result).toEqual({ invalidContactName: true });
    });

    it('should return error for name with special characters', () => {
      const control = new FormControl('Name@Test');
      const result = contactNameValidator()(control);
      expect(result).toEqual({ invalidContactName: true });
    });

    it('should return error for name with underscores', () => {
      const control = new FormControl('Test_Name');
      const result = contactNameValidator()(control);
      expect(result).toEqual({ invalidContactName: true });
    });
  });

  // =============================================================================
  // contactNameRequiredValidator
  // =============================================================================

  describe('contactNameRequiredValidator', () => {
    it('should return required error for null value', () => {
      const validators = contactNameRequiredValidator(50);
      const control = new FormControl(null, validators);
      expect(control.hasError('required')).toBe(true);
    });

    it('should return required error for empty string', () => {
      const validators = contactNameRequiredValidator(50);
      const control = new FormControl('', validators);
      expect(control.hasError('required')).toBe(true);
    });

    it('should return required error for whitespace-only string', () => {
      const validators = contactNameRequiredValidator(50);
      const control = new FormControl('   ', validators);
      expect(control.hasError('required')).toBe(true);
    });

    it('should be valid for a valid name', () => {
      const validators = contactNameRequiredValidator(50);
      const control = new FormControl('John', validators);
      expect(control.valid).toBe(true);
    });

    it('should be valid for name with apostrophe', () => {
      const validators = contactNameRequiredValidator(50);
      const control = new FormControl("O'Brien", validators);
      expect(control.valid).toBe(true);
    });

    it('should be valid for hyphenated name', () => {
      const validators = contactNameRequiredValidator(50);
      const control = new FormControl('Mary-Jane', validators);
      expect(control.valid).toBe(true);
    });

    it('should be valid for name with period', () => {
      const validators = contactNameRequiredValidator(50);
      const control = new FormControl('Dr. Smith', validators);
      expect(control.valid).toBe(true);
    });

    it('should return maxlength error for too-long name', () => {
      const validators = contactNameRequiredValidator(10);
      const control = new FormControl('VeryLongNameExceeds', validators);
      expect(control.hasError('maxlength')).toBe(true);
      expect(control.getError('maxlength').requiredLength).toBe(10);
    });

    it('should return invalidContactName error for name with numbers', () => {
      const validators = contactNameRequiredValidator(50);
      const control = new FormControl('John123', validators);
      expect(control.hasError('invalidContactName')).toBe(true);
    });

    it('should use default maxLength of 50', () => {
      const validators = contactNameRequiredValidator();
      const longName = 'A'.repeat(51);
      const control = new FormControl(longName, validators);
      expect(control.hasError('maxlength')).toBe(true);
      expect(control.getError('maxlength').requiredLength).toBe(50);
    });

    it('should not return maxlength for name at max length', () => {
      const validators = contactNameRequiredValidator(10);
      const control = new FormControl('Abcdefghij', validators);
      expect(control.hasError('maxlength')).toBe(false);
      expect(control.valid).toBe(true);
    });
  });

  // =============================================================================
  // contactNameOptionalValidator
  // =============================================================================

  describe('contactNameOptionalValidator', () => {
    it('should be valid for null value (optional)', () => {
      const validators = contactNameOptionalValidator(50);
      const control = new FormControl(null, validators);
      expect(control.valid).toBe(true);
    });

    it('should be valid for empty string (optional)', () => {
      const validators = contactNameOptionalValidator(50);
      const control = new FormControl('', validators);
      expect(control.valid).toBe(true);
    });

    it('should be valid for undefined value (optional)', () => {
      const validators = contactNameOptionalValidator(50);
      const control = new FormControl(undefined, validators);
      expect(control.valid).toBe(true);
    });

    it('should be valid for a valid name', () => {
      const validators = contactNameOptionalValidator(50);
      const control = new FormControl('John', validators);
      expect(control.valid).toBe(true);
    });

    it('should be valid for name with apostrophe', () => {
      const validators = contactNameOptionalValidator(50);
      const control = new FormControl("O'Brien", validators);
      expect(control.valid).toBe(true);
    });

    it('should be valid for hyphenated name', () => {
      const validators = contactNameOptionalValidator(50);
      const control = new FormControl('Mary-Jane', validators);
      expect(control.valid).toBe(true);
    });

    it('should return maxlength error for too-long name', () => {
      const validators = contactNameOptionalValidator(10);
      const control = new FormControl('VeryLongNameExceeds', validators);
      expect(control.hasError('maxlength')).toBe(true);
      expect(control.getError('maxlength').requiredLength).toBe(10);
    });

    it('should return invalidContactName error for name with invalid characters', () => {
      const validators = contactNameOptionalValidator(50);
      const control = new FormControl('Name@Invalid', validators);
      expect(control.hasError('invalidContactName')).toBe(true);
    });

    it('should return whitespaceOnly error for whitespace-only string', () => {
      const validators = contactNameOptionalValidator(50);
      const control = new FormControl('   ', validators);
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should use default maxLength of 50', () => {
      const validators = contactNameOptionalValidator();
      const longName = 'A'.repeat(51);
      const control = new FormControl(longName, validators);
      expect(control.hasError('maxlength')).toBe(true);
    });
  });

  // =============================================================================
  // PHONE NUMBER VALIDATORS
  // =============================================================================

  describe('contactPhoneValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);
      const result = contactPhoneValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      const result = contactPhoneValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for valid 7-digit phone', () => {
      const control = new FormControl('5555555');
      const result = contactPhoneValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for valid 8-digit phone', () => {
      const control = new FormControl('55555555');
      const result = contactPhoneValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for valid 10-digit phone', () => {
      const control = new FormControl('5555555555');
      const result = contactPhoneValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for valid 12-digit phone', () => {
      const control = new FormControl('555555555555');
      const result = contactPhoneValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for formatted 10-digit phone', () => {
      const control = new FormControl('555-555-5555');
      const result = contactPhoneValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for phone with parentheses', () => {
      const control = new FormControl('(555) 555-5555');
      const result = contactPhoneValidator()(control);
      expect(result).toBeNull();
    });

    it('should return error for phone with letters', () => {
      const control = new FormControl('555-555-ABCD');
      const result = contactPhoneValidator()(control);
      expect(result).toEqual({
        invalidPhoneNumber: {
          message: 'Phone number must contain only digits'
        }
      });
    });

    it('should return error for invalid length (5 digits)', () => {
      const control = new FormControl('55555');
      const result = contactPhoneValidator()(control);
      expect(result).toEqual({
        invalidPhoneNumber: {
          message: 'Phone number must be 7, 8, 10, or 12 digits'
        }
      });
    });

    it('should return error for invalid length (9 digits)', () => {
      const control = new FormControl('555555555');
      const result = contactPhoneValidator()(control);
      expect(result).toEqual({
        invalidPhoneNumber: {
          message: 'Phone number must be 7, 8, 10, or 12 digits'
        }
      });
    });

    it('should return error for invalid length (11 digits)', () => {
      const control = new FormControl('55555555555');
      const result = contactPhoneValidator()(control);
      expect(result).toEqual({
        invalidPhoneNumber: {
          message: 'Phone number must be 7, 8, 10, or 12 digits'
        }
      });
    });
  });

  // =============================================================================
  // contactPhoneRequiredValidator
  // =============================================================================

  describe('contactPhoneRequiredValidator', () => {
    it('should return required error for null value', () => {
      const validators = contactPhoneRequiredValidator();
      const control = new FormControl(null, validators);
      expect(control.hasError('required')).toBe(true);
    });

    it('should return required error for empty string', () => {
      const validators = contactPhoneRequiredValidator();
      const control = new FormControl('', validators);
      expect(control.hasError('required')).toBe(true);
    });

    it('should return required error for whitespace-only string', () => {
      const validators = contactPhoneRequiredValidator();
      const control = new FormControl('   ', validators);
      expect(control.hasError('required')).toBe(true);
    });

    it('should be valid for a valid 10-digit phone', () => {
      const validators = contactPhoneRequiredValidator();
      const control = new FormControl('5555555555', validators);
      expect(control.valid).toBe(true);
    });

    it('should be valid for a valid 7-digit phone', () => {
      const validators = contactPhoneRequiredValidator();
      const control = new FormControl('5555555', validators);
      expect(control.valid).toBe(true);
    });

    it('should be valid for a formatted phone', () => {
      const validators = contactPhoneRequiredValidator();
      const control = new FormControl('555-555-5555', validators);
      expect(control.valid).toBe(true);
    });

    it('should return invalidPhoneNumber error for invalid length', () => {
      const validators = contactPhoneRequiredValidator();
      const control = new FormControl('55555', validators);
      expect(control.hasError('invalidPhoneNumber')).toBe(true);
    });
  });

  // =============================================================================
  // EMAIL VALIDATORS
  // =============================================================================

  describe('contactEmailValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);
      const result = contactEmailValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      const result = contactEmailValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for valid simple email', () => {
      const control = new FormControl('user@example.com');
      const result = contactEmailValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for email with dots in username', () => {
      const control = new FormControl('first.last@example.com');
      const result = contactEmailValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for email with hyphens in domain', () => {
      const control = new FormControl('user@my-domain.com');
      const result = contactEmailValidator()(control);
      expect(result).toBeNull();
    });

    it('should return error for email without @', () => {
      const control = new FormControl('userexample.com');
      const result = contactEmailValidator()(control);
      expect(result).toEqual({ invalidEmail: true });
    });

    it('should return error for email without domain', () => {
      const control = new FormControl('user@');
      const result = contactEmailValidator()(control);
      expect(result).toEqual({ invalidEmail: true });
    });

    it('should return error for email without username', () => {
      const control = new FormControl('@example.com');
      const result = contactEmailValidator()(control);
      expect(result).toEqual({ invalidEmail: true });
    });

    it('should return error for email without TLD', () => {
      const control = new FormControl('user@domain');
      const result = contactEmailValidator()(control);
      expect(result).toEqual({ invalidEmail: true });
    });

    it('should return error for email with multiple @', () => {
      const control = new FormControl('user@@example.com');
      const result = contactEmailValidator()(control);
      expect(result).toEqual({ invalidEmail: true });
    });

    it('should return error for email with spaces', () => {
      const control = new FormControl('user @example.com');
      const result = contactEmailValidator()(control);
      expect(result).toEqual({ invalidEmail: true });
    });

    it('should return error for email with invalid TLD (single character)', () => {
      const control = new FormControl('user@example.c');
      const result = contactEmailValidator()(control);
      expect(result).toEqual({ invalidEmail: true });
    });
  });

  // =============================================================================
  // contactEmailRequiredValidator
  // =============================================================================

  describe('contactEmailRequiredValidator', () => {
    it('should return required error for null value', () => {
      const validators = contactEmailRequiredValidator(128);
      const control = new FormControl(null, validators);
      expect(control.hasError('required')).toBe(true);
    });

    it('should return required error for empty string', () => {
      const validators = contactEmailRequiredValidator(128);
      const control = new FormControl('', validators);
      expect(control.hasError('required')).toBe(true);
    });

    it('should return required error for whitespace-only string', () => {
      const validators = contactEmailRequiredValidator(128);
      const control = new FormControl('   ', validators);
      expect(control.hasError('required')).toBe(true);
    });

    it('should be valid for a valid email', () => {
      const validators = contactEmailRequiredValidator(128);
      const control = new FormControl('user@example.com', validators);
      expect(control.valid).toBe(true);
    });

    it('should return maxlength error for too-long email', () => {
      const validators = contactEmailRequiredValidator(20);
      const control = new FormControl('verylongusername@verylongdomain.com', validators);
      expect(control.hasError('maxlength')).toBe(true);
      expect(control.getError('maxlength').requiredLength).toBe(20);
    });

    it('should return invalidEmail error for invalid format', () => {
      const validators = contactEmailRequiredValidator(128);
      const control = new FormControl('not-an-email', validators);
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should use default maxLength of 128', () => {
      const validators = contactEmailRequiredValidator();
      const longEmail = 'a'.repeat(120) + '@test.com';
      const control = new FormControl(longEmail, validators);
      expect(control.hasError('maxlength')).toBe(true);
    });

    it('should not return maxlength when email is within limit', () => {
      const validators = contactEmailRequiredValidator(128);
      const control = new FormControl('user@example.com', validators);
      expect(control.hasError('maxlength')).toBe(false);
    });
  });

  // =============================================================================
  // SALUTATION VALIDATORS
  // =============================================================================

  describe('contactSalutationValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);
      const result = contactSalutationValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      const result = contactSalutationValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for valid salutation "Mr."', () => {
      const control = new FormControl('Mr.');
      const result = contactSalutationValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for valid salutation "Mrs."', () => {
      const control = new FormControl('Mrs.');
      const result = contactSalutationValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for valid salutation "Dr."', () => {
      const control = new FormControl('Dr.');
      const result = contactSalutationValidator()(control);
      expect(result).toBeNull();
    });

    it('should return error for whitespace-only value', () => {
      const control = new FormControl('   ');
      const result = contactSalutationValidator()(control);
      expect(result).toEqual({ whitespaceOnly: true });
    });

    it('should return error for salutation with numbers', () => {
      const control = new FormControl('Mr123');
      const result = contactSalutationValidator()(control);
      expect(result).toEqual({ invalidSalutation: true });
    });

    it('should return error for salutation with special characters', () => {
      const control = new FormControl('Dr@');
      const result = contactSalutationValidator()(control);
      expect(result).toEqual({ invalidSalutation: true });
    });
  });

  // =============================================================================
  // TITLE VALIDATORS
  // =============================================================================

  describe('contactTitleValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);
      const result = contactTitleValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      const result = contactTitleValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for valid title "CEO"', () => {
      const control = new FormControl('CEO');
      const result = contactTitleValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for title with spaces', () => {
      const control = new FormControl('Vice President');
      const result = contactTitleValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for title with comma', () => {
      const control = new FormControl('Manager, IT Dept.');
      const result = contactTitleValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for title with ampersand', () => {
      const control = new FormControl('Sales & Marketing');
      const result = contactTitleValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for title with apostrophe', () => {
      const control = new FormControl("Director of Women's Services");
      const result = contactTitleValidator()(control);
      expect(result).toBeNull();
    });

    it('should return error for whitespace-only value', () => {
      const control = new FormControl('   ');
      const result = contactTitleValidator()(control);
      expect(result).toEqual({ whitespaceOnly: true });
    });

    it('should return error for title with numbers', () => {
      const control = new FormControl('CEO123');
      const result = contactTitleValidator()(control);
      expect(result).toEqual({ invalidTitle: true });
    });

    it('should return error for title with @ symbol', () => {
      const control = new FormControl('Title@Company');
      const result = contactTitleValidator()(control);
      expect(result).toEqual({ invalidTitle: true });
    });
  });

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  describe('stripPhoneFormatting', () => {
    it('should strip hyphens from phone number', () => {
      expect(stripPhoneFormatting('555-555-5555')).toBe('5555555555');
    });

    it('should strip spaces from phone number', () => {
      expect(stripPhoneFormatting('555 555 5555')).toBe('5555555555');
    });

    it('should strip parentheses from phone number', () => {
      expect(stripPhoneFormatting('(555) 555-5555')).toBe('5555555555');
    });

    it('should strip plus sign from phone number', () => {
      expect(stripPhoneFormatting('+1-555-555-5555')).toBe('15555555555');
    });

    it('should return null for null input', () => {
      expect(stripPhoneFormatting(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(stripPhoneFormatting(undefined)).toBeNull();
    });

    it('should return digits only for already stripped number', () => {
      expect(stripPhoneFormatting('5555555555')).toBe('5555555555');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit phone to XXX-XXX-XXXX', () => {
      expect(formatPhoneNumber('5555555555')).toBe('555-555-5555');
    });

    it('should format 7-digit phone to XXX-XXXX', () => {
      expect(formatPhoneNumber('5555555')).toBe('555-5555');
    });

    it('should preserve formatting for already formatted 10-digit phone', () => {
      expect(formatPhoneNumber('555-555-5555')).toBe('555-555-5555');
    });

    it('should preserve formatting for already formatted 7-digit phone', () => {
      expect(formatPhoneNumber('555-5555')).toBe('555-5555');
    });

    it('should return original value for 12-digit phone', () => {
      expect(formatPhoneNumber('155555555555')).toBe('155555555555');
    });

    it('should return null for null input', () => {
      expect(formatPhoneNumber(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(formatPhoneNumber(undefined)).toBeNull();
    });
  });

  describe('isValidPhoneLength', () => {
    it('should return true for 7-digit phone', () => {
      expect(isValidPhoneLength('555-5555')).toBe(true);
    });

    it('should return true for 8-digit phone', () => {
      expect(isValidPhoneLength('55555555')).toBe(true);
    });

    it('should return true for 10-digit phone', () => {
      expect(isValidPhoneLength('555-555-5555')).toBe(true);
    });

    it('should return true for 12-digit phone', () => {
      expect(isValidPhoneLength('+44-555-555-5555')).toBe(true);
    });

    it('should return false for 5-digit phone', () => {
      expect(isValidPhoneLength('55555')).toBe(false);
    });

    it('should return false for 9-digit phone', () => {
      expect(isValidPhoneLength('555555555')).toBe(false);
    });

    it('should return false for null input', () => {
      expect(isValidPhoneLength(null)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isValidPhoneLength(undefined)).toBe(false);
    });
  });

  // =============================================================================
  // ERROR MESSAGE HELPERS
  // =============================================================================

  describe('getContactValidationError', () => {
    it('should return empty string for null control', () => {
      const result = getContactValidationError(null, 'Field');
      expect(result).toBe('');
    });

    it('should return empty string for untouched control', () => {
      const control = new FormControl(null);
      control.setErrors({ required: true });
      const result = getContactValidationError(control, 'Field');
      expect(result).toBe('');
    });

    it('should return required error message', () => {
      const control = new FormControl(null);
      control.setErrors({ required: true });
      control.markAsTouched();
      const result = getContactValidationError(control, 'First Name');
      expect(result).toBe('First Name is required');
    });

    it('should return whitespace-only error message', () => {
      const control = new FormControl('   ');
      control.setErrors({ whitespaceOnly: true });
      control.markAsTouched();
      const result = getContactValidationError(control, 'Last Name');
      expect(result).toBe('Last Name cannot contain only spaces');
    });

    it('should return invalid contact name error message', () => {
      const control = new FormControl('Test123');
      control.setErrors({ invalidContactName: true });
      control.markAsTouched();
      const result = getContactValidationError(control, 'First Name');
      expect(result).toBe('First Name can only contain letters, spaces, hyphens, apostrophes, and periods');
    });

    it('should return invalid phone number error message', () => {
      const control = new FormControl('55555');
      control.setErrors({ invalidPhoneNumber: { message: 'Phone number must be 7, 8, 10, or 12 digits' } });
      control.markAsTouched();
      const result = getContactValidationError(control, 'Phone Number');
      expect(result).toBe('Phone number must be 7, 8, 10, or 12 digits');
    });

    it('should return fallback message for invalidPhoneNumber without message', () => {
      const control = new FormControl('bad');
      control.setErrors({ invalidPhoneNumber: {} });
      control.markAsTouched();
      const result = getContactValidationError(control, 'Phone');
      expect(result).toBe('Phone is invalid');
    });

    it('should return invalid email error message', () => {
      const control = new FormControl('invalid@');
      control.setErrors({ invalidEmail: true });
      control.markAsTouched();
      const result = getContactValidationError(control, 'Email');
      expect(result).toContain('Please enter a valid email address');
    });

    it('should return invalid salutation error message', () => {
      const control = new FormControl('Mr123');
      control.setErrors({ invalidSalutation: true });
      control.markAsTouched();
      const result = getContactValidationError(control, 'Salutation');
      expect(result).toBe('Salutation can only contain letters, spaces, and periods');
    });

    it('should return invalid title error message', () => {
      const control = new FormControl('CEO123');
      control.setErrors({ invalidTitle: true });
      control.markAsTouched();
      const result = getContactValidationError(control, 'Title');
      expect(result).toBe('Title can only contain letters, spaces, and common punctuation');
    });

    it('should return maxlength error message', () => {
      const control = new FormControl('Very Long Name That Exceeds Maximum Length');
      control.setErrors({ maxlength: { requiredLength: 50, actualLength: 60 } });
      control.markAsTouched();
      const result = getContactValidationError(control, 'First Name');
      expect(result).toBe('First Name cannot exceed 50 characters');
    });

    it('should return minlength error message', () => {
      const control = new FormControl('A');
      control.setErrors({ minlength: { requiredLength: 3, actualLength: 1 } });
      control.markAsTouched();
      const result = getContactValidationError(control, 'Name');
      expect(result).toBe('Name must be at least 3 characters');
    });

    it('should return empty string for valid touched control', () => {
      const control = new FormControl('John');
      control.markAsTouched();
      const result = getContactValidationError(control, 'First Name');
      expect(result).toBe('');
    });

    it('should use default fieldName "Field" when not provided', () => {
      const control = new FormControl(null);
      control.setErrors({ required: true });
      control.markAsTouched();
      const result = getContactValidationError(control);
      expect(result).toBe('Field is required');
    });
  });
});
