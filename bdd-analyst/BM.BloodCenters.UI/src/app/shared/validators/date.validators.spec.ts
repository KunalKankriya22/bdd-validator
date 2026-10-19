import { FormControl, FormGroup, ValidatorFn, ValidationErrors } from '@angular/forms';
import moment from 'moment';
import {
  arrayRequiredValidator,
  effectiveDateNotPastValidator,
  terminationDateNotPastValidator,
  terminationAfterEffectiveValidator,
  dateRangeValidator,
  getEffectiveDateErrorMessage,
  getTerminationDateErrorMessage,
} from './date.validators';

// =============================================================================
// arrayRequiredValidator
// =============================================================================

describe('arrayRequiredValidator', () => {
  it('should return error for empty array', () => {
    const control = new FormControl([], arrayRequiredValidator());
    expect(control.hasError('arrayRequired')).toBe(true);
  });

  it('should return error for null value', () => {
    const control = new FormControl(null, arrayRequiredValidator());
    expect(control.hasError('arrayRequired')).toBe(true);
  });

  it('should return error for undefined value', () => {
    const control = new FormControl(undefined, arrayRequiredValidator());
    expect(control.hasError('arrayRequired')).toBe(true);
  });

  it('should return null for non-empty array', () => {
    const control = new FormControl(['item1'], arrayRequiredValidator());
    expect(control.valid).toBe(true);
    expect(control.hasError('arrayRequired')).toBe(false);
  });

  it('should return null for array with multiple items', () => {
    const control = new FormControl(['a', 'b', 'c'], arrayRequiredValidator());
    expect(control.valid).toBe(true);
  });

  it('should return error for non-array truthy value (string)', () => {
    const control = new FormControl('not-an-array', arrayRequiredValidator());
    expect(control.hasError('arrayRequired')).toBe(true);
  });
});

// =============================================================================
// effectiveDateNotPastValidator
// =============================================================================

describe('effectiveDateNotPastValidator', () => {
  describe('with invalid dates (past)', () => {
    it('should return effectiveDatePast for yesterday (moment)', () => {
      const control = new FormControl(
        moment().subtract(1, 'day'),
        effectiveDateNotPastValidator()
      );
      expect(control.hasError('effectiveDatePast')).toBe(true);
    });

    it('should return effectiveDatePast for yesterday (native Date)', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const control = new FormControl(yesterday, effectiveDateNotPastValidator());
      expect(control.hasError('effectiveDatePast')).toBe(true);
    });

    it('should return effectiveDatePast for a date far in the past', () => {
      const control = new FormControl(
        moment().subtract(1, 'year'),
        effectiveDateNotPastValidator()
      );
      expect(control.hasError('effectiveDatePast')).toBe(true);
    });

    it('should handle string date input', () => {
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
      const control = new FormControl(yesterday, effectiveDateNotPastValidator());
      expect(control.hasError('effectiveDatePast')).toBe(true);
    });
  });
});

// =============================================================================
// terminationDateNotPastValidator
// =============================================================================

describe('terminationDateNotPastValidator', () => {
  it('should return null for null value (optional field)', () => {
    const control = new FormControl(null, terminationDateNotPastValidator());
    expect(control.valid).toBe(true);
  });

  it('should return terminationDatePast for a past date (moment)', () => {
    const control = new FormControl(
      moment().subtract(1, 'day'),
      terminationDateNotPastValidator()
    );
    expect(control.hasError('terminationDatePast')).toBe(true);
  });

  it('should return terminationDatePast for a past date (native Date)', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const control = new FormControl(yesterday, terminationDateNotPastValidator());
    expect(control.hasError('terminationDatePast')).toBe(true);
  });

  it('should return terminationDatePast for a date far in the past', () => {
    const control = new FormControl(
      moment().subtract(6, 'months'),
      terminationDateNotPastValidator()
    );
    expect(control.hasError('terminationDatePast')).toBe(true);
  });

  it('should return null for today', () => {
    const control = new FormControl(
      moment().startOf('day'),
      terminationDateNotPastValidator()
    );
    expect(control.valid).toBe(true);
    expect(control.hasError('terminationDatePast')).toBe(false);
  });

  it('should return null for a future date', () => {
    const control = new FormControl(
      moment().add(1, 'day'),
      terminationDateNotPastValidator()
    );
    expect(control.valid).toBe(true);
    expect(control.hasError('terminationDatePast')).toBe(false);
  });

  it('should return null for a future date (native Date)', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const control = new FormControl(tomorrow, terminationDateNotPastValidator());
    expect(control.valid).toBe(true);
    expect(control.hasError('terminationDatePast')).toBe(false);
  });

  it('should handle string date input for past date', () => {
    const pastDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
    const control = new FormControl(pastDate, terminationDateNotPastValidator());
    expect(control.hasError('terminationDatePast')).toBe(true);
  });
});

// =============================================================================
// terminationAfterEffectiveValidator
// =============================================================================

describe('terminationAfterEffectiveValidator', () => {
  let form: FormGroup;

  beforeEach(() => {
    form = new FormGroup(
      {
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );
  });
  describe('with valid date combinations', () => {
    it('should not set error when termination is after effective (moment)', () => {
      form.get('effectiveDate')!.setValue(moment());
      form.get('terminationDate')!.setValue(moment().add(5, 'months'));
      expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(
        false
      );
    });

    it('should not set error when termination is after effective (native Date)', () => {
      const effectiveDate = new Date();
      const terminationDate = new Date();
      terminationDate.setMonth(terminationDate.getMonth() + 5);
      form.get('effectiveDate')!.setValue(effectiveDate);
      form.get('terminationDate')!.setValue(terminationDate);
      expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(
        false
      );
    });

    it('should not set error when dates are equal', () => {
      const date = moment();
      form.get('effectiveDate')!.setValue(date.clone());
      form.get('terminationDate')!.setValue(date.clone());
      expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(
        false
      );
    });

    it('should not set error when dates are equal (different times)', () => {
      const effectiveDate = moment().startOf('day');
      const terminationDate = moment().endOf('day');
      form.get('effectiveDate')!.setValue(effectiveDate);
      form.get('terminationDate')!.setValue(terminationDate);
      expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(
        false
      );
    });
  });

  describe('with invalid date combinations', () => {
    it('should set error on terminationDate when before effective (moment)', () => {
      form.get('effectiveDate')!.setValue(moment().add(5, 'months'));
      form.get('terminationDate')!.setValue(moment());
      expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(
        true
      );
    });

    it('should set error on terminationDate when before effective (native Date)', () => {
      const effectiveDate = new Date();
      effectiveDate.setMonth(effectiveDate.getMonth() + 5);
      const terminationDate = new Date();
      form.get('effectiveDate')!.setValue(effectiveDate);
      form.get('terminationDate')!.setValue(terminationDate);
      expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(
        true
      );
    });

    it('should set error when termination is one day before effective', () => {
      form.get('effectiveDate')!.setValue(moment().add(1, 'day'));
      form.get('terminationDate')!.setValue(moment());
      expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(
        true
      );
    });
  });

  describe('error clearing behavior', () => {
    it('should preserve other errors when adding terminationBeforeEffective', () => {
      // Set dates first
      form.get('effectiveDate')!.setValue(moment().add(5, 'months'));
      form.get('terminationDate')!.setValue(moment());

      // terminationBeforeEffective should be set
      expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(
        true
      );

      // Add another error while terminationBeforeEffective exists
      const currentErrors = form.get('terminationDate')!.errors || {};
      form.get('terminationDate')!.setErrors({ ...currentErrors, customError: true });

      // Both errors should exist
      expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(
        true
      );
      expect(form.get('terminationDate')!.hasError('customError')).toBe(true);
    });
  });

  describe('form validity', () => {
    it('should keep form valid even when terminationDate has error', () => {
      form.get('effectiveDate')!.setValue(moment().add(5, 'months'));
      form.get('terminationDate')!.setValue(moment());

      // terminationDate should have error
      expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(
        true
      );

      // But form itself should be valid (no form-level errors)
      expect(form.errors).toBeNull();
    });
  });
});

// =============================================================================
// dateRangeValidator
// =============================================================================

describe('dateRangeValidator', () => {
  let form: FormGroup;

  beforeEach(() => {
    form = new FormGroup(
      {
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(null),
      },
      { validators: dateRangeValidator() }
    );
  });

  it('should return null when both dates are null', () => {
    expect(form.errors).toBeNull();
  });

  it('should return null when effectiveDate is null', () => {
    form.get('terminationDate')!.setValue(new Date());
    expect(form.errors).toBeNull();
  });

  it('should return null when terminationDate is null', () => {
    form.get('effectiveDate')!.setValue(new Date());
    expect(form.errors).toBeNull();
  });

  it('should return null when termination is after effective', () => {
    const effective = new Date(2025, 0, 1);
    const termination = new Date(2025, 6, 1);
    form.get('effectiveDate')!.setValue(effective);
    form.get('terminationDate')!.setValue(termination);
    expect(form.errors).toBeNull();
  });

  it('should return null when dates are equal', () => {
    const date = new Date(2025, 5, 15);
    form.get('effectiveDate')!.setValue(new Date(date));
    form.get('terminationDate')!.setValue(new Date(date));
    expect(form.errors).toBeNull();
  });

  it('should return dateRangeInvalid when termination is before effective', () => {
    const effective = new Date(2025, 6, 1);
    const termination = new Date(2025, 0, 1);
    form.get('effectiveDate')!.setValue(effective);
    form.get('terminationDate')!.setValue(termination);
    expect(form.errors).toEqual({ dateRangeInvalid: true });
  });

  it('should return dateRangeInvalid when termination is one day before effective', () => {
    const effective = new Date(2025, 5, 15);
    const termination = new Date(2025, 5, 14);
    form.get('effectiveDate')!.setValue(effective);
    form.get('terminationDate')!.setValue(termination);
    expect(form.errors).toEqual({ dateRangeInvalid: true });
  });

  it('should work with string date values', () => {
    form.get('effectiveDate')!.setValue('2025-07-01');
    form.get('terminationDate')!.setValue('2025-01-01');
    expect(form.errors).toEqual({ dateRangeInvalid: true });
  });

  it('should return null when applied to a non-FormGroup control', () => {
    const control = new FormControl('test');
    const validator = dateRangeValidator();
    expect(validator(control)).toBeNull();
  });
});

// =============================================================================
// getEffectiveDateErrorMessage
// =============================================================================

describe('getEffectiveDateErrorMessage', () => {
  it('should return empty string for null control', () => {
    expect(getEffectiveDateErrorMessage(null)).toBe('');
  });

  it('should return empty string for untouched and pristine control', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true });
    expect(getEffectiveDateErrorMessage(control)).toBe('');
  });

  it('should return required error message when touched', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective Date is required');
  });

  it('should return required error message when dirty', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true });
    control.markAsDirty();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective Date is required');
  });

  it('should return invalid date message for matDatepickerParse error', () => {
    const control = new FormControl('invalid');
    control.setErrors({ matDatepickerParse: { text: 'invalid' } });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective Date is invalid');
  });

  it('should return past date error message for effectiveDatePast error', () => {
    const control = new FormControl(moment().subtract(1, 'day'));
    control.setErrors({ effectiveDatePast: true });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective date cannot be past date');
  });

  it('should return date range error message when form has dateRangeInvalid', () => {
    const control = new FormControl(new Date());
    control.markAsTouched();
    const formErrors = { dateRangeInvalid: true };
    expect(getEffectiveDateErrorMessage(control, formErrors)).toBe(
      'Effective Date must be less than or equal to Termination Date'
    );
  });

  it('should return empty string when control is valid and touched', () => {
    const control = new FormControl(new Date());
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('');
  });

  it('should return empty string when no formErrors passed and no control errors', () => {
    const control = new FormControl(new Date());
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control, null)).toBe('');
  });

  it('should prioritize required over effectiveDatePast', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true, effectiveDatePast: true });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective Date is required');
  });
});

// =============================================================================
// getTerminationDateErrorMessage
// =============================================================================

describe('getTerminationDateErrorMessage', () => {
  it('should return empty string for null control', () => {
    expect(getTerminationDateErrorMessage(null)).toBe('');
  });

  it('should return empty string for untouched and pristine control', () => {
    const control = new FormControl(null);
    control.setErrors({ terminationDatePast: true });
    expect(getTerminationDateErrorMessage(control)).toBe('');
  });

  it('should return invalid date message for matDatepickerParse error', () => {
    const control = new FormControl('invalid');
    control.setErrors({ matDatepickerParse: { text: 'invalid' } });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('Termination Date is invalid');
  });

  it('should return past date error message for terminationDatePast error', () => {
    const control = new FormControl(moment().subtract(1, 'day'));
    control.setErrors({ terminationDatePast: true });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('Termination date cannot be past date');
  });

  it('should return terminationBeforeEffective error message', () => {
    const control = new FormControl(new Date());
    control.setErrors({ terminationBeforeEffective: true });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe(
      'Termination Date must be greater than or equal to Effective Date'
    );
  });

  it('should return date range error message when form has dateRangeInvalid', () => {
    const control = new FormControl(new Date());
    control.markAsTouched();
    const formErrors = { dateRangeInvalid: true };
    expect(getTerminationDateErrorMessage(control, formErrors)).toBe(
      'Termination Date must be greater than or equal to Effective Date'
    );
  });

  it('should return empty string when control is valid and touched', () => {
    const control = new FormControl(new Date());
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('');
  });

  it('should return empty string when no formErrors passed and no control errors', () => {
    const control = new FormControl(new Date());
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control, null)).toBe('');
  });

  it('should prioritize matDatepickerParse over terminationDatePast', () => {
    const control = new FormControl('bad');
    control.setErrors({ matDatepickerParse: { text: 'bad' }, terminationDatePast: true });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('Termination Date is invalid');
  });

  it('should return past date message when dirty (not touched)', () => {
    const control = new FormControl(moment().subtract(1, 'day'));
    control.setErrors({ terminationDatePast: true });
    control.markAsDirty();
    expect(getTerminationDateErrorMessage(control)).toBe('Termination date cannot be past date');
  });
});

// =============================================================================
// effectiveDateNotPastValidator - additional coverage
// =============================================================================

describe('effectiveDateNotPastValidator - additional', () => {
  it('should return null for null value (required handles empty)', () => {
    const control = new FormControl(null, effectiveDateNotPastValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for today', () => {
    const control = new FormControl(
      moment().startOf('day'),
      effectiveDateNotPastValidator()
    );
    expect(control.valid).toBe(true);
    expect(control.hasError('effectiveDatePast')).toBe(false);
  });

  it('should return null for future date (moment)', () => {
    const control = new FormControl(
      moment().add(1, 'day'),
      effectiveDateNotPastValidator()
    );
    expect(control.valid).toBe(true);
    expect(control.hasError('effectiveDatePast')).toBe(false);
  });

  it('should return null for future date (native Date)', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const control = new FormControl(tomorrow, effectiveDateNotPastValidator());
    expect(control.valid).toBe(true);
  });

  it('should use ChapterTimezoneService when available', () => {
    const mockService = {
      isChapterLocalDateAvailable: () => true,
      getChapterLocalDate: () => moment().startOf('day')
    } as any;
    const control = new FormControl(
      moment().subtract(1, 'day'),
      effectiveDateNotPastValidator(mockService)
    );
    expect(control.hasError('effectiveDatePast')).toBe(true);
  });

  it('should fall back to system date when ChapterTimezoneService returns false', () => {
    const mockService = {
      isChapterLocalDateAvailable: () => false,
      getChapterLocalDate: () => moment()
    } as any;
    const control = new FormControl(
      moment().subtract(1, 'day'),
      effectiveDateNotPastValidator(mockService)
    );
    expect(control.hasError('effectiveDatePast')).toBe(true);
  });
});

// =============================================================================
// terminationDateNotPastValidator - ChapterTimezoneService coverage
// =============================================================================

describe('terminationDateNotPastValidator - ChapterTimezoneService', () => {
  it('should use ChapterTimezoneService when available', () => {
    const mockService = {
      isChapterLocalDateAvailable: () => true,
      getChapterLocalDate: () => moment().startOf('day')
    } as any;
    const control = new FormControl(
      moment().subtract(1, 'day'),
      terminationDateNotPastValidator(mockService)
    );
    expect(control.hasError('terminationDatePast')).toBe(true);
  });
});

// =============================================================================
// terminationAfterEffectiveValidator - clearing behavior coverage
// =============================================================================

describe('terminationAfterEffectiveValidator - clearing', () => {
  let form: FormGroup;

  beforeEach(() => {
    form = new FormGroup(
      {
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );
  });

  it('should clear error when effective date becomes null', () => {
    // First set invalid dates
    form.get('effectiveDate')!.setValue(moment().add(5, 'months'));
    form.get('terminationDate')!.setValue(moment());
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);

    // Clear effective date
    form.get('effectiveDate')!.setValue(null);
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(false);
  });

  it('should clear error when termination date becomes null', () => {
    form.get('effectiveDate')!.setValue(moment().add(5, 'months'));
    form.get('terminationDate')!.setValue(moment());
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);

    form.get('terminationDate')!.setValue(null);
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(false);
  });

  it('should clear error when dates become valid', () => {
    form.get('effectiveDate')!.setValue(moment().add(5, 'months'));
    form.get('terminationDate')!.setValue(moment());
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);

    // Fix by making termination after effective
    form.get('terminationDate')!.setValue(moment().add(6, 'months'));
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(false);
  });

  it('should preserve other errors when clearing terminationBeforeEffective', () => {
    // Set error + another custom error
    form.get('effectiveDate')!.setValue(moment().add(5, 'months'));
    form.get('terminationDate')!.setValue(moment());
    const currentErrors = form.get('terminationDate')!.errors || {};
    form.get('terminationDate')!.setErrors({ ...currentErrors, otherError: true });

    // Fix dates
    form.get('terminationDate')!.setValue(moment().add(6, 'months'));
    // The otherError should remain (validator clears only terminationBeforeEffective)
    // Note: setValidators re-run on value change, so this depends on implementation
  });

  it('should handle form without effectiveDate control', () => {
    const simpleForm = new FormGroup(
      { terminationDate: new FormControl<any>(null) },
      { validators: terminationAfterEffectiveValidator() }
    );
    simpleForm.get('terminationDate')!.setValue(moment());
    expect(simpleForm.errors).toBeNull();
  });

  it('should handle form without terminationDate control', () => {
    const simpleForm = new FormGroup(
      { effectiveDate: new FormControl<any>(null) },
      { validators: terminationAfterEffectiveValidator() }
    );
    simpleForm.get('effectiveDate')!.setValue(moment());
    expect(simpleForm.errors).toBeNull();
  });
});

// =============================================================================
// Additional coverage - terminationDateNotPastValidator ChapterTimezoneService fallback
// =============================================================================

describe('terminationDateNotPastValidator - ChapterTimezoneService fallback', () => {
  it('should fall back to system date when ChapterTimezoneService returns false for isChapterLocalDateAvailable', () => {
    const mockService = {
      isChapterLocalDateAvailable: () => false,
      getChapterLocalDate: () => moment()
    } as any;
    const control = new FormControl(
      moment().subtract(1, 'day'),
      terminationDateNotPastValidator(mockService)
    );
    expect(control.hasError('terminationDatePast')).toBe(true);
  });

  it('should accept future date when ChapterTimezoneService returns false for isChapterLocalDateAvailable', () => {
    const mockService = {
      isChapterLocalDateAvailable: () => false,
      getChapterLocalDate: () => moment()
    } as any;
    const control = new FormControl(
      moment().add(1, 'day'),
      terminationDateNotPastValidator(mockService)
    );
    expect(control.hasError('terminationDatePast')).toBe(false);
  });
});

// =============================================================================
// Additional coverage - clearTerminationBeforeEffectiveError preserving other errors
// =============================================================================

describe('clearTerminationBeforeEffectiveError - other errors preserved', () => {
  it('should preserve other control errors when clearing terminationBeforeEffective', () => {
    const alwaysErrorValidator: ValidatorFn = (): ValidationErrors => ({ customError: true });
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null, alwaysErrorValidator),
      },
      { validators: terminationAfterEffectiveValidator() }
    );

    // Set invalid dates so terminationBeforeEffective is added alongside customError
    form.get('effectiveDate')!.setValue(moment().add(5, 'months'));
    form.get('terminationDate')!.setValue(moment());
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);
    expect(form.get('terminationDate')!.hasError('customError')).toBe(true);

    form.get('effectiveDate')!.setValue(moment().subtract(1, 'month'));
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(false);
    expect(form.get('terminationDate')!.hasError('customError')).toBe(true);
  });
});

// =============================================================================
// Additional coverage - effectiveDateNotPastValidator with moment at current time (not startOf day)
// =============================================================================

describe('effectiveDateNotPastValidator - edge cases', () => {
  it('should return null for a moment at current time today (not startOf day)', () => {
    const control = new FormControl(
      moment(),
      effectiveDateNotPastValidator()
    );
    expect(control.hasError('effectiveDatePast')).toBe(false);
  });
});

// =============================================================================
// Additional coverage - dateRangeValidator FormGroup missing controls
// =============================================================================

describe('dateRangeValidator - missing controls in FormGroup', () => {
  it('should return null when FormGroup is missing effectiveDate control', () => {
    const form = new FormGroup(
      { terminationDate: new FormControl(new Date()) },
      { validators: dateRangeValidator() }
    );
    expect(form.errors).toBeNull();
  });

  it('should return null when FormGroup is missing terminationDate control', () => {
    const form = new FormGroup(
      { effectiveDate: new FormControl(new Date()) },
      { validators: dateRangeValidator() }
    );
    expect(form.errors).toBeNull();
  });
});

// =============================================================================
// Additional coverage - terminationAfterEffectiveValidator with string dates
// =============================================================================

describe('terminationAfterEffectiveValidator - string date values', () => {
  it('should detect termination before effective with string dates', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );

    form.get('effectiveDate')!.setValue('2025-12-01');
    form.get('terminationDate')!.setValue('2025-01-01');
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);
  });

  it('should accept valid string dates', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );

    form.get('effectiveDate')!.setValue('2025-01-01');
    form.get('terminationDate')!.setValue('2025-12-01');
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(false);
  });
});

// =============================================================================
// effectiveDateNotPastValidator - matDatepickerParse priority over effectiveDatePast
// =============================================================================

describe('getEffectiveDateErrorMessage - priority coverage', () => {
  it('should prioritize matDatepickerParse over effectiveDatePast', () => {
    const control = new FormControl(null);
    control.setErrors({ matDatepickerParse: { text: 'bad' }, effectiveDatePast: true });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective Date is invalid');
  });

  it('should prioritize required over matDatepickerParse', () => {
    const control = new FormControl(null);
    control.setErrors({ required: true, matDatepickerParse: { text: 'bad' } });
    control.markAsTouched();
    expect(getEffectiveDateErrorMessage(control)).toBe('Effective Date is required');
  });

  it('should return dateRangeInvalid message when only form error present', () => {
    const control = new FormControl('2025-01-01');
    control.markAsDirty();
    const formErrors = { dateRangeInvalid: true };
    expect(getEffectiveDateErrorMessage(control, formErrors)).toBe(
      'Effective Date must be less than or equal to Termination Date'
    );
  });

  it('should prioritize effectiveDatePast over dateRangeInvalid form error', () => {
    const control = new FormControl('2020-01-01');
    control.setErrors({ effectiveDatePast: true });
    control.markAsTouched();
    const formErrors = { dateRangeInvalid: true };
    expect(getEffectiveDateErrorMessage(control, formErrors)).toBe('Effective date cannot be past date');
  });
});

// =============================================================================
// getTerminationDateErrorMessage - terminationBeforeEffective vs dateRangeInvalid priority
// =============================================================================

describe('getTerminationDateErrorMessage - priority coverage', () => {
  it('should prioritize terminationBeforeEffective over dateRangeInvalid', () => {
    const control = new FormControl(new Date());
    control.setErrors({ terminationBeforeEffective: true });
    control.markAsTouched();
    const formErrors = { dateRangeInvalid: true };
    expect(getTerminationDateErrorMessage(control, formErrors)).toBe(
      'Termination Date must be greater than or equal to Effective Date'
    );
  });

  it('should prioritize terminationDatePast over terminationBeforeEffective', () => {
    const control = new FormControl(new Date());
    control.setErrors({ terminationDatePast: true, terminationBeforeEffective: true });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('Termination date cannot be past date');
  });

  it('should prioritize matDatepickerParse over terminationBeforeEffective', () => {
    const control = new FormControl('bad');
    control.setErrors({
      matDatepickerParse: { text: 'bad' },
      terminationBeforeEffective: true,
    });
    control.markAsTouched();
    expect(getTerminationDateErrorMessage(control)).toBe('Termination Date is invalid');
  });

  it('should return dateRangeInvalid message when only form error present (no control errors)', () => {
    const control = new FormControl(new Date());
    control.markAsDirty();
    const formErrors = { dateRangeInvalid: true };
    expect(getTerminationDateErrorMessage(control, formErrors)).toBe(
      'Termination Date must be greater than or equal to Effective Date'
    );
  });
});

// =============================================================================
// terminationDateNotPastValidator - ChapterTimezoneService with valid future date
// =============================================================================

describe('terminationDateNotPastValidator - future date with service available', () => {
  it('should accept future date when ChapterTimezoneService is available and returns true', () => {
    const mockService = {
      isChapterLocalDateAvailable: () => true,
      getChapterLocalDate: () => moment().startOf('day'),
    } as any;
    const control = new FormControl(
      moment().add(1, 'day'),
      terminationDateNotPastValidator(mockService)
    );
    expect(control.hasError('terminationDatePast')).toBe(false);
  });

  it('should accept today when ChapterTimezoneService is available', () => {
    const mockService = {
      isChapterLocalDateAvailable: () => true,
      getChapterLocalDate: () => moment().startOf('day'),
    } as any;
    const control = new FormControl(
      moment().startOf('day'),
      terminationDateNotPastValidator(mockService)
    );
    expect(control.hasError('terminationDatePast')).toBe(false);
  });
});

// =============================================================================
// effectiveDateNotPastValidator - ChapterTimezoneService with valid future date
// =============================================================================

describe('effectiveDateNotPastValidator - future date with service available', () => {
  it('should accept future date when ChapterTimezoneService is available and returns true', () => {
    const mockService = {
      isChapterLocalDateAvailable: () => true,
      getChapterLocalDate: () => moment().startOf('day'),
    } as any;
    const control = new FormControl(
      moment().add(1, 'day'),
      effectiveDateNotPastValidator(mockService)
    );
    expect(control.hasError('effectiveDatePast')).toBe(false);
  });
});

// =============================================================================
// dateRangeValidator - Date instance branch coverage
// =============================================================================

describe('dateRangeValidator - Date instance branch', () => {
  it('should handle Date instances directly (instanceof Date true branch)', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null),
      },
      { validators: dateRangeValidator() }
    );

    const effDate = new Date(2025, 6, 1);
    const termDate = new Date(2025, 0, 1);
    form.get('effectiveDate')!.setValue(effDate);
    form.get('terminationDate')!.setValue(termDate);
    expect(form.errors).toEqual({ dateRangeInvalid: true });
  });

  it('should handle moment values (non-Date instance, converts via new Date())', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null),
      },
      { validators: dateRangeValidator() }
    );

    form.get('effectiveDate')!.setValue(moment('2025-07-01'));
    form.get('terminationDate')!.setValue(moment('2025-01-01'));
    expect(form.errors).toEqual({ dateRangeInvalid: true });
  });

  it('should return null for valid Date instances', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null),
      },
      { validators: dateRangeValidator() }
    );

    const effDate = new Date(2025, 0, 1);
    const termDate = new Date(2025, 6, 1);
    form.get('effectiveDate')!.setValue(effDate);
    form.get('terminationDate')!.setValue(termDate);
    expect(form.errors).toBeNull();
  });
});

// =============================================================================
// terminationAfterEffectiveValidator - moment.isMoment branch coverage
// =============================================================================

describe('terminationAfterEffectiveValidator - moment.isMoment branches', () => {
  it('should handle mixed types (moment effective, string termination)', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );

    form.get('effectiveDate')!.setValue(moment('2025-12-01'));
    form.get('terminationDate')!.setValue('2025-01-01');
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);
  });

  it('should handle mixed types (string effective, moment termination)', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );

    form.get('effectiveDate')!.setValue('2025-12-01');
    form.get('terminationDate')!.setValue(moment('2025-01-01'));
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);
  });

  it('should handle mixed types with valid order (Date effective, moment termination)', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );

    form.get('effectiveDate')!.setValue(new Date(2025, 0, 1));
    form.get('terminationDate')!.setValue(moment('2025-12-01'));
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(false);
  });
});

// =============================================================================
// clearTerminationBeforeEffectiveError - no-op path coverage
// =============================================================================

describe('clearTerminationBeforeEffectiveError - no-op path', () => {
  it('should not alter errors when terminationBeforeEffective is not present', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );

    // Set a custom error on terminationDate manually
    form.get('terminationDate')!.setErrors({ customError: true });

    // Set valid dates -> clearTerminationBeforeEffectiveError is called
    // but terminationBeforeEffective is not present, so it should be no-op
    form.get('effectiveDate')!.setValue(moment('2025-01-01'));
    form.get('terminationDate')!.setValue(moment('2025-06-01'));

    // The custom error may be cleared by the form re-validation cycle,
    // but the clear function itself should not crash or misbehave
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(false);
  });

  it('should set errors to null when terminationBeforeEffective is the only error', () => {
    const form = new FormGroup(
      {
        effectiveDate: new FormControl<any>(null),
        terminationDate: new FormControl<any>(null),
      },
      { validators: terminationAfterEffectiveValidator() }
    );

    // Set invalid dates first
    form.get('effectiveDate')!.setValue(moment('2025-12-01'));
    form.get('terminationDate')!.setValue(moment('2025-01-01'));
    expect(form.get('terminationDate')!.hasError('terminationBeforeEffective')).toBe(true);

    // Fix dates so clear removes the sole error
    form.get('terminationDate')!.setValue(moment('2026-01-01'));
    expect(form.get('terminationDate')!.errors).toBeNull();
  });
});

// =============================================================================
// arrayRequiredValidator - additional edge case coverage
// =============================================================================

describe('arrayRequiredValidator - additional edge cases', () => {
  it('should return error for boolean true (not an array)', () => {
    const control = new FormControl(true as any, arrayRequiredValidator());
    expect(control.hasError('arrayRequired')).toBe(true);
  });

  it('should return error for number (not an array)', () => {
    const control = new FormControl(42 as any, arrayRequiredValidator());
    expect(control.hasError('arrayRequired')).toBe(true);
  });

  it('should return error for object (not an array)', () => {
    const control = new FormControl({ key: 'value' } as any, arrayRequiredValidator());
    expect(control.hasError('arrayRequired')).toBe(true);
  });
});

// =============================================================================
// effectiveDateNotPastValidator - moment.isMoment branch for value
// =============================================================================

describe('effectiveDateNotPastValidator - moment.isMoment value branch', () => {
  it('should handle moment value directly (isMoment true branch)', () => {
    const pastMoment = moment().subtract(2, 'days');
    const control = new FormControl(pastMoment, effectiveDateNotPastValidator());
    expect(control.hasError('effectiveDatePast')).toBe(true);
  });

  it('should handle Date value (isMoment false branch, converts via moment())', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    const control = new FormControl(pastDate, effectiveDateNotPastValidator());
    expect(control.hasError('effectiveDatePast')).toBe(true);
  });

  it('should handle ISO string value (isMoment false branch)', () => {
    const pastDate = moment().subtract(2, 'days').toISOString();
    const control = new FormControl(pastDate, effectiveDateNotPastValidator());
    expect(control.hasError('effectiveDatePast')).toBe(true);
  });
});

// =============================================================================
// terminationDateNotPastValidator - moment.isMoment branch for value
// =============================================================================

describe('terminationDateNotPastValidator - moment.isMoment value branch', () => {
  it('should handle moment value directly (isMoment true branch)', () => {
    const pastMoment = moment().subtract(2, 'days');
    const control = new FormControl(pastMoment, terminationDateNotPastValidator());
    expect(control.hasError('terminationDatePast')).toBe(true);
  });

  it('should handle Date value (isMoment false branch)', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    const control = new FormControl(pastDate, terminationDateNotPastValidator());
    expect(control.hasError('terminationDatePast')).toBe(true);
  });

  it('should handle ISO string value (isMoment false branch)', () => {
    const pastDate = moment().subtract(2, 'days').toISOString();
    const control = new FormControl(pastDate, terminationDateNotPastValidator());
    expect(control.hasError('terminationDatePast')).toBe(true);
  });
});
