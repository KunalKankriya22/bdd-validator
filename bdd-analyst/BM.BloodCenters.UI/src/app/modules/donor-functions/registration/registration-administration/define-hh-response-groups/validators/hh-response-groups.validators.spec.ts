import { FormControl, FormGroup } from '@angular/forms';
import { HhResponseGroupsValidators } from './hh-response-groups.validators';

// =============================================================================
// responseCode
// =============================================================================

describe('HhResponseGroupsValidators.responseCode', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, HhResponseGroupsValidators.responseCode());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', HhResponseGroupsValidators.responseCode());
    expect(control.errors).toBeNull();
  });

  it('should return null for Y', () => {
    const control = new FormControl('Y', HhResponseGroupsValidators.responseCode());
    expect(control.errors).toBeNull();
  });

  it('should return null for N', () => {
    const control = new FormControl('N', HhResponseGroupsValidators.responseCode());
    expect(control.errors).toBeNull();
  });

  it('should return null for U', () => {
    const control = new FormControl('U', HhResponseGroupsValidators.responseCode());
    expect(control.errors).toBeNull();
  });

  it('should return null for lowercase y (toUpperCase applied)', () => {
    const control = new FormControl('y', HhResponseGroupsValidators.responseCode());
    expect(control.errors).toBeNull();
  });

  it('should return null for lowercase n', () => {
    const control = new FormControl('n', HhResponseGroupsValidators.responseCode());
    expect(control.errors).toBeNull();
  });

  it('should return null for lowercase u', () => {
    const control = new FormControl('u', HhResponseGroupsValidators.responseCode());
    expect(control.errors).toBeNull();
  });

  it('should return error for invalid value X', () => {
    const control = new FormControl('X', HhResponseGroupsValidators.responseCode());
    expect(control.hasError('invalidResponseCode')).toBe(true);
    expect(control.getError('invalidResponseCode')).toEqual({
      errorCode: '16046',
      message: 'Invalid response code (must be Y, N, or U)',
    });
  });

  it('should return error for numeric value', () => {
    const control = new FormControl('1', HhResponseGroupsValidators.responseCode());
    expect(control.hasError('invalidResponseCode')).toBe(true);
  });

  it('should return error for Q', () => {
    const control = new FormControl('Q', HhResponseGroupsValidators.responseCode());
    expect(control.hasError('invalidResponseCode')).toBe(true);
  });

  it('should handle numeric value passed as number (toString applied)', () => {
    const control = new FormControl(5, HhResponseGroupsValidators.responseCode());
    expect(control.hasError('invalidResponseCode')).toBe(true);
  });
});

// =============================================================================
// alphanumericOnly
// =============================================================================

describe('HhResponseGroupsValidators.alphanumericOnly', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, HhResponseGroupsValidators.alphanumericOnly());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', HhResponseGroupsValidators.alphanumericOnly());
    expect(control.errors).toBeNull();
  });

  it('should return null for uppercase letters', () => {
    const control = new FormControl('ABC', HhResponseGroupsValidators.alphanumericOnly());
    expect(control.errors).toBeNull();
  });

  it('should return null for lowercase letters', () => {
    const control = new FormControl('abc', HhResponseGroupsValidators.alphanumericOnly());
    expect(control.errors).toBeNull();
  });

  it('should return null for digits', () => {
    const control = new FormControl('123', HhResponseGroupsValidators.alphanumericOnly());
    expect(control.errors).toBeNull();
  });

  it('should return null for mixed alphanumeric', () => {
    const control = new FormControl('ABC123', HhResponseGroupsValidators.alphanumericOnly());
    expect(control.errors).toBeNull();
  });

  it('should return error for special characters', () => {
    const control = new FormControl('ABC-123', HhResponseGroupsValidators.alphanumericOnly());
    expect(control.hasError('invalidCharacters')).toBe(true);
    expect(control.getError('invalidCharacters')).toEqual({
      errorCode: '9740',
      message: 'Invalid characters in group code (only alphanumeric allowed)',
    });
  });

  it('should return error for spaces', () => {
    const control = new FormControl('AB C', HhResponseGroupsValidators.alphanumericOnly());
    expect(control.hasError('invalidCharacters')).toBe(true);
  });

  it('should return error for underscores', () => {
    const control = new FormControl('AB_C', HhResponseGroupsValidators.alphanumericOnly());
    expect(control.hasError('invalidCharacters')).toBe(true);
  });

  it('should return error for period', () => {
    const control = new FormControl('A.B', HhResponseGroupsValidators.alphanumericOnly());
    expect(control.hasError('invalidCharacters')).toBe(true);
  });
});

// =============================================================================
// notInPast
// =============================================================================

describe('HhResponseGroupsValidators.notInPast', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, HhResponseGroupsValidators.notInPast('5015', 'Effective Date'));
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', HhResponseGroupsValidators.notInPast('5015', 'Effective Date'));
    expect(control.errors).toBeNull();
  });

  it('should return error for past date with errorCode 5015', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const control = new FormControl(
      pastDate.toISOString(),
      HhResponseGroupsValidators.notInPast('5015', 'Effective Date')
    );
    expect(control.hasError('dateInPast')).toBe(true);
    expect(control.getError('dateInPast')).toEqual({
      errorCode: '5015',
      message: 'Effective Date is in the past',
    });
  });

  it('should return error for past date with errorCode 3115', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const control = new FormControl(
      pastDate.toISOString(),
      HhResponseGroupsValidators.notInPast('3115', 'Termination Date')
    );
    expect(control.hasError('dateInPast')).toBe(true);
    expect(control.getError('dateInPast')).toEqual({
      errorCode: '3115',
      message: 'Termination Date is in the past',
    });
  });

  it('should return null for today', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const control = new FormControl(
      today.toISOString(),
      HhResponseGroupsValidators.notInPast('5015', 'Effective Date')
    );
    expect(control.hasError('dateInPast')).toBe(false);
  });

  it('should return null for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const control = new FormControl(
      futureDate.toISOString(),
      HhResponseGroupsValidators.notInPast('5015', 'Effective Date')
    );
    expect(control.hasError('dateInPast')).toBe(false);
  });

  it('should return error for date far in the past', () => {
    const farPast = new Date('2020-01-01');
    const control = new FormControl(
      farPast.toISOString(),
      HhResponseGroupsValidators.notInPast('3115', 'Termination Date')
    );
    expect(control.hasError('dateInPast')).toBe(true);
  });
});

// =============================================================================
// terminationAfterEffective
// =============================================================================

describe('HhResponseGroupsValidators.terminationAfterEffective', () => {
  it('should return null when control value is null (optional field)', () => {
    const formGroup = new FormGroup({
      effDate: new FormControl('2026-01-01'),
      termDate: new FormControl(null, HhResponseGroupsValidators.terminationAfterEffective('effDate')),
    });
    formGroup.get('termDate')!.updateValueAndValidity();
    expect(formGroup.get('termDate')!.errors).toBeNull();
  });

  it('should return null when control value is empty string', () => {
    const formGroup = new FormGroup({
      effDate: new FormControl('2026-01-01'),
      termDate: new FormControl('', HhResponseGroupsValidators.terminationAfterEffective('effDate')),
    });
    formGroup.get('termDate')!.updateValueAndValidity();
    expect(formGroup.get('termDate')!.errors).toBeNull();
  });

  it('should return null when parent is null (control not in a form group)', () => {
    const control = new FormControl('2026-06-01', HhResponseGroupsValidators.terminationAfterEffective('effDate'));
    // When parent is null, validator returns null
    // Note: FormControl without parent still returns null because parent is undefined initially
    // However, once we add it to a FormGroup, parent is set.
    // Testing standalone: parent is null -> returns null
    expect(control.errors).toBeNull();
  });

  it('should return effectiveDateRequired when effDate control does not exist', () => {
    const formGroup = new FormGroup({
      termDate: new FormControl('2026-06-01', HhResponseGroupsValidators.terminationAfterEffective('nonExistent')),
    });
    formGroup.get('termDate')!.updateValueAndValidity();
    expect(formGroup.get('termDate')!.hasError('effectiveDateRequired')).toBe(true);
    expect(formGroup.get('termDate')!.getError('effectiveDateRequired')).toEqual({
      errorCode: '5002',
      message: 'Effective date is required',
    });
  });

  it('should return effectiveDateRequired when effDate value is null', () => {
    const formGroup = new FormGroup({
      effDate: new FormControl(null),
      termDate: new FormControl('2026-06-01', HhResponseGroupsValidators.terminationAfterEffective('effDate')),
    });
    formGroup.get('termDate')!.updateValueAndValidity();
    expect(formGroup.get('termDate')!.hasError('effectiveDateRequired')).toBe(true);
  });

  it('should return effectiveDateRequired when effDate value is empty string', () => {
    const formGroup = new FormGroup({
      effDate: new FormControl(''),
      termDate: new FormControl('2026-06-01', HhResponseGroupsValidators.terminationAfterEffective('effDate')),
    });
    formGroup.get('termDate')!.updateValueAndValidity();
    expect(formGroup.get('termDate')!.hasError('effectiveDateRequired')).toBe(true);
  });

  it('should return null when termination is after effective', () => {
    const formGroup = new FormGroup({
      effDate: new FormControl('2026-01-01'),
      termDate: new FormControl('2026-06-01', HhResponseGroupsValidators.terminationAfterEffective('effDate')),
    });
    formGroup.get('termDate')!.updateValueAndValidity();
    expect(formGroup.get('termDate')!.errors).toBeNull();
  });

  it('should return null when termination equals effective', () => {
    const formGroup = new FormGroup({
      effDate: new FormControl('2026-06-01'),
      termDate: new FormControl('2026-06-01', HhResponseGroupsValidators.terminationAfterEffective('effDate')),
    });
    formGroup.get('termDate')!.updateValueAndValidity();
    expect(formGroup.get('termDate')!.errors).toBeNull();
  });

  it('should return error when termination is before effective', () => {
    const formGroup = new FormGroup({
      effDate: new FormControl('2026-06-01'),
      termDate: new FormControl('2026-01-01', HhResponseGroupsValidators.terminationAfterEffective('effDate')),
    });
    formGroup.get('termDate')!.updateValueAndValidity();
    expect(formGroup.get('termDate')!.hasError('terminationBeforeEffective')).toBe(true);
    expect(formGroup.get('termDate')!.getError('terminationBeforeEffective')).toEqual({
      errorCode: '5004',
      message: 'Termination date is before effective date',
    });
  });

  it('should return error when termination is one day before effective', () => {
    const formGroup = new FormGroup({
      effDate: new FormControl('2026-06-15'),
      termDate: new FormControl('2026-06-14', HhResponseGroupsValidators.terminationAfterEffective('effDate')),
    });
    formGroup.get('termDate')!.updateValueAndValidity();
    expect(formGroup.get('termDate')!.hasError('terminationBeforeEffective')).toBe(true);
  });
});

// =============================================================================
// maxLength
// =============================================================================

describe('HhResponseGroupsValidators.maxLength', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, HhResponseGroupsValidators.maxLength(240));
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', HhResponseGroupsValidators.maxLength(240));
    expect(control.errors).toBeNull();
  });

  it('should return null for value within limit', () => {
    const control = new FormControl('Hello', HhResponseGroupsValidators.maxLength(240));
    expect(control.errors).toBeNull();
  });

  it('should return null for value at exactly max length', () => {
    const value = 'A'.repeat(240);
    const control = new FormControl(value, HhResponseGroupsValidators.maxLength(240));
    expect(control.errors).toBeNull();
  });

  it('should return error for value exceeding max length', () => {
    const value = 'A'.repeat(241);
    const control = new FormControl(value, HhResponseGroupsValidators.maxLength(240));
    expect(control.hasError('maxLengthExceeded')).toBe(true);
    expect(control.getError('maxLengthExceeded')).toEqual({
      message: 'Maximum length is 240 characters',
      actualLength: 241,
      maxLength: 240,
    });
  });

  it('should work with different max length values', () => {
    const control = new FormControl('ABCDEFGHIJK', HhResponseGroupsValidators.maxLength(10));
    expect(control.hasError('maxLengthExceeded')).toBe(true);
    expect(control.getError('maxLengthExceeded')).toEqual({
      message: 'Maximum length is 10 characters',
      actualLength: 11,
      maxLength: 10,
    });
  });

  it('should return null for value at max length of 10', () => {
    const control = new FormControl('ABCDEFGHIJ', HhResponseGroupsValidators.maxLength(10));
    expect(control.errors).toBeNull();
  });
});

// =============================================================================
// requiredField
// =============================================================================

describe('HhResponseGroupsValidators.requiredField', () => {
  it('should return error for null value', () => {
    const control = new FormControl(null, HhResponseGroupsValidators.requiredField('Group Code'));
    expect(control.hasError('requiredField')).toBe(true);
    expect(control.getError('requiredField')).toEqual({
      errorCode: '0080',
      message: 'Group Code is required',
    });
  });

  it('should return error for undefined value', () => {
    const control = new FormControl(undefined, HhResponseGroupsValidators.requiredField('Group Code'));
    expect(control.hasError('requiredField')).toBe(true);
  });

  it('should return error for empty string', () => {
    const control = new FormControl('', HhResponseGroupsValidators.requiredField('Group Code'));
    expect(control.hasError('requiredField')).toBe(true);
  });

  it('should return error for whitespace-only string', () => {
    const control = new FormControl('   ', HhResponseGroupsValidators.requiredField('Group Code'));
    expect(control.hasError('requiredField')).toBe(true);
  });

  it('should return null for non-empty string', () => {
    const control = new FormControl('ABC', HhResponseGroupsValidators.requiredField('Group Code'));
    expect(control.errors).toBeNull();
  });

  it('should return null for numeric value', () => {
    const control = new FormControl(123, HhResponseGroupsValidators.requiredField('Group Code'));
    expect(control.errors).toBeNull();
  });

  it('should use custom field name in error message', () => {
    const control = new FormControl(null, HhResponseGroupsValidators.requiredField('Description'));
    expect(control.getError('requiredField')).toEqual({
      errorCode: '0080',
      message: 'Description is required',
    });
  });

  it('should return error for zero (falsy number)', () => {
    const control = new FormControl(0, HhResponseGroupsValidators.requiredField('Group Code'));
    // 0 is falsy, so !control.value is true -> returns error
    expect(control.hasError('requiredField')).toBe(true);
  });
});
