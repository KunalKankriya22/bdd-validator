import { FormControl } from '@angular/forms';
import {
  trimmedRequiredValidator,
  trimmedMaxLengthValidator,
} from './interdiction-class.validator';

// =============================================================================
// trimmedRequiredValidator
// =============================================================================

describe('trimmedRequiredValidator', () => {
  const validator = trimmedRequiredValidator();

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

  it('should return error for newline-only string', () => {
    const control = new FormControl('\n\n');
    expect(validator(control)).toEqual({ trimmedRequired: true });
  });

  it('should return error for non-string falsy value (0)', () => {
    const control = new FormControl(0);
    expect(validator(control)).toEqual({ trimmedRequired: true });
  });

  it('should return error for non-string falsy value (false)', () => {
    const control = new FormControl(false);
    expect(validator(control)).toEqual({ trimmedRequired: true });
  });

  it('should return error for non-string type (number)', () => {
    // typeof 123 !== 'string' triggers the first !value check (which is falsy for 0)
    // For truthy non-string: !value is false, typeof value !== 'string' returns error
    const control = new FormControl(42);
    expect(validator(control)).toEqual({ trimmedRequired: true });
  });

  it('should return null for valid non-empty string', () => {
    const control = new FormControl('hello');
    expect(validator(control)).toBeNull();
  });

  it('should return null for string with leading/trailing whitespace but content', () => {
    const control = new FormControl('  hello  ');
    expect(validator(control)).toBeNull();
  });

  it('should return null for single character string', () => {
    const control = new FormControl('a');
    expect(validator(control)).toBeNull();
  });
});

// =============================================================================
// trimmedMaxLengthValidator
// =============================================================================

describe('trimmedMaxLengthValidator', () => {
  const maxLength = 5;
  const validator = trimmedMaxLengthValidator(maxLength);

  it('should return null for null value', () => {
    const control = new FormControl(null);
    expect(validator(control)).toBeNull();
  });

  it('should return null for undefined value', () => {
    const control = new FormControl(undefined);
    expect(validator(control)).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });

  it('should return null for non-string value (number)', () => {
    const control = new FormControl(12345);
    expect(validator(control)).toBeNull();
  });

  it('should return null for string within max length', () => {
    const control = new FormControl('abc');
    expect(validator(control)).toBeNull();
  });

  it('should return null for string at exactly max length', () => {
    const control = new FormControl('abcde');
    expect(validator(control)).toBeNull();
  });

  it('should return null for string exceeding max length but trimmed within limit', () => {
    const control = new FormControl('  ab   '); // trimmed = 'ab' (2 chars)
    expect(validator(control)).toBeNull();
  });

  it('should return error for trimmed string exceeding max length', () => {
    const control = new FormControl('abcdef'); // 6 chars > 5
    expect(validator(control)).toEqual({
      trimmedMaxLength: { maxLength: 5, actualLength: 6 },
    });
  });

  it('should trim whitespace before checking length', () => {
    const control = new FormControl('  abcdef  '); // trimmed = 'abcdef' (6 chars)
    expect(validator(control)).toEqual({
      trimmedMaxLength: { maxLength: 5, actualLength: 6 },
    });
  });

  it('should work with maxLength of 0', () => {
    const zeroValidator = trimmedMaxLengthValidator(0);
    const control = new FormControl('a');
    expect(zeroValidator(control)).toEqual({
      trimmedMaxLength: { maxLength: 0, actualLength: 1 },
    });
  });

  it('should return null for whitespace-only string (trimmed length is 0)', () => {
    const control = new FormControl('     ');
    expect(validator(control)).toBeNull();
  });
});
