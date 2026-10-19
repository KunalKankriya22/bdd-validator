import { FormControl, FormGroup } from '@angular/forms';
import { FormGroupDirective, NgForm } from '@angular/forms';
import {
  CrossFieldErrorMatcher,
  minTargetMaxValidator,
  numericFieldValidator,
  headerDateRangeValidator,
  detailDateRangeValidator,
  termDateNotInPastValidator,
} from './min-target-max.validator';
import moment from 'moment';

describe('Min-Target-Max Validators', () => {

  describe('CrossFieldErrorMatcher', () => {
    it('should return true when control is invalid, dirty', () => {
      const matcher = new CrossFieldErrorMatcher(['groupError']);
      const control = new FormControl('');
      control.setErrors({ required: true });
      control.markAsDirty();

      expect(matcher.isErrorState(control, null)).toBe(true);
    });

    it('should return true when control is invalid, touched', () => {
      const matcher = new CrossFieldErrorMatcher(['groupError']);
      const control = new FormControl('');
      control.setErrors({ required: true });
      control.markAsTouched();

      expect(matcher.isErrorState(control, null)).toBe(true);
    });

    it('should return false when control is valid and untouched', () => {
      const matcher = new CrossFieldErrorMatcher(['groupError']);
      const control = new FormControl('valid');

      expect(matcher.isErrorState(control, null)).toBe(false);
    });

    it('should return true when parent group has matching error and control is touched', () => {
      const matcher = new CrossFieldErrorMatcher(['groupError']);
      const group = new FormGroup({
        field: new FormControl('valid'),
      });
      group.setErrors({ groupError: true });
      const control = group.get('field') as FormControl;
      control.markAsTouched();

      expect(matcher.isErrorState(control, null)).toBe(true);
    });

    it('should return false when parent group error key does not match', () => {
      const matcher = new CrossFieldErrorMatcher(['groupError']);
      const group = new FormGroup({
        field: new FormControl('valid'),
      });
      group.setErrors({ otherError: true });
      const control = group.get('field') as FormControl;

      expect(matcher.isErrorState(control, null)).toBe(false);
    });

    it('should return false when control is null', () => {
      const matcher = new CrossFieldErrorMatcher(['groupError']);
      expect(matcher.isErrorState(null, null)).toBe(false);
    });

    it('should handle multiple group error keys', () => {
      const matcher = new CrossFieldErrorMatcher(['errorA', 'errorB']);
      const group = new FormGroup({
        field: new FormControl('valid'),
      });
      group.setErrors({ errorB: true });
      const control = group.get('field') as FormControl;
      control.markAsTouched();

      expect(matcher.isErrorState(control, null)).toBe(true);
    });

    it('should return false when control has no parent', () => {
      const matcher = new CrossFieldErrorMatcher(['groupError']);
      const control = new FormControl('valid');
      control.markAsTouched();

      expect(matcher.isErrorState(control, null)).toBe(false);
    });
  });

  describe('minTargetMaxValidator', () => {
    let validator: ReturnType<typeof minTargetMaxValidator>;

    beforeEach(() => {
      validator = minTargetMaxValidator();
    });

    function buildGroup(overrides: Record<string, any> = {}): FormGroup {
      return new FormGroup({
        units: new FormControl(overrides.units ?? 'NUM'),
        targetValue: new FormControl(overrides.targetValue ?? null),
        minAccept: new FormControl(overrides.minAccept ?? null),
        maxAccept: new FormControl(overrides.maxAccept ?? null),
      });
    }

    describe('short-circuit for FREE and CHAR units', () => {
      it('should return null when units is FREE', () => {
        const group = buildGroup({ units: 'FREE', targetValue: '100', minAccept: '200' });
        expect(validator(group)).toBeNull();
      });

      it('should return null when units is CHAR', () => {
        const group = buildGroup({ units: 'CHAR', targetValue: '100', minAccept: '200' });
        expect(validator(group)).toBeNull();
      });
    });

    describe('target less than min', () => {
      it('should return targetLessThanMin when target < min', () => {
        const group = buildGroup({ targetValue: '5', minAccept: '10' });
        expect(validator(group)).toEqual({ targetLessThanMin: true });
      });

      it('should return null when target equals min', () => {
        const group = buildGroup({ targetValue: '10', minAccept: '10' });
        expect(validator(group)).toBeNull();
      });

      it('should return null when target > min', () => {
        const group = buildGroup({ targetValue: '15', minAccept: '10' });
        expect(validator(group)).toBeNull();
      });
    });

    describe('target greater than max', () => {
      it('should return targetGreaterThanMax when target > max', () => {
        const group = buildGroup({ targetValue: '20', maxAccept: '10' });
        expect(validator(group)).toEqual({ targetGreaterThanMax: true });
      });

      it('should return null when target equals max', () => {
        const group = buildGroup({ targetValue: '10', maxAccept: '10' });
        expect(validator(group)).toBeNull();
      });

      it('should return null when target < max', () => {
        const group = buildGroup({ targetValue: '5', maxAccept: '10' });
        expect(validator(group)).toBeNull();
      });
    });

    describe('min greater than max', () => {
      it('should return minGreaterThanMax when min > max', () => {
        const group = buildGroup({ minAccept: '20', maxAccept: '10' });
        expect(validator(group)).toEqual({ minGreaterThanMax: true });
      });

      it('should return null when min equals max', () => {
        const group = buildGroup({ minAccept: '10', maxAccept: '10' });
        expect(validator(group)).toBeNull();
      });

      it('should return null when min < max', () => {
        const group = buildGroup({ minAccept: '5', maxAccept: '10' });
        expect(validator(group)).toBeNull();
      });
    });

    describe('negative target without min', () => {
      it('should return negativeTargetWithoutMin when target is negative and no min', () => {
        const group = buildGroup({ targetValue: '-5' });
        expect(validator(group)).toEqual({ negativeTargetWithoutMin: true });
      });

      it('should return null when target is negative but min is provided', () => {
        const group = buildGroup({ targetValue: '-5', minAccept: '-10' });
        expect(validator(group)).toBeNull();
      });

      it('should return null when target is positive and no min', () => {
        const group = buildGroup({ targetValue: '5' });
        expect(validator(group)).toBeNull();
      });

      it('should return null when target is zero and no min', () => {
        const group = buildGroup({ targetValue: '0' });
        expect(validator(group)).toBeNull();
      });
    });

    describe('null/empty/NaN values', () => {
      it('should return null when all values are null', () => {
        const group = buildGroup({});
        expect(validator(group)).toBeNull();
      });

      it('should return null when target is empty string', () => {
        const group = buildGroup({ targetValue: '' });
        expect(validator(group)).toBeNull();
      });

      it('should return null when target is NaN string', () => {
        const group = buildGroup({ targetValue: 'abc' });
        expect(validator(group)).toBeNull();
      });

      it('should return null when min is NaN string', () => {
        const group = buildGroup({ targetValue: '10', minAccept: 'abc' });
        expect(validator(group)).toBeNull();
      });

      it('should return null when max is NaN string', () => {
        const group = buildGroup({ targetValue: '10', maxAccept: 'abc' });
        expect(validator(group)).toBeNull();
      });

      it('should return null when min and max are both NaN', () => {
        const group = buildGroup({ minAccept: 'abc', maxAccept: 'xyz' });
        expect(validator(group)).toBeNull();
      });
    });

    describe('priority of validations', () => {
      it('should return targetLessThanMin before checking targetGreaterThanMax', () => {
        // target=5, min=10, max=20 => targetLessThanMin takes priority
        const group = buildGroup({ targetValue: '5', minAccept: '10', maxAccept: '20' });
        expect(validator(group)).toEqual({ targetLessThanMin: true });
      });

      it('should return targetGreaterThanMax before checking minGreaterThanMax', () => {
        // target=25, min=5, max=20 => targetGreaterThanMax takes priority
        const group = buildGroup({ targetValue: '25', minAccept: '5', maxAccept: '20' });
        expect(validator(group)).toEqual({ targetGreaterThanMax: true });
      });
    });
  });

  describe('numericFieldValidator', () => {
    let validator: ReturnType<typeof numericFieldValidator>;

    beforeEach(() => {
      validator = numericFieldValidator();
    });

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

    it('should return null for valid integer', () => {
      const control = new FormControl('42');
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid decimal', () => {
      const control = new FormControl('3.14');
      expect(validator(control)).toBeNull();
    });

    it('should return null for negative number', () => {
      const control = new FormControl('-5');
      expect(validator(control)).toBeNull();
    });

    it('should return null for zero', () => {
      const control = new FormControl('0');
      expect(validator(control)).toBeNull();
    });

    it('should return numeric error for non-numeric string', () => {
      const control = new FormControl('abc');
      expect(validator(control)).toEqual({ numeric: true });
    });

    it('should return numeric error for mixed alphanumeric', () => {
      const control = new FormControl('12abc');
      expect(validator(control)).toEqual({ numeric: true });
    });

    it('should return null for numeric type value', () => {
      const control = new FormControl(42);
      expect(validator(control)).toBeNull();
    });
  });

  describe('headerDateRangeValidator', () => {
    let validator: ReturnType<typeof headerDateRangeValidator>;

    beforeEach(() => {
      validator = headerDateRangeValidator();
    });

    it('should return null when effective date is before termination date', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl('2025-01-01'),
        terminationDate: new FormControl('2025-12-31'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when dates are equal', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl('2025-06-15'),
        terminationDate: new FormControl('2025-06-15'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return effDateAfterTermDate when effective date is after termination date', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl('2025-12-31'),
        terminationDate: new FormControl('2025-01-01'),
      });
      expect(validator(group)).toEqual({ effDateAfterTermDate: true });
    });

    it('should return null when effective date is null', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl('2025-12-31'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when termination date is null', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl('2025-01-01'),
        terminationDate: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when both dates are null', () => {
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });
  });

  describe('detailDateRangeValidator', () => {
    it('should return null when header dates are null', () => {
      const validator = detailDateRangeValidator(null, null);
      const group = new FormGroup({
        effectiveDate: new FormControl('2025-01-01'),
        terminationDate: new FormControl('2025-12-31'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return detailEffBeforeHeader when detail eff date is before header eff date', () => {
      const headerEff = moment('2025-03-01');
      const validator = detailDateRangeValidator(headerEff, null);
      const group = new FormGroup({
        effectiveDate: new FormControl('2025-01-01'),
        terminationDate: new FormControl(null),
      });
      expect(validator(group)).toEqual({ detailEffBeforeHeader: true });
    });

    it('should return null when detail eff date equals header eff date', () => {
      const headerEff = moment('2025-03-01');
      const validator = detailDateRangeValidator(headerEff, null);
      const group = new FormGroup({
        effectiveDate: new FormControl('2025-03-01'),
        terminationDate: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when detail eff date is after header eff date', () => {
      const headerEff = moment('2025-03-01');
      const validator = detailDateRangeValidator(headerEff, null);
      const group = new FormGroup({
        effectiveDate: new FormControl('2025-06-01'),
        terminationDate: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return detailTermAfterHeader when detail term date is after header term date', () => {
      const headerTerm = moment('2025-12-31');
      const validator = detailDateRangeValidator(null, headerTerm);
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl('2026-06-01'),
      });
      expect(validator(group)).toEqual({ detailTermAfterHeader: true });
    });

    it('should return null when detail term date equals header term date', () => {
      const headerTerm = moment('2025-12-31');
      const validator = detailDateRangeValidator(null, headerTerm);
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl('2025-12-31'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when detail term date is before header term date', () => {
      const headerTerm = moment('2025-12-31');
      const validator = detailDateRangeValidator(null, headerTerm);
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl('2025-06-01'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when detail effective date is null', () => {
      const headerEff = moment('2025-03-01');
      const validator = detailDateRangeValidator(headerEff, null);
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when detail termination date is null', () => {
      const headerTerm = moment('2025-12-31');
      const validator = detailDateRangeValidator(null, headerTerm);
      const group = new FormGroup({
        effectiveDate: new FormControl(null),
        terminationDate: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should handle moment values for detail dates', () => {
      const headerEff = moment('2025-03-01');
      const validator = detailDateRangeValidator(headerEff, null);
      const group = new FormGroup({
        effectiveDate: new FormControl(moment('2025-01-01')),
        terminationDate: new FormControl(null),
      });
      expect(validator(group)).toEqual({ detailEffBeforeHeader: true });
    });

    it('should prioritize detailEffBeforeHeader over detailTermAfterHeader', () => {
      const headerEff = moment('2025-03-01');
      const headerTerm = moment('2025-12-31');
      const validator = detailDateRangeValidator(headerEff, headerTerm);
      const group = new FormGroup({
        effectiveDate: new FormControl('2025-01-01'),
        terminationDate: new FormControl('2026-06-01'),
      });
      // detailEffBeforeHeader is checked first and returned
      expect(validator(group)).toEqual({ detailEffBeforeHeader: true });
    });
  });

  describe('termDateNotInPastValidator', () => {
    it('should return null when value is null', () => {
      const validator = termDateNotInPastValidator(moment());
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null when value is empty string', () => {
      const validator = termDateNotInPastValidator(moment());
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return termDateInPast when date is before chapter local date', () => {
      const chapterLocalDate = moment('2025-06-15');
      const validator = termDateNotInPastValidator(chapterLocalDate);
      const control = new FormControl('2025-01-01');
      expect(validator(control)).toEqual({ termDateInPast: true });
    });

    it('should return null when date equals chapter local date', () => {
      const chapterLocalDate = moment('2025-06-15');
      const validator = termDateNotInPastValidator(chapterLocalDate);
      const control = new FormControl('2025-06-15');
      expect(validator(control)).toBeNull();
    });

    it('should return null when date is after chapter local date', () => {
      const chapterLocalDate = moment('2025-06-15');
      const validator = termDateNotInPastValidator(chapterLocalDate);
      const control = new FormControl('2025-12-31');
      expect(validator(control)).toBeNull();
    });

    it('should handle moment values', () => {
      const chapterLocalDate = moment('2025-06-15');
      const validator = termDateNotInPastValidator(chapterLocalDate);
      const control = new FormControl(moment('2025-01-01'));
      expect(validator(control)).toEqual({ termDateInPast: true });
    });

    it('should return null for undefined/falsy value', () => {
      const validator = termDateNotInPastValidator(moment());
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });
  });
});
