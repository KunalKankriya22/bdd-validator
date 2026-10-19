import { FormControl, FormGroup } from '@angular/forms';
import moment from 'moment';
import {
  effectiveDateNotPastValidator,
  terminationAfterEffectiveValidator,
  terminationDateNotPastValidator,
  ynFlagValidator,
  returnAcceptedFlagValidator,
  numericOnlyValidator,
  stateRequiredWhenDomesticValidator,
  phoneNumberValidator,
  applyZipValidators,
  alphabeticOnlyValidator,
  DOMESTIC_ZIP_MAX_LENGTH,
  INTERNATIONAL_ZIP_MAX_LENGTH,
  DOMESTIC_ZIP_PATTERN,
  INTERNATIONAL_ZIP_PATTERN,
} from './customer-profile.validators';

// =============================================================================
// effectiveDateNotPastValidator
// =============================================================================

describe('effectiveDateNotPastValidator', () => {
  it('should return null when control value is null', () => {
    const control = new FormControl(null, effectiveDateNotPastValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null when control value is empty string', () => {
    const control = new FormControl('', effectiveDateNotPastValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null when control value is undefined', () => {
    const control = new FormControl(undefined, effectiveDateNotPastValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error when date is in the past', () => {
    const pastDate = moment().subtract(1, 'day');
    const control = new FormControl(pastDate, effectiveDateNotPastValidator());
    expect(control.hasError('effectiveDateInPast')).toBe(true);
    expect(control.getError('effectiveDateInPast')).toEqual({
      message: 'Effective date cannot be in past',
      errorCode: '5015',
    });
  });

  it('should return null when date is today', () => {
    const today = moment().startOf('day');
    const control = new FormControl(today, effectiveDateNotPastValidator());
    expect(control.hasError('effectiveDateInPast')).toBe(false);
  });

  it('should return null when date is in the future', () => {
    const futureDate = moment().add(1, 'day');
    const control = new FormControl(futureDate, effectiveDateNotPastValidator());
    expect(control.hasError('effectiveDateInPast')).toBe(false);
  });

  it('should return error when date is far in the past', () => {
    const farPast = moment().subtract(1, 'year');
    const control = new FormControl(farPast, effectiveDateNotPastValidator());
    expect(control.hasError('effectiveDateInPast')).toBe(true);
  });

  describe('with chapterTimeZone offset', () => {
    it('should use positive offset to determine chapter today', () => {
      const pastDate = moment().subtract(2, 'days');
      const control = new FormControl(pastDate, effectiveDateNotPastValidator('+05:30'));
      expect(control.hasError('effectiveDateInPast')).toBe(true);
    });

    it('should use negative offset to determine chapter today', () => {
      const futureDate = moment().add(5, 'days');
      const control = new FormControl(futureDate, effectiveDateNotPastValidator('-05:00'));
      expect(control.hasError('effectiveDateInPast')).toBe(false);
    });

    it('should fall back to local time when chapterTimeZone is undefined', () => {
      const pastDate = moment().subtract(1, 'day');
      const control = new FormControl(pastDate, effectiveDateNotPastValidator(undefined));
      expect(control.hasError('effectiveDateInPast')).toBe(true);
    });

    it('should fall back to local time when chapterTimeZone is empty string', () => {
      const pastDate = moment().subtract(1, 'day');
      const control = new FormControl(pastDate, effectiveDateNotPastValidator(''));
      expect(control.hasError('effectiveDateInPast')).toBe(true);
    });

    it('should fall back to local time when chapterTimeZone is invalid format', () => {
      const pastDate = moment().subtract(1, 'day');
      const control = new FormControl(pastDate, effectiveDateNotPastValidator('EST'));
      expect(control.hasError('effectiveDateInPast')).toBe(true);
    });

    it('should use +00:00 offset correctly', () => {
      const futureDate = moment().add(5, 'days');
      const control = new FormControl(futureDate, effectiveDateNotPastValidator('+00:00'));
      expect(control.hasError('effectiveDateInPast')).toBe(false);
    });
  });
});

// =============================================================================
// terminationAfterEffectiveValidator
// =============================================================================

describe('terminationAfterEffectiveValidator', () => {
  let formGroup: FormGroup;

  beforeEach(() => {
    formGroup = new FormGroup(
      {
        effDate: new FormControl(null),
        termDate: new FormControl(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );
  });

  it('should return null when effDate control is missing', () => {
    const fg = new FormGroup(
      { termDate: new FormControl('2026-06-01') },
      { validators: terminationAfterEffectiveValidator() }
    );
    expect(fg.errors).toBeNull();
  });

  it('should return null when termDate control is missing', () => {
    const fg = new FormGroup(
      { effDate: new FormControl('2026-01-01') },
      { validators: terminationAfterEffectiveValidator() }
    );
    expect(fg.errors).toBeNull();
  });

  it('should return null when termDate value is null', () => {
    formGroup.get('effDate')!.setValue('2026-01-01');
    formGroup.get('termDate')!.setValue(null);
    expect(formGroup.errors).toBeNull();
  });

  it('should return null when effDate value is null and termDate has value', () => {
    formGroup.get('effDate')!.setValue(null);
    formGroup.get('termDate')!.setValue('2026-06-01');
    expect(formGroup.hasError('terminationBeforeEffective')).toBe(false);
  });

  it('should return null when termination is after effective', () => {
    formGroup.get('effDate')!.setValue('2026-01-01');
    formGroup.get('termDate')!.setValue('2026-06-01');
    expect(formGroup.errors).toBeNull();
  });

  it('should return null when termination equals effective', () => {
    formGroup.get('effDate')!.setValue('2026-06-01');
    formGroup.get('termDate')!.setValue('2026-06-01');
    expect(formGroup.errors).toBeNull();
  });

  it('should return error when termination is before effective', () => {
    formGroup.get('effDate')!.setValue('2026-06-01');
    formGroup.get('termDate')!.setValue('2026-01-01');
    expect(formGroup.hasError('terminationBeforeEffective')).toBe(true);
    expect(formGroup.getError('terminationBeforeEffective')).toEqual({
      message: 'Termination date must be on or after Effective date',
      errorCode: '5004',
    });
  });

  it('should return error when termination is one day before effective', () => {
    formGroup.get('effDate')!.setValue('2026-06-15');
    formGroup.get('termDate')!.setValue('2026-06-14');
    expect(formGroup.hasError('terminationBeforeEffective')).toBe(true);
  });
});

// =============================================================================
// terminationDateNotPastValidator
// =============================================================================

describe('terminationDateNotPastValidator', () => {
  it('should return null when control value is null', () => {
    const control = new FormControl(null, terminationDateNotPastValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null when control value is empty string', () => {
    const control = new FormControl('', terminationDateNotPastValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error when date is in the past', () => {
    const pastDate = moment().subtract(1, 'day');
    const control = new FormControl(pastDate, terminationDateNotPastValidator());
    expect(control.hasError('terminationDateInPast')).toBe(true);
    expect(control.getError('terminationDateInPast')).toEqual({
      message: 'Termination date cannot be in past',
      errorCode: '3115',
    });
  });

  it('should return null when date is today', () => {
    const today = moment().startOf('day');
    const control = new FormControl(today, terminationDateNotPastValidator());
    expect(control.hasError('terminationDateInPast')).toBe(false);
  });

  it('should return null when date is in the future', () => {
    const futureDate = moment().add(1, 'day');
    const control = new FormControl(futureDate, terminationDateNotPastValidator());
    expect(control.hasError('terminationDateInPast')).toBe(false);
  });

  describe('with chapterTimeZone offset', () => {
    it('should use positive offset for chapter today', () => {
      const pastDate = moment().subtract(2, 'days');
      const control = new FormControl(pastDate, terminationDateNotPastValidator('+05:30'));
      expect(control.hasError('terminationDateInPast')).toBe(true);
    });

    it('should accept future date with negative offset', () => {
      const futureDate = moment().add(5, 'days');
      const control = new FormControl(futureDate, terminationDateNotPastValidator('-05:00'));
      expect(control.hasError('terminationDateInPast')).toBe(false);
    });

    it('should fall back to local time for invalid offset format', () => {
      const pastDate = moment().subtract(1, 'day');
      const control = new FormControl(pastDate, terminationDateNotPastValidator('INVALID'));
      expect(control.hasError('terminationDateInPast')).toBe(true);
    });
  });
});

// =============================================================================
// ynFlagValidator
// =============================================================================

describe('ynFlagValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, ynFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', ynFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for uppercase Y', () => {
    const control = new FormControl('Y', ynFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for uppercase N', () => {
    const control = new FormControl('N', ynFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for lowercase y (toUpperCase applied)', () => {
    const control = new FormControl('y', ynFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for lowercase n (toUpperCase applied)', () => {
    const control = new FormControl('n', ynFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error for invalid value X', () => {
    const control = new FormControl('X', ynFlagValidator());
    expect(control.hasError('invalidYNFlag')).toBe(true);
    expect(control.getError('invalidYNFlag')).toEqual({
      message: "A 'Y' or 'N' must be entered",
      errorCode: '0318',
    });
  });

  it('should return error for value Q', () => {
    const control = new FormControl('Q', ynFlagValidator());
    expect(control.hasError('invalidYNFlag')).toBe(true);
  });

  it('should return error for numeric value', () => {
    const control = new FormControl('1', ynFlagValidator());
    expect(control.hasError('invalidYNFlag')).toBe(true);
  });

  it('should return error for multi-character string', () => {
    const control = new FormControl('YES', ynFlagValidator());
    expect(control.hasError('invalidYNFlag')).toBe(true);
  });
});

// =============================================================================
// returnAcceptedFlagValidator
// =============================================================================

describe('returnAcceptedFlagValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, returnAcceptedFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', returnAcceptedFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for Y', () => {
    const control = new FormControl('Y', returnAcceptedFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for N', () => {
    const control = new FormControl('N', returnAcceptedFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for Q', () => {
    const control = new FormControl('Q', returnAcceptedFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for lowercase y (toUpperCase applied)', () => {
    const control = new FormControl('y', returnAcceptedFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for lowercase n', () => {
    const control = new FormControl('n', returnAcceptedFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for lowercase q', () => {
    const control = new FormControl('q', returnAcceptedFlagValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error for invalid value X', () => {
    const control = new FormControl('X', returnAcceptedFlagValidator());
    expect(control.hasError('invalidReturnAcceptedFlag')).toBe(true);
    expect(control.getError('invalidReturnAcceptedFlag')).toEqual({
      message: 'Invalid return accepted flag value',
      errorCode: '7201',
    });
  });

  it('should return error for numeric value', () => {
    const control = new FormControl('1', returnAcceptedFlagValidator());
    expect(control.hasError('invalidReturnAcceptedFlag')).toBe(true);
  });

  it('should return error for value A', () => {
    const control = new FormControl('A', returnAcceptedFlagValidator());
    expect(control.hasError('invalidReturnAcceptedFlag')).toBe(true);
  });
});

// =============================================================================
// numericOnlyValidator
// =============================================================================

describe('numericOnlyValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, numericOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', numericOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for valid numeric string', () => {
    const control = new FormControl('12345', numericOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for single digit', () => {
    const control = new FormControl('0', numericOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error for alphabetic characters', () => {
    const control = new FormControl('abc', numericOnlyValidator());
    expect(control.hasError('invalidNumber')).toBe(true);
    expect(control.getError('invalidNumber')).toEqual({
      message: 'Invalid price schedule number',
      errorCode: '0241',
    });
  });

  it('should return error for mixed alphanumeric', () => {
    const control = new FormControl('12a34', numericOnlyValidator());
    expect(control.hasError('invalidNumber')).toBe(true);
  });

  it('should return error for string with spaces', () => {
    const control = new FormControl('12 34', numericOnlyValidator());
    expect(control.hasError('invalidNumber')).toBe(true);
  });

  it('should return error for decimal number', () => {
    const control = new FormControl('12.34', numericOnlyValidator());
    expect(control.hasError('invalidNumber')).toBe(true);
  });

  it('should return error for negative number', () => {
    const control = new FormControl('-5', numericOnlyValidator());
    expect(control.hasError('invalidNumber')).toBe(true);
  });

  it('should return error for special characters', () => {
    const control = new FormControl('!@#', numericOnlyValidator());
    expect(control.hasError('invalidNumber')).toBe(true);
  });
});

// =============================================================================
// stateRequiredWhenDomesticValidator
// =============================================================================

describe('stateRequiredWhenDomesticValidator', () => {
  let formGroup: FormGroup;

  beforeEach(() => {
    formGroup = new FormGroup(
      {
        intFlag: new FormControl(null),
        state: new FormControl(null),
      },
      { validators: stateRequiredWhenDomesticValidator() }
    );
  });

  it('should return null when intFlag control is missing', () => {
    const fg = new FormGroup(
      { state: new FormControl(null) },
      { validators: stateRequiredWhenDomesticValidator() }
    );
    expect(fg.errors).toBeNull();
  });

  it('should return null when state control is missing', () => {
    const fg = new FormGroup(
      { intFlag: new FormControl('N') },
      { validators: stateRequiredWhenDomesticValidator() }
    );
    expect(fg.errors).toBeNull();
  });

  it('should return null when intFlag is Y (international)', () => {
    formGroup.get('intFlag')!.setValue('Y');
    formGroup.get('state')!.setValue(null);
    expect(formGroup.errors).toBeNull();
  });

  it('should return null when intFlag is Y and state is set', () => {
    formGroup.get('intFlag')!.setValue('Y');
    formGroup.get('state')!.setValue('CA');
    expect(formGroup.errors).toBeNull();
  });

  it('should return error when intFlag is N and state is null', () => {
    formGroup.get('intFlag')!.setValue('N');
    formGroup.get('state')!.setValue(null);
    expect(formGroup.hasError('stateRequiredForDomestic')).toBe(true);
    expect(formGroup.getError('stateRequiredForDomestic')).toEqual({
      message: 'State is required for domestic addresses',
      errorCode: 'CUSTOM',
    });
  });

  it('should return error when intFlag is N and state is empty string', () => {
    formGroup.get('intFlag')!.setValue('N');
    formGroup.get('state')!.setValue('');
    expect(formGroup.hasError('stateRequiredForDomestic')).toBe(true);
  });

  it('should return null when intFlag is N and state is set', () => {
    formGroup.get('intFlag')!.setValue('N');
    formGroup.get('state')!.setValue('TX');
    expect(formGroup.errors).toBeNull();
  });

  it('should return error when intFlag is null and state is null', () => {
    formGroup.get('intFlag')!.setValue(null);
    formGroup.get('state')!.setValue(null);
    expect(formGroup.hasError('stateRequiredForDomestic')).toBe(true);
  });

  it('should return null when intFlag is null and state is set', () => {
    formGroup.get('intFlag')!.setValue(null);
    formGroup.get('state')!.setValue('NY');
    expect(formGroup.errors).toBeNull();
  });
});

// =============================================================================
// phoneNumberValidator
// =============================================================================

describe('phoneNumberValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, phoneNumberValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', phoneNumberValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for 7-digit phone number', () => {
    const control = new FormControl('5551234', phoneNumberValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for 8-digit phone number', () => {
    const control = new FormControl('55512345', phoneNumberValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for 10-digit phone number', () => {
    const control = new FormControl('5551234567', phoneNumberValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for 12-digit phone number', () => {
    const control = new FormControl('155512345678', phoneNumberValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for phone number with hyphens (stripped)', () => {
    const control = new FormControl('555-123-4567', phoneNumberValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for phone number with spaces (stripped)', () => {
    const control = new FormControl('555 123 4567', phoneNumberValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for formatted 10-digit number with parentheses', () => {
    const control = new FormControl('(555) 123-4567', phoneNumberValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error for phone with 11 digits (invalid length)', () => {
    const control = new FormControl('15551234567', phoneNumberValidator());
    expect(control.hasError('invalidPhoneNumber')).toBe(true);
    expect(control.getError('invalidPhoneNumber')).toEqual({
      message: 'Invalid length',
    });
  });

  it('should return error for phone with 5 digits (invalid length)', () => {
    const control = new FormControl('55512', phoneNumberValidator());
    expect(control.hasError('invalidPhoneNumber')).toBe(true);
  });

  it('should return error for phone with 6 digits (invalid length)', () => {
    const control = new FormControl('123456', phoneNumberValidator());
    expect(control.hasError('invalidPhoneNumber')).toBe(true);
  });

  it('should return error for non-numeric characters after stripping', () => {
    const control = new FormControl('555-ABC-1234', phoneNumberValidator());
    expect(control.hasError('invalidPhoneNumber')).toBe(true);
    expect(control.getError('invalidPhoneNumber')).toEqual({
      message: 'Invalid number',
    });
  });

  it('should return error for alphabetic input', () => {
    const control = new FormControl('abcdefg', phoneNumberValidator());
    expect(control.hasError('invalidPhoneNumber')).toBe(true);
  });

  it('should return error for single digit (invalid length)', () => {
    const control = new FormControl('5', phoneNumberValidator());
    expect(control.hasError('invalidPhoneNumber')).toBe(true);
  });

  it('should return error for phone number with plus and parentheses (11 digits after strip)', () => {
    const control = new FormControl('+1 (555) 123-4567', phoneNumberValidator());
    expect(control.hasError('invalidPhoneNumber')).toBe(true);
  });
});

// =============================================================================
// applyZipValidators
// =============================================================================

describe('applyZipValidators', () => {
  it('should do nothing when zipControl is null', () => {
    expect(() => applyZipValidators(null, false)).not.toThrow();
  });

  describe('domestic (isInternational = false)', () => {
    it('should set required, maxLength, and numeric pattern validators', () => {
      const zipControl = new FormControl('');
      applyZipValidators(zipControl, false);

      // Required check
      zipControl.setValue('');
      expect(zipControl.hasError('required')).toBe(true);

      // Valid domestic zip
      zipControl.setValue('12345');
      expect(zipControl.valid).toBe(true);

      // Too long (DOMESTIC_ZIP_MAX_LENGTH is 15)
      zipControl.setValue('1234567890123456');
      expect(zipControl.hasError('maxlength')).toBe(true);

      // Non-numeric
      zipControl.setValue('ABCDE');
      expect(zipControl.hasError('pattern')).toBe(true);
    });
  });

  describe('international (isInternational = true)', () => {
    it('should set required, maxLength, and alphanumeric pattern validators', () => {
      const zipControl = new FormControl('');
      applyZipValidators(zipControl, true);

      // Required check
      zipControl.setValue('');
      expect(zipControl.hasError('required')).toBe(true);

      // Valid international zip (alphanumeric)
      zipControl.setValue('AB12CD34');
      expect(zipControl.valid).toBe(true);

      // Too long
      zipControl.setValue('12345678901');
      expect(zipControl.hasError('maxlength')).toBe(true);

      // Special characters not allowed
      zipControl.setValue('AB-12');
      expect(zipControl.hasError('pattern')).toBe(true);
    });
  });
});

// =============================================================================
// alphabeticOnlyValidator
// =============================================================================

describe('alphabeticOnlyValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, alphabeticOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', alphabeticOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for alphabetic characters only', () => {
    const control = new FormControl('John', alphabeticOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for alphabetic with spaces', () => {
    const control = new FormControl('John Doe', alphabeticOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for alphabetic with periods', () => {
    const control = new FormControl('Dr. Smith', alphabeticOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for lowercase letters', () => {
    const control = new FormControl('abc', alphabeticOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for mixed case with space and period', () => {
    const control = new FormControl('Jr. Doe', alphabeticOnlyValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error for numeric characters', () => {
    const control = new FormControl('John123', alphabeticOnlyValidator());
    expect(control.hasError('alphabeticOnly')).toBe(true);
    expect(control.getError('alphabeticOnly')).toEqual({
      message: 'Only letters, spaces and periods allowed',
    });
  });

  it('should return error for special characters', () => {
    const control = new FormControl('John@Doe', alphabeticOnlyValidator());
    expect(control.hasError('alphabeticOnly')).toBe(true);
  });

  it('should return error for hyphens', () => {
    const control = new FormControl('Smith-Jones', alphabeticOnlyValidator());
    expect(control.hasError('alphabeticOnly')).toBe(true);
  });

  it('should return error for underscores', () => {
    const control = new FormControl('John_Doe', alphabeticOnlyValidator());
    expect(control.hasError('alphabeticOnly')).toBe(true);
  });

  it('should return error for commas', () => {
    const control = new FormControl('Doe, John', alphabeticOnlyValidator());
    expect(control.hasError('alphabeticOnly')).toBe(true);
  });
});

// =============================================================================
// Exported constants
// =============================================================================

describe('exported constants', () => {
  it('should export DOMESTIC_ZIP_MAX_LENGTH as 15', () => {
    expect(DOMESTIC_ZIP_MAX_LENGTH).toBe(15);
  });

  it('should export INTERNATIONAL_ZIP_MAX_LENGTH as 10', () => {
    expect(INTERNATIONAL_ZIP_MAX_LENGTH).toBe(10);
  });

  it('should export DOMESTIC_ZIP_PATTERN that matches digits only', () => {
    expect(DOMESTIC_ZIP_PATTERN.test('12345')).toBe(true);
    expect(DOMESTIC_ZIP_PATTERN.test('ABCDE')).toBe(false);
  });

  it('should export INTERNATIONAL_ZIP_PATTERN that matches alphanumeric', () => {
    expect(INTERNATIONAL_ZIP_PATTERN.test('AB12C')).toBe(true);
    expect(INTERNATIONAL_ZIP_PATTERN.test('AB-12')).toBe(false);
  });
});
