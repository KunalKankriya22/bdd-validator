import { FormControl, FormGroup } from '@angular/forms';
import {
  trimmedRequiredValidator,
  trimmedMaxLengthValidator,
  terminationAfterEffectiveValidator,
} from './donor-decision-codes.validator';

/**
 * This file re-exports validators from interdiction-class.validator.
 * These tests verify the re-exports are wired correctly.
 * Full validator logic coverage lives in interdiction-class.validator.spec.ts
 * and date.validators.spec.ts.
 */

// =============================================================================
// Re-exported trimmedRequiredValidator
// =============================================================================

describe('donor-decision-codes re-exported trimmedRequiredValidator', () => {
  it('should be a function', () => {
    expect(typeof trimmedRequiredValidator).toBe('function');
  });

  it('should return a ValidatorFn', () => {
    const validatorFn = trimmedRequiredValidator();
    expect(typeof validatorFn).toBe('function');
  });

  it('should return error for empty string', () => {
    const control = new FormControl('', trimmedRequiredValidator());
    expect(control.hasError('trimmedRequired')).toBe(true);
  });

  it('should return null for valid string', () => {
    const control = new FormControl('valid', trimmedRequiredValidator());
    expect(control.valid).toBe(true);
  });

  it('should return error for whitespace-only string', () => {
    const control = new FormControl('   ', trimmedRequiredValidator());
    expect(control.hasError('trimmedRequired')).toBe(true);
  });
});

// =============================================================================
// Re-exported trimmedMaxLengthValidator
// =============================================================================

describe('donor-decision-codes re-exported trimmedMaxLengthValidator', () => {
  it('should be a function', () => {
    expect(typeof trimmedMaxLengthValidator).toBe('function');
  });

  it('should return a ValidatorFn', () => {
    const validatorFn = trimmedMaxLengthValidator(10);
    expect(typeof validatorFn).toBe('function');
  });

  it('should return null for string within limit', () => {
    const control = new FormControl('abc', trimmedMaxLengthValidator(5));
    expect(control.valid).toBe(true);
  });

  it('should return error for string exceeding limit', () => {
    const control = new FormControl('abcdef', trimmedMaxLengthValidator(5));
    expect(control.hasError('trimmedMaxLength')).toBe(true);
  });
});

// =============================================================================
// Re-exported terminationAfterEffectiveValidator
// =============================================================================

describe('donor-decision-codes re-exported terminationAfterEffectiveValidator', () => {
  it('should be a function', () => {
    expect(typeof terminationAfterEffectiveValidator).toBe('function');
  });

  it('should return a ValidatorFn', () => {
    const validatorFn = terminationAfterEffectiveValidator();
    expect(typeof validatorFn).toBe('function');
  });

  it('should return null when both dates are null', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );
    expect(form.errors).toBeNull();
  });
});
