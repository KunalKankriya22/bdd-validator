import { FormControl, FormGroup } from '@angular/forms';
import {
  collIdValidator,
  effectiveDateValidator,
  terminationAfterEffectiveValidator,
  collNameMaxLengthValidator,
  maxLengthValidatorWithMessage,
  contractIdValidator,
  stateCodeValidator,
  phoneNumberValidator,
  zipCodeValidator,
} from './collection-facility.validators';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';

describe('Collection Facility Validators', () => {

  describe('collIdValidator', () => {
    let validator: ReturnType<typeof collIdValidator>;

    beforeEach(() => {
      validator = collIdValidator();
    });

    it('should return null for valid 5-character alphanumeric ID', () => {
      const control = new FormControl('ABC12');
      expect(validator(control)).toBeNull();
    });

    it('should return null for 5-character alpha-only ID', () => {
      const control = new FormControl('ABCDE');
      expect(validator(control)).toBeNull();
    });

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

    it('should return collIdLength error for value shorter than 5 characters', () => {
      const control = new FormControl('ABC');
      expect(validator(control)).toEqual({ collIdLength: { requiredLength: 5, actualLength: 3 } });
    });

    it('should return collIdLength error for value longer than 5 characters', () => {
      const control = new FormControl('ABCDEF');
      expect(validator(control)).toEqual({ collIdLength: { requiredLength: 5, actualLength: 6 } });
    });

    it('should return collIdAllNumeric error for all-numeric 5-character value', () => {
      const control = new FormControl('12345');
      expect(validator(control)).toEqual({
        collIdAllNumeric: { message: 'Collection ID must not be all numeric' }
      });
    });

    it('should return null for 5-character value with at least one non-numeric character', () => {
      const control = new FormControl('1234A');
      expect(validator(control)).toBeNull();
    });

    it('should handle numeric input by converting via toString', () => {
      const control = new FormControl(12345);
      expect(validator(control)).toEqual({
        collIdAllNumeric: { message: 'Collection ID must not be all numeric' }
      });
    });

    it('should return collIdLength for single character', () => {
      const control = new FormControl('A');
      expect(validator(control)).toEqual({ collIdLength: { requiredLength: 5, actualLength: 1 } });
    });
  });

  describe('effectiveDateValidator', () => {
    it('should return null for empty value', () => {
      const validator = effectiveDateValidator();
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for undefined value', () => {
      const validator = effectiveDateValidator();
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty string', () => {
      const validator = effectiveDateValidator();
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for future date', () => {
      const validator = effectiveDateValidator();
      const control = new FormControl(moment().add(1, 'days'));
      expect(validator(control)).toBeNull();
    });

    it('should return null for today', () => {
      const validator = effectiveDateValidator();
      const control = new FormControl(moment().startOf('day'));
      expect(validator(control)).toBeNull();
    });

    it('should return dateInPast error for past date', () => {
      const validator = effectiveDateValidator();
      const control = new FormControl(moment().subtract(1, 'days'));
      expect(validator(control)).toEqual({
        dateInPast: { message: 'Effective Date cannot be earlier than today.' }
      });
    });

    describe('with isEditMode', () => {
      it('should return null for past date in edit mode', () => {
        const validator = effectiveDateValidator(undefined, () => true);
        const control = new FormControl(moment().subtract(30, 'days'));
        expect(validator(control)).toBeNull();
      });

      it('should validate normally when not in edit mode', () => {
        const validator = effectiveDateValidator(undefined, () => false);
        const control = new FormControl(moment().subtract(1, 'days'));
        expect(validator(control)).toEqual({
          dateInPast: { message: 'Effective Date cannot be earlier than today.' }
        });
      });
    });

    describe('with ChapterTimezoneService', () => {
      it('should use chapter local date when service is available', () => {
        const mockService = jasmine.createSpyObj<ChapterTimezoneService>(
          'ChapterTimezoneService',
          ['isChapterLocalDateAvailable', 'getChapterLocalDate']
        );
        const chapterDate = moment('2025-06-15').startOf('day');
        mockService.isChapterLocalDateAvailable.and.returnValue(true);
        mockService.getChapterLocalDate.and.returnValue(chapterDate);

        const validator = effectiveDateValidator(mockService);
        const control = new FormControl(moment('2025-06-01'));
        expect(validator(control)).toEqual({
          dateInPast: { message: 'Effective Date cannot be earlier than today.' }
        });
      });

      it('should fall back to browser date when chapter local date is not available', () => {
        const mockService = jasmine.createSpyObj<ChapterTimezoneService>(
          'ChapterTimezoneService',
          ['isChapterLocalDateAvailable', 'getChapterLocalDate']
        );
        mockService.isChapterLocalDateAvailable.and.returnValue(false);

        const validator = effectiveDateValidator(mockService);
        const control = new FormControl(moment().add(1, 'days'));
        expect(validator(control)).toBeNull();
      });

      it('should return null for date matching chapter local date', () => {
        const mockService = jasmine.createSpyObj<ChapterTimezoneService>(
          'ChapterTimezoneService',
          ['isChapterLocalDateAvailable', 'getChapterLocalDate']
        );
        const chapterDate = moment('2025-06-15').startOf('day');
        mockService.isChapterLocalDateAvailable.and.returnValue(true);
        mockService.getChapterLocalDate.and.returnValue(chapterDate);

        const validator = effectiveDateValidator(mockService);
        const control = new FormControl(moment('2025-06-15'));
        expect(validator(control)).toBeNull();
      });
    });
  });

  describe('terminationAfterEffectiveValidator', () => {
    let validator: ReturnType<typeof terminationAfterEffectiveValidator>;

    beforeEach(() => {
      validator = terminationAfterEffectiveValidator();
    });

    it('should return null when termination date is after effective date', () => {
      const group = new FormGroup({
        effDate: new FormControl(moment('2025-01-01')),
        termDate: new FormControl(moment('2025-12-31')),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when dates are equal', () => {
      const group = new FormGroup({
        effDate: new FormControl(moment('2025-06-15')),
        termDate: new FormControl(moment('2025-06-15')),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return terminationBeforeEffective when termination is before effective', () => {
      const group = new FormGroup({
        effDate: new FormControl(moment('2025-12-31')),
        termDate: new FormControl(moment('2025-01-01')),
      });
      expect(validator(group)).toEqual({
        terminationBeforeEffective: { message: 'Termination Date must be on or after Effective Date' }
      });
    });

    it('should return null when effDate control does not exist', () => {
      const group = new FormGroup({
        termDate: new FormControl(moment('2025-12-31')),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when termDate control does not exist', () => {
      const group = new FormGroup({
        effDate: new FormControl(moment('2025-01-01')),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when effective date is null', () => {
      const group = new FormGroup({
        effDate: new FormControl(null),
        termDate: new FormControl(moment('2025-12-31')),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when termination date is null', () => {
      const group = new FormGroup({
        effDate: new FormControl(moment('2025-01-01')),
        termDate: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when both dates are null', () => {
      const group = new FormGroup({
        effDate: new FormControl(null),
        termDate: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should handle string date values', () => {
      const group = new FormGroup({
        effDate: new FormControl('2025-12-31'),
        termDate: new FormControl('2025-01-01'),
      });
      expect(validator(group)).toEqual({
        terminationBeforeEffective: { message: 'Termination Date must be on or after Effective Date' }
      });
    });
  });

  describe('collNameMaxLengthValidator', () => {
    let validator: ReturnType<typeof collNameMaxLengthValidator>;

    beforeEach(() => {
      validator = collNameMaxLengthValidator();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for value within 100 characters', () => {
      const control = new FormControl('A'.repeat(100));
      expect(validator(control)).toBeNull();
    });

    it('should return maxlength error for value exceeding 100 characters without pipe', () => {
      const control = new FormControl('A'.repeat(101));
      expect(validator(control)).toEqual({
        maxlength: { requiredLength: 100, actualLength: 101, message: 'Cannot exceed 100 characters' }
      });
    });

    it('should allow up to 101 characters when pipe is present', () => {
      const control = new FormControl('A'.repeat(50) + '|' + 'B'.repeat(50));
      expect(validator(control)).toBeNull();
    });

    it('should return maxlength error for pipe value exceeding 101 characters', () => {
      const control = new FormControl('A'.repeat(51) + '|' + 'B'.repeat(50));
      expect(validator(control)).toEqual({
        maxlength: { requiredLength: 101, actualLength: 102 }
      });
    });

    it('should return null for short value with pipe', () => {
      const control = new FormControl('Name|Alias');
      expect(validator(control)).toBeNull();
    });

    it('should handle undefined value via optional chaining', () => {
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });
  });

  describe('maxLengthValidatorWithMessage', () => {
    it('should return null for empty value', () => {
      const validator = maxLengthValidatorWithMessage(50);
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const validator = maxLengthValidatorWithMessage(50);
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for value within max length', () => {
      const validator = maxLengthValidatorWithMessage(10);
      const control = new FormControl('short');
      expect(validator(control)).toBeNull();
    });

    it('should return null for value exactly at max length', () => {
      const validator = maxLengthValidatorWithMessage(5);
      const control = new FormControl('abcde');
      expect(validator(control)).toBeNull();
    });

    it('should return error for value exceeding max length', () => {
      const validator = maxLengthValidatorWithMessage(5);
      const control = new FormControl('abcdef');
      expect(validator(control)).toEqual({
        maxlength: {
          requiredLength: 5,
          actualLength: 6,
          message: 'Cannot exceed 5 characters'
        }
      });
    });

    it('should include correct max length in error message', () => {
      const validator = maxLengthValidatorWithMessage(100);
      const control = new FormControl('A'.repeat(101));
      const result = validator(control);
      expect(result?.['maxlength']?.message).toBe('Cannot exceed 100 characters');
    });

    it('should handle numeric input via toString', () => {
      const validator = maxLengthValidatorWithMessage(3);
      const control = new FormControl(12345);
      expect(validator(control)).toEqual({
        maxlength: {
          requiredLength: 3,
          actualLength: 5,
          message: 'Cannot exceed 3 characters'
        }
      });
    });
  });

  describe('contractIdValidator', () => {
    let validator: ReturnType<typeof contractIdValidator>;

    beforeEach(() => {
      validator = contractIdValidator();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for value within 9 characters', () => {
      const control = new FormControl('CONTRACT1');
      expect(validator(control)).toBeNull();
    });

    it('should return null for value exactly 9 characters', () => {
      const control = new FormControl('123456789');
      expect(validator(control)).toBeNull();
    });

    it('should return maxlength error for value exceeding 9 characters', () => {
      const control = new FormControl('1234567890');
      expect(validator(control)).toEqual({
        maxlength: { requiredLength: 9, actualLength: 10 }
      });
    });

    it('should return null for single character', () => {
      const control = new FormControl('A');
      expect(validator(control)).toBeNull();
    });

    it('should handle numeric input via toString', () => {
      const control = new FormControl(1234567890);
      expect(validator(control)).toEqual({
        maxlength: { requiredLength: 9, actualLength: 10 }
      });
    });
  });

  describe('stateCodeValidator', () => {
    let validator: ReturnType<typeof stateCodeValidator>;

    beforeEach(() => {
      validator = stateCodeValidator();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid 2-character state code', () => {
      const control = new FormControl('TX');
      expect(validator(control)).toBeNull();
    });

    it('should return null for value within 5 characters', () => {
      const control = new FormControl('TEXAS');
      expect(validator(control)).toBeNull();
    });

    it('should return maxlength error for value exceeding 5 characters', () => {
      const control = new FormControl('TEXASS');
      expect(validator(control)).toEqual({
        maxlength: { requiredLength: 5, actualLength: 6 }
      });
    });
  });

  describe('phoneNumberValidator', () => {
    let validator: ReturnType<typeof phoneNumberValidator>;

    beforeEach(() => {
      validator = phoneNumberValidator();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid phone number with digits only', () => {
      const control = new FormControl('1234567890');
      expect(validator(control)).toBeNull();
    });

    it('should return null for phone number with dashes', () => {
      const control = new FormControl('123-456-7890');
      expect(validator(control)).toBeNull();
    });

    it('should return null for phone number with parentheses', () => {
      const control = new FormControl('(123) 456-7890');
      expect(validator(control)).toBeNull();
    });

    it('should return null for phone number with plus sign', () => {
      const control = new FormControl('+1 123-456-7890');
      expect(validator(control)).toBeNull();
    });

    it('should return null for phone number with spaces', () => {
      const control = new FormControl('123 456 7890');
      expect(validator(control)).toBeNull();
    });

    it('should return error for phone with letters', () => {
      const control = new FormControl('123-ABC-7890');
      expect(validator(control)).toEqual({
        invalidPhoneNumber: { message: 'Invalid phone number format' }
      });
    });

    it('should return error for phone with special characters', () => {
      const control = new FormControl('123@456#7890');
      expect(validator(control)).toEqual({
        invalidPhoneNumber: { message: 'Invalid phone number format' }
      });
    });
  });

  describe('zipCodeValidator', () => {
    let validator: ReturnType<typeof zipCodeValidator>;

    beforeEach(() => {
      validator = zipCodeValidator();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid 5-digit ZIP code', () => {
      const control = new FormControl('75001');
      expect(validator(control)).toBeNull();
    });

    it('should return null for alphanumeric postal code within 15 characters', () => {
      const control = new FormControl('SW1A 1AA');
      expect(validator(control)).toBeNull();
    });

    it('should return null for value exactly 15 characters', () => {
      const control = new FormControl('A'.repeat(15));
      expect(validator(control)).toBeNull();
    });

    it('should return maxlength error for value exceeding 15 characters', () => {
      const control = new FormControl('A'.repeat(16));
      expect(validator(control)).toEqual({
        maxlength: { requiredLength: 15, actualLength: 16 }
      });
    });

    it('should handle undefined value via optional chaining', () => {
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });
  });
});
