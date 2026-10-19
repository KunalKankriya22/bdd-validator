import { FormControl } from '@angular/forms';

import { specialCharValidator } from './password.validators';

// MLT-10670: Regression tests for specialCharValidator — ensuring spaces and
// invalid characters are rejected and the correct error key is returned.
describe('specialCharValidator', () => {
  const validator = specialCharValidator();

  it('should return null for valid special characters', () => {
    const control = new FormControl('!#$');
    expect(validator(control)).toBeNull();
  });

  it('should return invalidSpecialChars error when value contains a space', () => {
    const control = new FormControl(' ');
    const result = validator(control);
    expect(result).not.toBeNull();
    expect(result!['invalidSpecialChars']).toBeDefined();
  });

  it('should return invalidSpecialChars error when value contains a space mixed with valid chars', () => {
    const control = new FormControl('! #');
    const result = validator(control);
    expect(result).not.toBeNull();
    expect(result!['invalidSpecialChars']).toBeDefined();
  });

  it('should return invalidSpecialChars error when value contains letters', () => {
    const control = new FormControl('abc');
    const result = validator(control);
    expect(result).not.toBeNull();
    expect(result!['invalidSpecialChars']).toBeDefined();
  });

  it('should return invalidSpecialChars error when value contains numbers', () => {
    const control = new FormControl('123');
    const result = validator(control);
    expect(result).not.toBeNull();
    expect(result!['invalidSpecialChars']).toBeDefined();
  });

  it('should return invalidSpecialChars error when value contains forbidden symbols (@, %, &)', () => {
    const control = new FormControl('@%&');
    const result = validator(control);
    expect(result).not.toBeNull();
    expect(result!['invalidSpecialChars']).toBeDefined();
  });

  it('should return duplicateSpecialChars error when value contains duplicate characters', () => {
    const control = new FormControl('!!');
    const result = validator(control);
    expect(result).not.toBeNull();
    expect(result!['duplicateSpecialChars']).toBeDefined();
  });

  it('should return null for null or empty value', () => {
    expect(validator(new FormControl(null))).toBeNull();
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('should return invalidSpecialChars error when value is only whitespace', () => {
    const control = new FormControl('   ');
    const result = validator(control);
    expect(result).not.toBeNull();
    expect(result!['invalidSpecialChars']).toBeDefined();
  });
});
