import { FormControl, FormGroup } from '@angular/forms';
import {
  alphanumericValidator,
  terminationAfterEffectiveValidator,
  trimmedMaxLengthValidator,
  trimmedRequiredValidator,
  numericValidator,
  numericalValueValidator,
  integerValidator
} from './lab-master-within-code.validator';
import moment from 'moment';

describe('Lab Master Within Code Validators', () => {

  describe('alphanumericValidator', () => {
    const validator = alphanumericValidator();

    it('should return null for uppercase letters', () => {
      const control = new FormControl('TEST1');
      expect(validator(control)).toBeNull();
    });

    it('should return null for lowercase letters', () => {
      const control = new FormControl('test1');
      expect(validator(control)).toBeNull();
    });

    it('should return null for digits only', () => {
      const control = new FormControl('1234');
      expect(validator(control)).toBeNull();
    });

    it('should return error for special characters', () => {
      const control = new FormControl('TEST@123');
      expect(validator(control)).toEqual({ alphanumeric: true });
    });

    it('should return error for hyphen', () => {
      const control = new FormControl('TEST-1');
      expect(validator(control)).toEqual({ alphanumeric: true });
    });

    it('should return error for space', () => {
      const control = new FormControl('TEST 1');
      expect(validator(control)).toEqual({ alphanumeric: true });
    });
  });

  describe('trimmedRequiredValidator', () => {
    const validator = trimmedRequiredValidator();

    it('should return error for whitespace only', () => {
      const control = new FormControl('    ');
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });

    it('should return error for null', () => {
      const control = new FormControl(null);
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });
  });

  describe('trimmedMaxLengthValidator', () => {
    it('should return null at exactly max length', () => {
      const validator = trimmedMaxLengthValidator(5);
      const control = new FormControl('ABCDE');
      expect(validator(control)).toBeNull();
    });

    it('should return error exceeding max length', () => {
      const validator = trimmedMaxLengthValidator(5);
      const control = new FormControl('ABCDEF');
      expect(validator(control)).toEqual({ trimmedMaxLength: { maxLength: 5, actualLength: 6 } });
    });

    it('should trim before checking length for max 500', () => {
      const validator = trimmedMaxLengthValidator(500);
      const control = new FormControl('A'.repeat(501));
      expect(validator(control)).toEqual({ trimmedMaxLength: { maxLength: 500, actualLength: 501 } });
    });
  });

  describe('numericValidator', () => {
    const validator = numericValidator();

    it('should return null for zero', () => {
      const control = new FormControl(0);
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid 1-digit number', () => {
      const control = new FormControl('5');
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid 4-digit number', () => {
      const control = new FormControl('9999');
      expect(validator(control)).toBeNull();
    });

    it('should return null for 0', () => {
      const control = new FormControl('0');
      expect(validator(control)).toBeNull();
    });

    it('should return error for 5-digit number (exceeds 9999)', () => {
      const control = new FormControl('10000');
      expect(validator(control)).toEqual({ numeric: true });
    });

    it('should return error for non-numeric string', () => {
      const control = new FormControl('ABC');
      expect(validator(control)).toEqual({ numeric: true });
    });

    it('should return error for negative number', () => {
      const control = new FormControl('-1');
      expect(validator(control)).toEqual({ numeric: true });
    });

    it('should return error for decimal number', () => {
      const control = new FormControl('1.5');
      expect(validator(control)).toEqual({ numeric: true });
    });

    it('should return null for numeric value stored as number', () => {
      const control = new FormControl(1234);
      expect(validator(control)).toBeNull();
    });

    it('should return null for whitespace-padded valid number', () => {
      const control = new FormControl(' 123 ');
      expect(validator(control)).toBeNull();
    });
  });

  describe('terminationAfterEffectiveValidator', () => {
    function createFormGroup(effectiveDate: any, terminationDate: any): FormGroup {
      return new FormGroup(
        {
          effectiveDate: new FormControl(effectiveDate),
          terminationDate: new FormControl(terminationDate)
        },
        { validators: terminationAfterEffectiveValidator() }
      );
    }

    it('should return error when termination is before effective', () => {
      const form = createFormGroup(moment('2028-06-01'), moment('2028-03-01'));
      form.updateValueAndValidity();
      expect(form.errors).toEqual({ terminationBeforeEffective: true });
    });

    it('should set terminationDate control error', () => {
      const form = createFormGroup(moment('2028-06-01'), moment('2028-03-01'));
      form.updateValueAndValidity();
      expect(form.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(true);
    });

    it('should clear terminationDate error when corrected', () => {
      const form = createFormGroup(moment('2028-06-01'), moment('2028-03-01'));
      form.updateValueAndValidity();
      expect(form.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(true);

      form.get('terminationDate')?.setValue(moment('2029-01-01'));
      form.updateValueAndValidity();
      expect(form.get('terminationDate')?.hasError('terminationBeforeEffective')).toBeFalsy();
    });

    it('should work with Date objects', () => {
      const effective = new Date('2028-06-01');
      const termination = new Date('2028-01-01');
      const form = createFormGroup(effective, termination);
      form.updateValueAndValidity();
      expect(form.errors).toEqual({ terminationBeforeEffective: true });
    });
  });

  describe('numericalValueValidator', () => {
    const validator = numericalValueValidator();

    it('should return null for lone minus sign (partial input)', () => {
      const control = new FormControl('-');
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid positive integer', () => {
      const control = new FormControl('1234567');
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid positive decimal', () => {
      const control = new FormControl('123.456');
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid negative integer', () => {
      const control = new FormControl('-9999999');
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid negative decimal', () => {
      const control = new FormControl('-123.456');
      expect(validator(control)).toBeNull();
    });

    it('should return null for zero', () => {
      const control = new FormControl(0);
      expect(validator(control)).toBeNull();
    });

    it('should return null for numeric value stored as number', () => {
      const control = new FormControl(12345);
      expect(validator(control)).toBeNull();
    });

    it('should return error for too many integer digits (> 7)', () => {
      const control = new FormControl('12345678');
      expect(validator(control)).toEqual({ numericalValue: true });
    });

    it('should return error for too many decimal digits (> 3)', () => {
      const control = new FormControl('123.4567');
      expect(validator(control)).toEqual({ numericalValue: true });
    });

    it('should return error for non-numeric string', () => {
      const control = new FormControl('ABC');
      expect(validator(control)).toEqual({ numericalValue: true });
    });

    it('should return error for value with letters mixed in', () => {
      const control = new FormControl('12e5');
      expect(validator(control)).toEqual({ numericalValue: true });
    });

    it('should return null for exactly 1 decimal digit', () => {
      const control = new FormControl('100.5');
      expect(validator(control)).toBeNull();
    });

    it('should return null for exactly 3 decimal digits', () => {
      const control = new FormControl('100.123');
      expect(validator(control)).toBeNull();
    });
  });

  describe('integerValidator', () => {
    const validator = integerValidator();

    it('should return null for lone minus sign (partial input)', () => {
      const control = new FormControl('-');
      expect(validator(control)).toBeNull();
    });

    it('should return null for integer stored as number', () => {
      const control = new FormControl(999);
      expect(validator(control)).toBeNull();
    });

    it('should return error for decimal number', () => {
      const control = new FormControl('1.5');
      expect(validator(control)).toEqual({ integer: true });
    });

    it('should return error for non-numeric string', () => {
      const control = new FormControl('ABC');
      expect(validator(control)).toEqual({ integer: true });
    });

    it('should return error for alphanumeric string', () => {
      const control = new FormControl('12a');
      expect(validator(control)).toEqual({ integer: true });
    });

    it('should return null for large integer', () => {
      const control = new FormControl('9999');
      expect(validator(control)).toBeNull();
    });
  });
});
