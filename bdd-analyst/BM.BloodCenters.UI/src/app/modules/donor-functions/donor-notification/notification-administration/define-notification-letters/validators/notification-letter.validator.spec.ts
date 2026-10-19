import { FormControl, FormGroup } from '@angular/forms';
import moment from 'moment';

import {
  effectiveDateValidator,
  terminationAfterEffectiveValidator,
  templateVariableValidator,
  letterCodeFormatValidator,
  getValidationErrorMessage
} from './notification-letter.validator';
import { TemplateVariable } from '../models/notification-letter.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('NotificationLetterValidators', () => {
  describe('effectiveDateValidator', () => {
    it('should pass for today', () => {
      const control = new FormControl(new Date());
      const validator = effectiveDateValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for future date', () => {
      const futureDate = moment().add(1, 'day').toDate();
      const control = new FormControl(futureDate);
      const validator = effectiveDateValidator();

      expect(validator(control)).toBeNull();
    });

    it('should fail for past date', () => {
      const pastDate = moment().subtract(1, 'day').toDate();
      const control = new FormControl(pastDate);
      const validator = effectiveDateValidator();

      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['dateInPast']).toBeDefined();
    });

    it('should pass for null value', () => {
      const control = new FormControl(null);
      const validator = effectiveDateValidator();

      expect(validator(control)).toBeNull();
    });

    it('should fail for invalid date', () => {
      const invalidDate = moment('invalid');
      const control = new FormControl(invalidDate);
      const validator = effectiveDateValidator();

      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['invalidDate']).toBeDefined();
    });

    it('should use chapter timezone when provided', () => {
      // Mock chapter local date to be May 13, 2026
      const mockChapterDate = moment('2026-05-13').startOf('day');
      spyOn<any>(DateFieldValidationUtility, 'getToday').and.returnValue(mockChapterDate);

      // Test date is May 13, 2026 (same as chapter date - should pass)
      const testDate = moment('2026-05-13').toDate();
      const control = new FormControl(testDate);
      const validator = effectiveDateValidator('+05:30');

      expect(validator(control)).toBeNull();
    });

    it('should fail when date is before chapter local date', () => {
      // Mock chapter local date to be May 13, 2026
      const mockChapterDate = moment('2026-05-13').startOf('day');
      spyOn<any>(DateFieldValidationUtility, 'getToday').and.returnValue(mockChapterDate);

      // Test date is May 12, 2026 (before chapter date - should fail)
      const testDate = moment('2026-05-12').toDate();
      const control = new FormControl(testDate);
      const validator = effectiveDateValidator('+05:30');

      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['dateInPast']).toBeDefined();
    });

    it('should pass when date is after chapter local date', () => {
      // Mock chapter local date to be May 13, 2026
      const mockChapterDate = moment('2026-05-13').startOf('day');
      spyOn<any>(DateFieldValidationUtility, 'getToday').and.returnValue(mockChapterDate);

      // Test date is May 14, 2026 (after chapter date - should pass)
      const testDate = moment('2026-05-14').toDate();
      const control = new FormControl(testDate);
      const validator = effectiveDateValidator('+05:30');

      expect(validator(control)).toBeNull();
    });
  });

  describe('letterCodeFormatValidator', () => {
    it('should pass for valid uppercase alphanumeric code', () => {
      const control = new FormControl('BDAY123');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for code with underscores within max length', () => {
      const control = new FormControl('DON_BDAY');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for code with hyphens within max length', () => {
      const control = new FormControl('DON-BDAY');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for mixed valid characters within max length', () => {
      const control = new FormControl('DON_BD-24');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for lowercase letters (no format validation)', () => {
      const control = new FormControl('donor_bday');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for codes with spaces (no format validation)', () => {
      const control = new FormControl('DONOR BDAY');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for codes with special characters (no format validation)', () => {
      const control = new FormControl('DON@BDAY');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should fail for codes exceeding max length', () => {
      const longCode = 'A'.repeat(11); // 11 characters exceeds max of 10
      const control = new FormControl(longCode);
      const validator = letterCodeFormatValidator();

      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['letterCodeTooLong']).toBeDefined();
    });

    it('should pass for code at max length (10 chars)', () => {
      const maxCode = 'A'.repeat(10); // 10 characters
      const control = new FormControl(maxCode);
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for null value', () => {
      const control = new FormControl(null);
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for empty string', () => {
      const control = new FormControl('');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for letter codes with periods (e.g., 18.03)', () => {
      const control = new FormControl('18.03');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for letter codes with multiple periods (e.g., 09.18)', () => {
      const control = new FormControl('09.18');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for letter codes with periods and letters (e.g., WB.1LTR)', () => {
      const control = new FormControl('WB.1LTR');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for lowercase letters after removing format validation', () => {
      const control = new FormControl('18.03a');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });

    it('should pass for special characters after removing format validation', () => {
      const control = new FormControl('18@03');
      const validator = letterCodeFormatValidator();

      expect(validator(control)).toBeNull();
    });



  });

  describe('terminationAfterEffectiveValidator', () => {
    it('should pass when termination is after effective', () => {
      const form = new FormGroup({
        effectiveDate: new FormControl(new Date('2025-01-01')),
        terminationDate: new FormControl(new Date('2025-12-31'))
      });

      const validator = terminationAfterEffectiveValidator();
      expect(validator(form)).toBeNull();
    });

    it('should fail when termination is before effective', () => {
      const form = new FormGroup({
        effectiveDate: new FormControl(new Date('2025-12-31')),
        terminationDate: new FormControl(new Date('2025-01-01'))
      });

      const validator = terminationAfterEffectiveValidator();
      const result = validator(form);

      expect(result).not.toBeNull();
      expect(result?.['terminationBeforeEffective']).toBeDefined();
    });


    it('should pass when termination is null', () => {
      const form = new FormGroup({
        effectiveDate: new FormControl(new Date('2025-01-01')),
        terminationDate: new FormControl(null)
      });

      const validator = terminationAfterEffectiveValidator();
      expect(validator(form)).toBeNull();
    });
  });

  describe('templateVariableValidator', () => {
    const allowedVariables: TemplateVariable[] = [
      {
        name: 'DONOR_NAME',
        placeholder: '&&DONOR_NAME&&',
        description: 'Donor name',
        example: 'John Doe'
      },
      {
        name: 'APPOINTMENT_DATE',
        placeholder: '&&APPOINTMENT_DATE&&',
        description: 'Appointment date',
        example: '01-JAN-2025'
      }
    ];

    it('should pass for valid template variables', () => {
      const control = new FormControl('Dear &&DONOR_NAME&&, your appointment is &&APPOINTMENT_DATE&&');
      const validator = templateVariableValidator(allowedVariables);

      expect(validator(control)).toBeNull();
    });

    it('should fail for invalid template variables', () => {
      const control = new FormControl('Dear &&INVALID_VAR&&, welcome!');
      const validator = templateVariableValidator(allowedVariables);

      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['invalidTemplateVariables']).toBeDefined();
      expect(result?.['invalidTemplateVariables'].invalidVariables).toContain('INVALID_VAR');
    });

    it('should pass for text without template variables', () => {
      const control = new FormControl('Dear donor, welcome!');
      const validator = templateVariableValidator(allowedVariables);

      expect(validator(control)).toBeNull();
    });

    it('should pass for empty value', () => {
      const control = new FormControl('');
      const validator = templateVariableValidator(allowedVariables);

      expect(validator(control)).toBeNull();
    });

    it('should pass for null value', () => {
      const control = new FormControl(null);
      const validator = templateVariableValidator(allowedVariables);

      expect(validator(control)).toBeNull();
    });
  });

  describe('getValidationErrorMessage', () => {
    it('should return message for required error', () => {
      const errors = { required: true };
      expect(getValidationErrorMessage(errors)).toBe('This field is required');
    });

    it('should return message for dateInPast error', () => {
      const errors = { dateInPast: { value: '01-JAN-2024' } };
      expect(getValidationErrorMessage(errors)).toBe('Date cannot be in the past');
    });


    it('should return message for terminationBeforeEffective error', () => {
      const errors = {
        terminationBeforeEffective: {
          effectiveDate: '01-JAN-2025',
          terminationDate: '01-DEC-2024'
        }
      };
      expect(getValidationErrorMessage(errors)).toBe('Termination date must be after effective date');
    });

    it('should return message for invalidTemplateVariables error', () => {
      const errors = {
        invalidTemplateVariables: {
          invalidVariables: ['INVALID_VAR'],
          message: 'Invalid template variables: INVALID_VAR'
        }
      };
      expect(getValidationErrorMessage(errors)).toBe('Invalid template variables: INVALID_VAR');
    });

    it('should return message for letterCodeInvalidFormat error', () => {
      const errors = { letterCodeInvalidFormat: { value: 'invalid@code' } };
      expect(getValidationErrorMessage(errors)).toBe('Letter code must contain only uppercase letters, numbers, periods, underscores, and hyphens');
    });

    it('should return message for letterCodeTooLong error', () => {
      const errors = { letterCodeTooLong: { maxLength: 20, actualLength: 25 } };
      expect(getValidationErrorMessage(errors)).toBe('Letter code is too long (max 20 characters)');
    });

    it('should return message for maxlength error', () => {
      const errors = { maxlength: { requiredLength: 100, actualLength: 150 } };
      expect(getValidationErrorMessage(errors)).toBe('Maximum length is 100 characters (current: 150)');
    });

    it('should return message for matDatepickerParse error', () => {
      const errors = { matDatepickerParse: { text: 'invalid' } };
      expect(getValidationErrorMessage(errors)).toBe('Invalid date format');
    });

    it('should return default message for unknown error', () => {
      const errors = { unknownError: true };
      expect(getValidationErrorMessage(errors)).toBe('Invalid value');
    });
  });
});
