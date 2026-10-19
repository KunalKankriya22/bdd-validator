import { FormControl, FormGroup } from '@angular/forms';
import { minMaxTempValidator } from './min-max-temp.validator';

describe('minMaxTempValidator', () => {
  let validator: ReturnType<typeof minMaxTempValidator>;

  beforeEach(() => {
    validator = minMaxTempValidator();
  });

  function buildGroup(minTemp: any, maxTemp: any): FormGroup {
    return new FormGroup({
      minTemp: new FormControl(minTemp),
      maxTemp: new FormControl(maxTemp),
    });
  }

  describe('when both values are valid and min <= max', () => {
    it('should return null when min equals max', () => {
      const group = buildGroup(5, 5);
      expect(validator(group)).toBeNull();
    });

    it('should return null when min is less than max', () => {
      const group = buildGroup(2, 10);
      expect(validator(group)).toBeNull();
    });

    it('should clear tempRangeInvalid errors from controls', () => {
      const group = buildGroup(2, 10);
      group.get('minTemp')!.setErrors({ tempRangeInvalid: true, otherError: true });
      group.get('maxTemp')!.setErrors({ tempRangeInvalid: true });

      validator(group);

      expect(group.get('minTemp')!.errors).toEqual({ otherError: true });
      expect(group.get('maxTemp')!.errors).toBeNull();
    });
  });

  describe('when min > max', () => {
    it('should return minTempGreaterThanMax error', () => {
      const group = buildGroup(20, 5);
      expect(validator(group)).toEqual({ minTempGreaterThanMax: true });
    });

    it('should set tempRangeInvalid on both controls', () => {
      const group = buildGroup(20, 5);
      validator(group);

      expect(group.get('minTemp')!.errors).toEqual(
        jasmine.objectContaining({ tempRangeInvalid: true })
      );
      expect(group.get('maxTemp')!.errors).toEqual(
        jasmine.objectContaining({ tempRangeInvalid: true })
      );
    });

    it('should preserve existing errors on controls when setting tempRangeInvalid', () => {
      const group = buildGroup(20, 5);
      group.get('minTemp')!.setErrors({ required: true });
      group.get('maxTemp')!.setErrors({ required: true });

      validator(group);

      expect(group.get('minTemp')!.errors).toEqual({ required: true, tempRangeInvalid: true });
      expect(group.get('maxTemp')!.errors).toEqual({ required: true, tempRangeInvalid: true });
    });
  });

  describe('when values are null, undefined, or empty', () => {
    it('should return null when minTemp is null', () => {
      const group = buildGroup(null, 10);
      expect(validator(group)).toBeNull();
    });

    it('should return null when maxTemp is null', () => {
      const group = buildGroup(10, null);
      expect(validator(group)).toBeNull();
    });

    it('should return null when both are null', () => {
      const group = buildGroup(null, null);
      expect(validator(group)).toBeNull();
    });

    it('should return null when minTemp is undefined', () => {
      const group = buildGroup(undefined, 10);
      expect(validator(group)).toBeNull();
    });

    it('should return null when maxTemp is undefined', () => {
      const group = buildGroup(10, undefined);
      expect(validator(group)).toBeNull();
    });

    it('should return null when minTemp is empty string', () => {
      const group = buildGroup('', 10);
      expect(validator(group)).toBeNull();
    });

    it('should return null when maxTemp is empty string', () => {
      const group = buildGroup(10, '');
      expect(validator(group)).toBeNull();
    });

    it('should clear tempRangeInvalid from controls when values are null', () => {
      const group = buildGroup(null, null);
      group.get('minTemp')!.setErrors({ tempRangeInvalid: true, otherError: true });
      group.get('maxTemp')!.setErrors({ tempRangeInvalid: true });

      validator(group);

      expect(group.get('minTemp')!.errors).toEqual({ otherError: true });
      expect(group.get('maxTemp')!.errors).toBeNull();
    });

    it('should set control errors to null when only tempRangeInvalid existed', () => {
      const group = buildGroup(null, 10);
      group.get('minTemp')!.setErrors({ tempRangeInvalid: true });

      validator(group);

      expect(group.get('minTemp')!.errors).toBeNull();
    });
  });

  describe('when values are non-numeric strings', () => {
    it('should return null when minTemp is NaN string', () => {
      const group = buildGroup('abc', 10);
      expect(validator(group)).toBeNull();
    });

    it('should return null when maxTemp is NaN string', () => {
      const group = buildGroup(10, 'xyz');
      expect(validator(group)).toBeNull();
    });

    it('should return null when both are NaN strings', () => {
      const group = buildGroup('abc', 'xyz');
      expect(validator(group)).toBeNull();
    });
  });

  describe('edge cases with numeric strings', () => {
    it('should validate numeric strings correctly', () => {
      const group = buildGroup('5', '10');
      expect(validator(group)).toBeNull();
    });

    it('should detect invalid range with numeric strings', () => {
      const group = buildGroup('20', '5');
      expect(validator(group)).toEqual({ minTempGreaterThanMax: true });
    });

    it('should handle negative temperatures', () => {
      const group = buildGroup(-10, -5);
      expect(validator(group)).toBeNull();
    });

    it('should detect invalid range with negative temperatures', () => {
      const group = buildGroup(-5, -10);
      expect(validator(group)).toEqual({ minTempGreaterThanMax: true });
    });

    it('should handle zero values', () => {
      const group = buildGroup(0, 0);
      expect(validator(group)).toBeNull();
    });

    it('should handle decimal values', () => {
      const group = buildGroup(36.5, 37.2);
      expect(validator(group)).toBeNull();
    });
  });
});
