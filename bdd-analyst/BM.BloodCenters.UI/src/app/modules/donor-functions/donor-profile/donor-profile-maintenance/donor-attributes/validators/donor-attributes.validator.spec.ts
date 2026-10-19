import { FormControl } from '@angular/forms';
import {
  propertyCodeRequiredValidator,
  propertyAccessValidator,
  validPropertyCodeValidator,
  getPropertyCodeErrorMessage,
  getEffectiveDateErrorMessage,
  getTerminationDateErrorMessage,
} from './donor-attributes.validator';

// =============================================================================
// propertyCodeRequiredValidator
// =============================================================================

describe('propertyCodeRequiredValidator', () => {
  const validator = propertyCodeRequiredValidator();

  it('should return error for null value', () => {
    const control = new FormControl(null);
    expect(validator(control)).toEqual({ propertyCodeRequired: { errorCode: '0080' } });
  });

  it('should return error for undefined value', () => {
    const control = new FormControl(undefined);
    expect(validator(control)).toEqual({ propertyCodeRequired: { errorCode: '0080' } });
  });

  it('should return error for empty string', () => {
    const control = new FormControl('');
    expect(validator(control)).toEqual({ propertyCodeRequired: { errorCode: '0080' } });
  });

  it('should return error for whitespace-only string', () => {
    const control = new FormControl('   ');
    expect(validator(control)).toEqual({ propertyCodeRequired: { errorCode: '0080' } });
  });

  it('should return null for valid non-empty string', () => {
    const control = new FormControl('ABC');
    expect(validator(control)).toBeNull();
  });

  it('should return null for string with leading/trailing spaces but content', () => {
    const control = new FormControl('  ABC  ');
    expect(validator(control)).toBeNull();
  });

  it('should return error for falsy value (0)', () => {
    const control = new FormControl(0);
    expect(validator(control)).toEqual({ propertyCodeRequired: { errorCode: '0080' } });
  });
});

// =============================================================================
// propertyAccessValidator
// =============================================================================

describe('propertyAccessValidator', () => {
  const validProperties = ['PROP_A', 'PROP_B', 'PROP_C'];
  const validator = propertyAccessValidator(validProperties);

  it('should return null for null value (let required handle it)', () => {
    const control = new FormControl(null);
    expect(validator(control)).toBeNull();
  });

  it('should return null for undefined value', () => {
    const control = new FormControl(undefined);
    expect(validator(control)).toBeNull();
  });

  it('should return null for empty string (falsy)', () => {
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });

  it('should return null for valid property', () => {
    const control = new FormControl('PROP_A');
    expect(validator(control)).toBeNull();
  });

  it('should return null for another valid property', () => {
    const control = new FormControl('PROP_C');
    expect(validator(control)).toBeNull();
  });

  it('should return error for invalid property', () => {
    const control = new FormControl('PROP_X');
    expect(validator(control)).toEqual({ propertyAccessDenied: { errorCode: '18033' } });
  });

  it('should be case-sensitive', () => {
    const control = new FormControl('prop_a');
    expect(validator(control)).toEqual({ propertyAccessDenied: { errorCode: '18033' } });
  });

  it('should return error with empty valid properties list', () => {
    const emptyValidator = propertyAccessValidator([]);
    const control = new FormControl('ANYTHING');
    expect(emptyValidator(control)).toEqual({ propertyAccessDenied: { errorCode: '18033' } });
  });
});

// =============================================================================
// validPropertyCodeValidator
// =============================================================================

describe('validPropertyCodeValidator', () => {
  const validCodes = ['CODE1', 'CODE2', 'CODE3'];
  const validator = validPropertyCodeValidator(validCodes);

  it('should return null for null value', () => {
    const control = new FormControl(null);
    expect(validator(control)).toBeNull();
  });

  it('should return null for undefined value', () => {
    const control = new FormControl(undefined);
    expect(validator(control)).toBeNull();
  });

  it('should return null for empty string (falsy)', () => {
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });

  it('should return null for valid code', () => {
    const control = new FormControl('CODE1');
    expect(validator(control)).toBeNull();
  });

  it('should return null for last valid code', () => {
    const control = new FormControl('CODE3');
    expect(validator(control)).toBeNull();
  });

  it('should return error for invalid code', () => {
    const control = new FormControl('INVALID');
    expect(validator(control)).toEqual({ invalidPropertyCode: { errorCode: '18036' } });
  });

  it('should be case-sensitive', () => {
    const control = new FormControl('code1');
    expect(validator(control)).toEqual({ invalidPropertyCode: { errorCode: '18036' } });
  });
});

// =============================================================================
// getPropertyCodeErrorMessage
// =============================================================================

describe('getPropertyCodeErrorMessage', () => {
  it('should return empty string for null control', () => {
    expect(getPropertyCodeErrorMessage(null)).toBe('');
  });

  it('should return empty string for untouched and pristine control', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true });
    expect(getPropertyCodeErrorMessage(control)).toBe('');
  });

  it('should return required message for "required" error when touched', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true });
    control.markAsTouched();
    expect(getPropertyCodeErrorMessage(control)).toBe('Property code is required');
  });

  it('should return required message for "propertyCodeRequired" error when touched', () => {
    const control = new FormControl(null);
    control.setErrors({ propertyCodeRequired: { errorCode: '0080' } });
    control.markAsTouched();
    expect(getPropertyCodeErrorMessage(control)).toBe('Property code is required');
  });

  it('should return required message when dirty (not touched)', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true });
    control.markAsDirty();
    expect(getPropertyCodeErrorMessage(control)).toBe('Property code is required');
  });

  it('should return access denied message for propertyAccessDenied error', () => {
    const control = new FormControl('INVALID');
    control.setErrors({ propertyAccessDenied: { errorCode: '18033' } });
    control.markAsTouched();
    expect(getPropertyCodeErrorMessage(control)).toBe('User not authorized for this property');
  });

  it('should return invalid property code message for invalidPropertyCode error', () => {
    const control = new FormControl('INVALID');
    control.setErrors({ invalidPropertyCode: { errorCode: '18036' } });
    control.markAsTouched();
    expect(getPropertyCodeErrorMessage(control)).toBe('Invalid property code');
  });

  it('should return empty string for valid control when touched', () => {
    const control = new FormControl('VALID');
    control.markAsTouched();
    expect(getPropertyCodeErrorMessage(control)).toBe('');
  });

  it('should prioritize required/propertyCodeRequired over propertyAccessDenied', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true, propertyAccessDenied: { errorCode: '18033' } });
    control.markAsTouched();
    expect(getPropertyCodeErrorMessage(control)).toBe('Property code is required');
  });
});

// =============================================================================
// getEffectiveDateErrorMessage
// =============================================================================

describe('donor-attributes getEffectiveDateErrorMessage', () => {
  it('should return empty string for null control', () => {
    expect(getEffectiveDateErrorMessage(null)).toBe('');
  });

  it('should return empty string for untouched and pristine control', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true });
    expect(getEffectiveDateErrorMessage(control)).toBe('');
  });

  it('should return required message when touched', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective Date cannot be null');
  });

  it('should return required message when dirty', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true });
    control.markAsDirty();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective Date cannot be null');
  });

  it('should return parse error message for matDatepickerParse error', () => {
    const control = new FormControl('bad');
    control.setErrors({ matDatepickerParse: { text: 'bad' } });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Invalid date format. Use DD-MMM-YYYY');
  });

  it('should return past date message for effectiveDatePast error', () => {
    const control = new FormControl(new Date());
    control.setErrors({ effectiveDatePast: true });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective Date cannot be before today');
  });

  it('should return empty string for valid control when touched', () => {
    const control = new FormControl(new Date());
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('');
  });

  it('should prioritize required over matDatepickerParse', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true, matDatepickerParse: { text: '' } });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective Date cannot be null');
  });

  it('should prioritize matDatepickerParse over effectiveDatePast', () => {
    const control = new FormControl('bad');
    control.setErrors({ matDatepickerParse: { text: 'bad' }, effectiveDatePast: true });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Invalid date format. Use DD-MMM-YYYY');
  });
});

// =============================================================================
// getTerminationDateErrorMessage
// =============================================================================

describe('donor-attributes getTerminationDateErrorMessage', () => {
  it('should return empty string for null control', () => {
    expect(getTerminationDateErrorMessage(null)).toBe('');
  });

  it('should return empty string for untouched and pristine control', () => {
    const control = new FormControl(null);
    control.setErrors({ terminationDatePast: true });
    expect(getTerminationDateErrorMessage(control)).toBe('');
  });

  it('should return parse error message for matDatepickerParse error when touched', () => {
    const control = new FormControl('invalid');
    control.setErrors({ matDatepickerParse: { text: 'invalid' } });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('Invalid date format. Use DD-MMM-YYYY');
  });

  it('should return past date message for terminationDatePast error', () => {
    const control = new FormControl(new Date());
    control.setErrors({ terminationDatePast: true });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('Termination Date cannot be before current date');
  });

  it('should return before effective message for terminationBeforeEffective error', () => {
    const control = new FormControl(new Date());
    control.setErrors({ terminationBeforeEffective: true });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('Termination date cannot be before effective date');
  });

  it('should return empty string for valid control when touched', () => {
    const control = new FormControl(new Date());
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('');
  });

  it('should return empty string for valid control when dirty', () => {
    const control = new FormControl(new Date());
    control.markAsDirty();
    expect(getTerminationDateErrorMessage(control)).toBe('');
  });

  it('should prioritize matDatepickerParse over terminationDatePast', () => {
    const control = new FormControl('bad');
    control.setErrors({ matDatepickerParse: { text: 'bad' }, terminationDatePast: true });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('Invalid date format. Use DD-MMM-YYYY');
  });

  it('should prioritize terminationDatePast over terminationBeforeEffective', () => {
    const control = new FormControl(new Date());
    control.setErrors({ terminationDatePast: true, terminationBeforeEffective: true });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('Termination Date cannot be before current date');
  });
});
