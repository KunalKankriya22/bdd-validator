import { FormControl, FormGroup } from '@angular/forms';
import { of, Subject } from 'rxjs';
import moment from 'moment';
import {
  yesNoValidator,
  effectiveDateNotInPastValidator,
  terminationDateNotInPastValidator,
  terminationAfterEffectiveValidator,
  testTypeDescriptionValidator,
  effectiveDateRequiredValidator,
  duplicateTestTypeValidator,
} from './test-type.validators';

// =============================================================================
// yesNoValidator
// =============================================================================

describe('yesNoValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, yesNoValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', yesNoValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for undefined', () => {
    const control = new FormControl(undefined, yesNoValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for Y', () => {
    const control = new FormControl('Y', yesNoValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for N', () => {
    const control = new FormControl('N', yesNoValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error for lowercase y (no toUpperCase in this validator)', () => {
    const control = new FormControl('y', yesNoValidator());
    expect(control.hasError('invalidYesNo')).toBe(true);
    expect(control.getError('invalidYesNo')).toEqual({
      errorCode: '1017',
      message: 'Value must be Y or N',
    });
  });

  it('should return error for lowercase n', () => {
    const control = new FormControl('n', yesNoValidator());
    expect(control.hasError('invalidYesNo')).toBe(true);
  });

  it('should return error for invalid value X', () => {
    const control = new FormControl('X', yesNoValidator());
    expect(control.hasError('invalidYesNo')).toBe(true);
  });

  it('should return error for numeric value', () => {
    const control = new FormControl('1', yesNoValidator());
    expect(control.hasError('invalidYesNo')).toBe(true);
  });

  it('should return error for multi-character string', () => {
    const control = new FormControl('YES', yesNoValidator());
    expect(control.hasError('invalidYesNo')).toBe(true);
  });
});

// =============================================================================
// effectiveDateNotInPastValidator
// =============================================================================

describe('effectiveDateNotInPastValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, effectiveDateNotInPastValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', effectiveDateNotInPastValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error for past date', () => {
    const pastDate = moment().subtract(1, 'day');
    const control = new FormControl(pastDate, effectiveDateNotInPastValidator());
    expect(control.hasError('dateInPast')).toBe(true);
    expect(control.getError('dateInPast')).toEqual({
      errorCode: '5003',
      message: 'Effective date cannot be in the past',
    });
  });

  it('should return null for today', () => {
    const today = moment().startOf('day');
    const control = new FormControl(today, effectiveDateNotInPastValidator());
    expect(control.hasError('dateInPast')).toBe(false);
  });

  it('should return null for future date', () => {
    const futureDate = moment().add(1, 'day');
    const control = new FormControl(futureDate, effectiveDateNotInPastValidator());
    expect(control.hasError('dateInPast')).toBe(false);
  });

  it('should return error for far past date', () => {
    const farPast = moment().subtract(1, 'year');
    const control = new FormControl(farPast, effectiveDateNotInPastValidator());
    expect(control.hasError('dateInPast')).toBe(true);
  });

  describe('with chapterToday parameter', () => {
    it('should use provided chapterToday for comparison', () => {
      const chapterToday = moment('2026-07-15');
      const pastDate = moment('2026-07-14');
      const control = new FormControl(pastDate, effectiveDateNotInPastValidator(chapterToday));
      expect(control.hasError('dateInPast')).toBe(true);
    });

    it('should accept date on chapterToday', () => {
      const chapterToday = moment('2026-07-15');
      const sameDate = moment('2026-07-15');
      const control = new FormControl(sameDate, effectiveDateNotInPastValidator(chapterToday));
      expect(control.hasError('dateInPast')).toBe(false);
    });

    it('should accept future date relative to chapterToday', () => {
      const chapterToday = moment('2026-07-15');
      const futureDate = moment('2026-07-20');
      const control = new FormControl(futureDate, effectiveDateNotInPastValidator(chapterToday));
      expect(control.hasError('dateInPast')).toBe(false);
    });

    it('should fall back to system date when chapterToday is undefined', () => {
      const pastDate = moment().subtract(1, 'day');
      const control = new FormControl(pastDate, effectiveDateNotInPastValidator(undefined));
      expect(control.hasError('dateInPast')).toBe(true);
    });
  });
});

// =============================================================================
// terminationDateNotInPastValidator
// =============================================================================

describe('terminationDateNotInPastValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null, terminationDateNotInPastValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('', terminationDateNotInPastValidator());
    expect(control.errors).toBeNull();
  });

  it('should return error for past date', () => {
    const pastDate = moment().subtract(1, 'day');
    const control = new FormControl(pastDate, terminationDateNotInPastValidator());
    expect(control.hasError('terminationDateInPast')).toBe(true);
    expect(control.getError('terminationDateInPast')).toEqual({
      errorCode: '3115',
      message: 'Termination date has passed',
    });
  });

  it('should return null for today', () => {
    const today = moment().startOf('day');
    const control = new FormControl(today, terminationDateNotInPastValidator());
    expect(control.hasError('terminationDateInPast')).toBe(false);
  });

  it('should return null for future date', () => {
    const futureDate = moment().add(1, 'day');
    const control = new FormControl(futureDate, terminationDateNotInPastValidator());
    expect(control.hasError('terminationDateInPast')).toBe(false);
  });

  describe('with chapterToday parameter', () => {
    it('should use provided chapterToday for comparison', () => {
      const chapterToday = moment('2026-07-15');
      const pastDate = moment('2026-07-14');
      const control = new FormControl(pastDate, terminationDateNotInPastValidator(chapterToday));
      expect(control.hasError('terminationDateInPast')).toBe(true);
    });

    it('should accept date on chapterToday', () => {
      const chapterToday = moment('2026-07-15');
      const sameDate = moment('2026-07-15');
      const control = new FormControl(sameDate, terminationDateNotInPastValidator(chapterToday));
      expect(control.hasError('terminationDateInPast')).toBe(false);
    });

    it('should fall back to system date when chapterToday is undefined', () => {
      const pastDate = moment().subtract(1, 'day');
      const control = new FormControl(pastDate, terminationDateNotInPastValidator(undefined));
      expect(control.hasError('terminationDateInPast')).toBe(true);
    });
  });
});

// =============================================================================
// terminationAfterEffectiveValidator
// =============================================================================

describe('terminationAfterEffectiveValidator (test-type)', () => {
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

  it('should return null when effDate is null', () => {
    formGroup.get('effDate')!.setValue(null);
    formGroup.get('termDate')!.setValue('2026-06-01');
    expect(formGroup.errors).toBeNull();
  });

  it('should return null when termDate is null', () => {
    formGroup.get('effDate')!.setValue('2026-01-01');
    formGroup.get('termDate')!.setValue(null);
    expect(formGroup.errors).toBeNull();
  });

  it('should return null when both dates are null', () => {
    expect(formGroup.errors).toBeNull();
  });

  it('should return null when termination is after effective', () => {
    formGroup.get('effDate')!.setValue(moment('2026-01-01'));
    formGroup.get('termDate')!.setValue(moment('2026-06-01'));
    expect(formGroup.errors).toBeNull();
  });

  it('should return null when termination equals effective', () => {
    formGroup.get('effDate')!.setValue(moment('2026-06-01'));
    formGroup.get('termDate')!.setValue(moment('2026-06-01'));
    expect(formGroup.errors).toBeNull();
  });

  it('should return error when termination is before effective', () => {
    formGroup.get('effDate')!.setValue(moment('2026-06-01'));
    formGroup.get('termDate')!.setValue(moment('2026-01-01'));
    expect(formGroup.hasError('terminationBeforeEffective')).toBe(true);
    expect(formGroup.getError('terminationBeforeEffective')).toEqual({
      errorCode: '5004',
      message: 'Termination Date must be greater than or equal to Effective Date',
    });
  });

  it('should return error when termination is one day before effective', () => {
    formGroup.get('effDate')!.setValue(moment('2026-06-15'));
    formGroup.get('termDate')!.setValue(moment('2026-06-14'));
    expect(formGroup.hasError('terminationBeforeEffective')).toBe(true);
  });

  it('should work with string date values', () => {
    formGroup.get('effDate')!.setValue('2026-12-01');
    formGroup.get('termDate')!.setValue('2026-01-01');
    expect(formGroup.hasError('terminationBeforeEffective')).toBe(true);
  });
});

// =============================================================================
// testTypeDescriptionValidator
// =============================================================================

describe('testTypeDescriptionValidator', () => {
  it('should return error for null value', () => {
    const control = new FormControl(null, testTypeDescriptionValidator());
    expect(control.hasError('descriptionRequired')).toBe(true);
    expect(control.getError('descriptionRequired')).toEqual({
      errorCode: '0080',
      message: 'Test Type Description must be entered',
    });
  });

  it('should return error for empty string', () => {
    const control = new FormControl('', testTypeDescriptionValidator());
    expect(control.hasError('descriptionRequired')).toBe(true);
  });

  it('should return error for undefined', () => {
    const control = new FormControl(undefined, testTypeDescriptionValidator());
    expect(control.hasError('descriptionRequired')).toBe(true);
  });

  it('should return error for whitespace-only string', () => {
    const control = new FormControl('   ', testTypeDescriptionValidator());
    expect(control.hasError('descriptionRequired')).toBe(true);
  });

  it('should return error for tabs and newlines only', () => {
    const control = new FormControl('\t\n', testTypeDescriptionValidator());
    expect(control.hasError('descriptionRequired')).toBe(true);
  });

  it('should return null for non-empty string', () => {
    const control = new FormControl('Test Type A', testTypeDescriptionValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for single character', () => {
    const control = new FormControl('A', testTypeDescriptionValidator());
    expect(control.errors).toBeNull();
  });
});

// =============================================================================
// effectiveDateRequiredValidator
// =============================================================================

describe('effectiveDateRequiredValidator', () => {
  it('should return error for null value', () => {
    const control = new FormControl(null, effectiveDateRequiredValidator());
    expect(control.hasError('effectiveDateRequired')).toBe(true);
    expect(control.getError('effectiveDateRequired')).toEqual({
      errorCode: '5002',
      message: 'Effective Date must be entered',
    });
  });

  it('should return error for empty string', () => {
    const control = new FormControl('', effectiveDateRequiredValidator());
    expect(control.hasError('effectiveDateRequired')).toBe(true);
  });

  it('should return error for undefined', () => {
    const control = new FormControl(undefined, effectiveDateRequiredValidator());
    expect(control.hasError('effectiveDateRequired')).toBe(true);
  });

  it('should return null for valid date string', () => {
    const control = new FormControl('2026-01-01', effectiveDateRequiredValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for moment object', () => {
    const control = new FormControl(moment(), effectiveDateRequiredValidator());
    expect(control.errors).toBeNull();
  });

  it('should return null for Date object', () => {
    const control = new FormControl(new Date(), effectiveDateRequiredValidator());
    expect(control.errors).toBeNull();
  });
});

// =============================================================================
// duplicateTestTypeValidator
// =============================================================================

describe('duplicateTestTypeValidator', () => {
  let mockApiService: { getTestTypeById: jasmine.Spy };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('TestTypesApiService', ['getTestTypeById']);
  });

  it('should return null (via of) for null value', (done) => {
    const validator = duplicateTestTypeValidator(mockApiService as any, 'TEST1');
    const control = new FormControl(null);
    const result$ = validator(control);
    result$.subscribe((result) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null (via of) for empty string value', (done) => {
    const validator = duplicateTestTypeValidator(mockApiService as any, 'TEST1');
    const control = new FormControl('');
    const result$ = validator(control);
    result$.subscribe((result) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null (via of) when testId is empty', (done) => {
    const validator = duplicateTestTypeValidator(mockApiService as any, '');
    const control = new FormControl('TYPEA');
    const result$ = validator(control);
    result$.subscribe((result) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return error when API finds existing test type', (done) => {
    mockApiService.getTestTypeById.and.returnValue(of({ id: 'TYPEA', description: 'Existing' }));
    const validator = duplicateTestTypeValidator(mockApiService as any, 'TEST1');
    const control = new FormControl('typeA');

    // First call activates the shareReplay subscription chain;
    // the Subject emission is lost but debounceTime is now subscribed to input$
    validator(control).subscribe();

    // Second call: input$.next() is now captured by debounceTime(400)
    validator(control).subscribe((result) => {
      expect(result).toEqual({
        duplicateTestType: { errorCode: '0319', message: 'Test type already exists for this test' },
      });
      expect(mockApiService.getTestTypeById).toHaveBeenCalledWith('TEST1', 'TYPEA');
      done();
    });
  });

  it('should return null when API finds no existing test type', (done) => {
    mockApiService.getTestTypeById.and.returnValue(of(null));
    const validator = duplicateTestTypeValidator(mockApiService as any, 'TEST1');
    const control = new FormControl('typeB');

    // First call activates the shareReplay subscription chain
    validator(control).subscribe();

    // Second call: input$.next() is now captured by debounceTime(400)
    validator(control).subscribe((result) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null when API throws error (catchError)', (done) => {
    mockApiService.getTestTypeById.and.returnValue(
      new (require('rxjs').Observable)((subscriber: any) => {
        subscriber.error(new Error('Network error'));
      })
    );
    const validator = duplicateTestTypeValidator(mockApiService as any, 'TEST1');
    const control = new FormControl('typeC');

    // First call activates the shareReplay subscription chain
    validator(control).subscribe();

    // Second call: input$.next() is now captured by debounceTime(400)
    validator(control).subscribe((result) => {
      expect(result).toBeNull();
      done();
    });
  });
});
