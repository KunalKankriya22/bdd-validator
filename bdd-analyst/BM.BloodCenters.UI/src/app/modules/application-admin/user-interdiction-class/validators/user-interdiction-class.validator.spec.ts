import { FormControl, FormGroup } from '@angular/forms';
import {
  trimmedRequiredValidator,
  trimmedMaxLengthValidator,
  terminationAfterEffectiveValidator,
} from './user-interdiction-class.validator';
import moment from 'moment';

describe('User Interdiction Class Validators (re-exports)', () => {

  describe('trimmedRequiredValidator', () => {
    let validator: ReturnType<typeof trimmedRequiredValidator>;

    beforeEach(() => {
      validator = trimmedRequiredValidator();
    });

    it('should return null for non-empty trimmed string', () => {
      const control = new FormControl('valid value');
      expect(validator(control)).toBeNull();
    });

    it('should return error for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });

    it('should return error for undefined value', () => {
      const control = new FormControl(undefined);
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });

    it('should return error for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });

    it('should return error for whitespace-only string', () => {
      const control = new FormControl('   ');
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });

    it('should return error for tab-only string', () => {
      const control = new FormControl('\t\t');
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });

    it('should return error for non-string falsy value (0)', () => {
      const control = new FormControl(0);
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });

    it('should return error for non-string truthy value (number)', () => {
      const control = new FormControl(42);
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });

    it('should pass for string with leading/trailing spaces but content', () => {
      const control = new FormControl('  hello  ');
      expect(validator(control)).toBeNull();
    });
  });

  describe('trimmedMaxLengthValidator', () => {
    it('should return null when trimmed value is within max length', () => {
      const validator = trimmedMaxLengthValidator(10);
      const control = new FormControl('short');
      expect(validator(control)).toBeNull();
    });

    it('should return null when trimmed value is exactly max length', () => {
      const validator = trimmedMaxLengthValidator(5);
      const control = new FormControl('abcde');
      expect(validator(control)).toBeNull();
    });

    it('should return error when trimmed value exceeds max length', () => {
      const validator = trimmedMaxLengthValidator(5);
      const control = new FormControl('abcdef');
      expect(validator(control)).toEqual({
        trimmedMaxLength: { maxLength: 5, actualLength: 6 }
      });
    });

    it('should trim whitespace before checking length', () => {
      const validator = trimmedMaxLengthValidator(5);
      const control = new FormControl('  abc  ');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const validator = trimmedMaxLengthValidator(10);
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty string', () => {
      const validator = trimmedMaxLengthValidator(10);
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for non-string value (number)', () => {
      const validator = trimmedMaxLengthValidator(10);
      const control = new FormControl(12345);
      expect(validator(control)).toBeNull();
    });

    it('should return null for undefined value', () => {
      const validator = trimmedMaxLengthValidator(10);
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });
  });

  describe('terminationAfterEffectiveValidator', () => {
    let validator: ReturnType<typeof terminationAfterEffectiveValidator>;

    beforeEach(() => {
      validator = terminationAfterEffectiveValidator();
    });

    it('should return null when both dates are valid and termination is after effective', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(moment('2025-01-01')),
        terminationDate: new FormControl(moment('2025-12-31')),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when termination date equals effective date', () => {
      const date = moment('2025-06-15');
      const group = new FormGroup({
        effectiveDate: new FormControl(date.clone()),
        terminationDate: new FormControl(date.clone()),
      });
      expect(validator(group)).toBeNull();
    });

    it('should set terminationBeforeEffective error on control when termination is before effective', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(moment('2025-06-15')),
        terminationDate: new FormControl(moment('2025-01-01')),
      });
      validator(group);
      expect(group.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);
    });

    it('should return null at form level even when termination is before effective', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(moment('2025-06-15')),
        terminationDate: new FormControl(moment('2025-01-01')),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when effective date is null', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(moment('2025-12-31')),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when termination date is null', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(moment('2025-01-01')),
        terminationDate: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when both dates are null', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when effectiveDate control does not exist', () => {
      const group = new FormGroup({
        terminationDate: new FormControl(moment('2025-12-31')),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when terminationDate control does not exist', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(moment('2025-01-01')),
      });
      expect(validator(group)).toBeNull();
    });

    it('should handle non-moment date values (string dates)', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl('2025-01-01'),
        terminationDate: new FormControl('2025-12-31'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should clear terminationBeforeEffective error when dates become valid', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(moment('2025-06-15')),
        terminationDate: new FormControl(moment('2025-01-01')),
      });

      // First run sets the error
      validator(group);
      expect(group.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);

      // Update to valid dates
      group.get('terminationDate')!.setValue(moment('2025-12-31'));
      validator(group);
      expect(group.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(false);
    });

    it('should clear terminationBeforeEffective error when termination date becomes null', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(moment('2025-06-15')),
        terminationDate: new FormControl(moment('2025-01-01')),
      });

      // First run sets the error
      validator(group);
      expect(group.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);

      // Clear termination date
      group.get('terminationDate')!.setValue(null);
      validator(group);
      expect(group.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(false);
    });
  });
});
