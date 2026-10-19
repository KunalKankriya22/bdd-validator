import { FormControl } from '@angular/forms';
import {
  positiveIntegerValidator,
  rangeValidator,
} from './valid-scan-interface.validator';

// =============================================================================
// positiveIntegerValidator
// =============================================================================

describe('positiveIntegerValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, positiveIntegerValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for undefined value', () => {
    const control = new FormControl(undefined, positiveIntegerValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', positiveIntegerValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for positive integer', () => {
    const control = new FormControl(5, positiveIntegerValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for positive integer as string', () => {
    const control = new FormControl('10', positiveIntegerValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for large positive integer', () => {
    const control = new FormControl(99999, positiveIntegerValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error for zero', () => {
    const control = new FormControl(0, positiveIntegerValidator());
    expect(control.hasError('positiveInteger')).toBe(true);
  });

  it('should return error for string zero', () => {
    const control = new FormControl('0', positiveIntegerValidator());
    expect(control.hasError('positiveInteger')).toBe(true);
  });

  it('should return error for negative number', () => {
    const control = new FormControl(-1, positiveIntegerValidator());
    expect(control.hasError('positiveInteger')).toBe(true);
  });

  it('should return error for negative number as string', () => {
    const control = new FormControl('-5', positiveIntegerValidator());
    expect(control.hasError('positiveInteger')).toBe(true);
  });

  it('should return error for decimal number', () => {
    const control = new FormControl(3.5, positiveIntegerValidator());
    expect(control.hasError('positiveInteger')).toBe(true);
  });

  it('should return error for decimal number as string', () => {
    const control = new FormControl('2.7', positiveIntegerValidator());
    expect(control.hasError('positiveInteger')).toBe(true);
  });

  it('should return error for non-numeric string', () => {
    const control = new FormControl('abc', positiveIntegerValidator());
    // Number('abc') is NaN, Number.isInteger(NaN) is false -> error
    expect(control.hasError('positiveInteger')).toBe(true);
  });

  it('should return null for 1 (boundary)', () => {
    const control = new FormControl(1, positiveIntegerValidator());
    expect(control.errors).toBeNull();
  });
});

// =============================================================================
// rangeValidator
// =============================================================================

describe('rangeValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, rangeValidator(1, 100));
    expect(control.errors).toBeNull();
  });

  it('should return null for undefined value', () => {
    const control = new FormControl(undefined, rangeValidator(1, 100));
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', rangeValidator(1, 100));
    expect(control.errors).toBeNull();
  });

  it('should return null for value within range', () => {
    const control = new FormControl(50, rangeValidator(1, 100));
    expect(control.errors).toBeNull();
  });

  it('should return null for value at minimum boundary', () => {
    const control = new FormControl(1, rangeValidator(1, 100));
    expect(control.errors).toBeNull();
  });

  it('should return null for value at maximum boundary', () => {
    const control = new FormControl(100, rangeValidator(1, 100));
    expect(control.errors).toBeNull();
  });

  it('should return null for string value within range', () => {
    const control = new FormControl('50', rangeValidator(1, 100));
    expect(control.errors).toBeNull();
  });

  it('should return error for value below minimum', () => {
    const control = new FormControl(0, rangeValidator(1, 100));
    expect(control.hasError('range')).toBe(true);
    expect(control.getError('range')).toEqual({ min: 1, max: 100, actual: 0 });
  });

  it('should return error for value above maximum', () => {
    const control = new FormControl(101, rangeValidator(1, 100));
    expect(control.hasError('range')).toBe(true);
    expect(control.getError('range')).toEqual({ min: 1, max: 100, actual: 101 });
  });

  it('should return error for negative value when min is 0', () => {
    const control = new FormControl(-5, rangeValidator(0, 100));
    expect(control.hasError('range')).toBe(true);
    expect(control.getError('range')).toEqual({ min: 0, max: 100, actual: -5 });
  });

  it('should return error for very large value', () => {
    const control = new FormControl(999999, rangeValidator(1, 100));
    expect(control.hasError('range')).toBe(true);
  });

  it('should return error for string value below minimum', () => {
    const control = new FormControl('-1', rangeValidator(0, 100));
    expect(control.hasError('range')).toBe(true);
    expect(control.getError('range')).toEqual({ min: 0, max: 100, actual: -1 });
  });

  it('should work with zero range (min equals max)', () => {
    const control = new FormControl(5, rangeValidator(5, 5));
    expect(control.errors).toBeNull();
  });

  it('should return error for value not equal when min equals max', () => {
    const control = new FormControl(4, rangeValidator(5, 5));
    expect(control.hasError('range')).toBe(true);
  });

  it('should handle NaN input (non-numeric string)', () => {
    const control = new FormControl('abc', rangeValidator(1, 100));
    // Number('abc') = NaN; NaN < 1 is false, NaN > 100 is false
    // So it passes (returns null) -- NaN comparison quirk
    expect(control.errors).toBeNull();
  });
});
