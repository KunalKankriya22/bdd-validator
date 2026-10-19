import { FormControl, FormGroup } from '@angular/forms';
import {
  alphanumericValidator,
  terminationAfterEffectiveValidator,
  trimmedMaxLengthValidator,
  trimmedRequiredValidator
} from './lab-master-code-type.validator';
import moment from 'moment';

describe('Lab Master Code Type Validators', () => {

  describe('alphanumericValidator', () => {
    const validator = alphanumericValidator();



    it('should return null for uppercase letters only', () => {
      const control = new FormControl('ABCDE');
      expect(validator(control)).toBeNull();
    });

    it('should return null for lowercase letters only', () => {
      const control = new FormControl('abcde');
      expect(validator(control)).toBeNull();
    });

    it('should return null for digits only', () => {
      const control = new FormControl('12345');
      expect(validator(control)).toBeNull();
    });

    it('should return null for mixed alphanumeric', () => {
      const control = new FormControl('ABC12');
      expect(validator(control)).toBeNull();
    });

    it('should return error for hyphen character', () => {
      const control = new FormControl('AB-12');
      expect(validator(control)).toEqual({ alphanumeric: true });
    });

    it('should return error for space character', () => {
      const control = new FormControl('AB 12');
      expect(validator(control)).toEqual({ alphanumeric: true });
    });

    it('should return error for special characters', () => {
      const control = new FormControl('AB@12');
      expect(validator(control)).toEqual({ alphanumeric: true });
    });

    it('should return error for underscore character', () => {
      const control = new FormControl('AB_12');
      expect(validator(control)).toEqual({ alphanumeric: true });
    });
  });

  describe('trimmedRequiredValidator', () => {
    const validator = trimmedRequiredValidator();


    it('should return error for whitespace-only string', () => {
      const control = new FormControl('   ');
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });

    it('should return error for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toEqual({ trimmedRequired: true });
    });


  });

  describe('trimmedMaxLengthValidator', () => {


    it('should return null when trimmed length is within limit', () => {
      const validator = trimmedMaxLengthValidator(5);
      const control = new FormControl('ABC');
      expect(validator(control)).toBeNull();
    });

    it('should return null at exactly max length', () => {
      const validator = trimmedMaxLengthValidator(5);
      const control = new FormControl('ABCDE');
      expect(validator(control)).toBeNull();
    });

    it('should return error when trimmed length exceeds max', () => {
      const validator = trimmedMaxLengthValidator(5);
      const control = new FormControl('ABCDEF');
      expect(validator(control)).toEqual({ trimmedMaxLength: { maxLength: 5, actualLength: 6 } });
    });

    it('should trim before checking length', () => {
      const validator = trimmedMaxLengthValidator(5);
      const control = new FormControl('  ABCDE  ');
      expect(validator(control)).toBeNull();
    });

    it('should detect length violation after trimming', () => {
      const validator = trimmedMaxLengthValidator(5);
      const control = new FormControl('  ABCDEF  ');
      expect(validator(control)).toEqual({ trimmedMaxLength: { maxLength: 5, actualLength: 6 } });
    });

    it('should work with max length of 50', () => {
      const validator = trimmedMaxLengthValidator(50);
      const control = new FormControl('A'.repeat(51));
      expect(validator(control)).toEqual({ trimmedMaxLength: { maxLength: 50, actualLength: 51 } });
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






    it('should return error when termination is before effective date', () => {
      const form = createFormGroup(moment('2026-12-31'), moment('2026-04-15'));
      form.updateValueAndValidity();
      expect(form.errors).toEqual({ terminationBeforeEffective: true });
    });

    it('should set terminationDate control error when termination is before effective', () => {
      const form = createFormGroup(moment('2026-12-31'), moment('2026-04-15'));
      form.updateValueAndValidity();
      expect(form.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(true);
    });

    it('should clear terminationDate control error when dates become valid', () => {
      const form = createFormGroup(moment('2026-12-31'), moment('2026-04-15'));
      form.updateValueAndValidity();
      expect(form.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(true);

      // Fix the date order
      form.get('terminationDate')?.setValue(moment('2027-01-01'));
      form.updateValueAndValidity();
      expect(form.get('terminationDate')?.hasError('terminationBeforeEffective')).toBeFalsy();
    });

    it('should work with Date objects instead of moment', () => {
      const effective = new Date('2026-04-15');
      const termination = new Date('2026-01-01');
      const form = createFormGroup(effective, termination);
      form.updateValueAndValidity();
      expect(form.errors).toEqual({ terminationBeforeEffective: true });
    });
  });
});
