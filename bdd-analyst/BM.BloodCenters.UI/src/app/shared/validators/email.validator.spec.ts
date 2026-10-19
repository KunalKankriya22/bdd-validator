import { FormControl } from '@angular/forms';
import { emailFormatValidator } from './email.validator';

describe('emailFormatValidator', () => {
  const validator = emailFormatValidator();

  describe('valid emails', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user-name@example.com',
      'user_name@example.com',
      'user@sub.domain.com',
      'user123@example.co',
      'user@example.org',
    ];

    validEmails.forEach(email => {
      it(`should accept "${email}"`, () => {
        const control = new FormControl(email);
        expect(validator(control)).toBeNull();
      });
    });
  });

  describe('invalid emails', () => {
    const invalidEmails = [
      'plainaddress',
      '@no-local-part.com',
      'user@',
      'user@.com',
      '.user@example.com',
      'user.@example.com',
      'user..name@example.com',
    ];

    invalidEmails.forEach(email => {
      it(`should reject "${email}"`, () => {
        const control = new FormControl(email);
        expect(validator(control)).toEqual({ emailFormat: true });
      });
    });
  });

  describe('edge cases', () => {
    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for undefined value', () => {
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });
  });
});
