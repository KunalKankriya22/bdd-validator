import { FormControl, FormGroup } from '@angular/forms';
import {
  trayNumberValidator,
  itemCountValidator,
  effectiveDateNotPastForCreateValidator,
  terminationAfterEffectiveTrayValidator
} from './tray-definition.validator';

describe('TrayDefinitionValidators', () => {

  describe('trayNumberValidator', () => {
    let validate: ReturnType<typeof trayNumberValidator>;

    beforeEach(() => {
      validate = trayNumberValidator();
    });

    it('should return null for empty string', () => {
      expect(validate(new FormControl(''))).toBeNull();
    });

    it('should return null for null value', () => {
      expect(validate(new FormControl(null))).toBeNull();
    });

    it('should return null for valid single-char alphanumeric', () => {
      expect(validate(new FormControl('A'))).toBeNull();
    });

    it('should return null for valid 4-char alphanumeric', () => {
      expect(validate(new FormControl('AB12'))).toBeNull();
    });

    it('should return null for numeric-only within 4 chars', () => {
      expect(validate(new FormControl('1234'))).toBeNull();
    });

    it('should return trayNumberMaxLength error for value with more than 4 chars', () => {
      const result = validate(new FormControl('ABCDE'));
      expect(result).toEqual({ trayNumberMaxLength: true });
    });

    it('should return trayNumberInvalid error for value with special characters', () => {
      const result = validate(new FormControl('AB!C'));
      expect(result).toEqual({ trayNumberInvalid: true });
    });

    it('should return trayNumberInvalid error for value with spaces', () => {
      const result = validate(new FormControl('AB C'));
      expect(result).toEqual({ trayNumberInvalid: true });
    });

    it('should return trayNumberInvalid error for value with hyphen', () => {
      const result = validate(new FormControl('A-12'));
      expect(result).toEqual({ trayNumberInvalid: true });
    });

    it('should trim before checking length -- value "ABCDE" trimmed is still 5 chars', () => {
      const result = validate(new FormControl('ABCDE'));
      expect(result).toEqual({ trayNumberMaxLength: true });
    });
  });

  describe('itemCountValidator', () => {
    let validate: ReturnType<typeof itemCountValidator>;

    beforeEach(() => {
      validate = itemCountValidator();
    });

    it('should return null for null', () => {
      expect(validate(new FormControl(null))).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(validate(new FormControl(undefined))).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(validate(new FormControl(''))).toBeNull();
    });

    it('should return null for 0', () => {
      expect(validate(new FormControl(0))).toBeNull();
    });

    it('should return null for valid mid-range value', () => {
      expect(validate(new FormControl(500))).toBeNull();
    });

    it('should return null for maximum allowed value 9999', () => {
      expect(validate(new FormControl(9999))).toBeNull();
    });

    it('should return itemCountInvalid for non-numeric string', () => {
      const result = validate(new FormControl('abc'));
      expect(result).toEqual({ itemCountInvalid: true });
    });

    it('should return itemCountMin for negative value', () => {
      const result = validate(new FormControl(-1));
      expect(result).toEqual({ itemCountMin: true });
    });

    it('should return itemCountMax for value greater than 9999', () => {
      const result = validate(new FormControl(10000));
      expect(result).toEqual({ itemCountMax: true });
    });

    it('should return itemCountMax for very large value', () => {
      const result = validate(new FormControl(99999));
      expect(result).toEqual({ itemCountMax: true });
    });
  });

  describe('effectiveDateNotPastForCreateValidator', () => {
    let validate: ReturnType<typeof effectiveDateNotPastForCreateValidator>;

    beforeEach(() => {
      validate = effectiveDateNotPastForCreateValidator();
    });

    it('should return null for null value', () => {
      expect(validate(new FormControl(null))).toBeNull();
    });

    it('should return null for a future date', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(validate(new FormControl(future))).toBeNull();
    });

    it('should return null for today (same day, not in past)', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 0);
      expect(validate(new FormControl(today))).toBeNull();
    });

    it('should return dateInPast error for a date one year ago', () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      const result = validate(new FormControl(past));
      expect(result).toEqual({ dateInPast: true });
    });

    it('should return dateInPast error for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = validate(new FormControl(yesterday));
      expect(result).toEqual({ dateInPast: true });
    });
  });

  describe('terminationAfterEffectiveTrayValidator', () => {
    let validate: ReturnType<typeof terminationAfterEffectiveTrayValidator>;

    beforeEach(() => {
      validate = terminationAfterEffectiveTrayValidator();
    });

    it('should return null when effectiveDate control is missing', () => {
      const group = new FormGroup({ terminationDate: new FormControl(new Date()) });
      expect(validate(group)).toBeNull();
    });

    it('should return null when terminationDate control is missing', () => {
      const group = new FormGroup({ effectiveDate: new FormControl(new Date()) });
      expect(validate(group)).toBeNull();
    });

    it('should return null when both controls are missing', () => {
      const group = new FormGroup({});
      expect(validate(group)).toBeNull();
    });

    it('should return null and clear error when effectiveDate is null', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(new Date('2025-12-31'))
      });
      expect(validate(group)).toBeNull();
      expect(group.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(false);
    });

    it('should return null and clear error when terminationDate is null', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(new Date('2025-01-01')),
        terminationDate: new FormControl(null)
      });
      expect(validate(group)).toBeNull();
      expect(group.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(false);
    });

    it('should return null when both dates are null', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(null)
      });
      expect(validate(group)).toBeNull();
    });

    it('should set terminationBeforeEffective error on terminationDate when term < effective', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(new Date('2025-06-01')),
        terminationDate: new FormControl(new Date('2025-01-01'))
      });
      const result = validate(group);

      expect(result).toBeNull(); // Form itself stays valid
      expect(group.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(true);
    });

    it('should return null and not set error when termination equals effective', () => {
      const sameDate = new Date('2025-06-01');
      const group = new FormGroup({
        effectiveDate: new FormControl(sameDate),
        terminationDate: new FormControl(new Date('2025-06-01'))
      });
      expect(validate(group)).toBeNull();
      expect(group.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(false);
    });

    it('should return null and not set error when termination is after effective', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(new Date('2025-01-01')),
        terminationDate: new FormControl(new Date('2025-12-31'))
      });
      expect(validate(group)).toBeNull();
      expect(group.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(false);
    });

    it('should clear terminationBeforeEffective error while preserving other errors', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(new Date('2025-01-01')),
        terminationDate: new FormControl(new Date('2025-12-31'))
      });
      // Pre-set multiple errors
      group.get('terminationDate')?.setErrors({
        terminationBeforeEffective: true,
        required: true
      });

      validate(group);

      expect(group.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(false);
      expect(group.get('terminationDate')?.hasError('required')).toBe(true);
    });

    it('should handle dates that are the same day with different times', () => {
      const effective = new Date('2025-06-01T08:00:00');
      const termination = new Date('2025-06-01T17:00:00');
      const group = new FormGroup({
        effectiveDate: new FormControl(effective),
        terminationDate: new FormControl(termination)
      });
      expect(validate(group)).toBeNull();
      expect(group.get('terminationDate')?.hasError('terminationBeforeEffective')).toBe(false);
    });
  });
});
