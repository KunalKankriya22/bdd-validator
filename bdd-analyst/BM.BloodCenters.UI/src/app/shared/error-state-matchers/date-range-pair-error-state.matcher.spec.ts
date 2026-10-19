import { FormControl, FormGroup, Validators } from '@angular/forms';

import { DateRangePairErrorStateMatcher } from './date-range-pair-error-state.matcher';

describe('DateRangePairErrorStateMatcher', () => {
  function createMockFormGroup(hasDateRangeInvalid: boolean): FormGroup {
    const formGroup = { hasError: jest.fn((key: string) => key === 'dateRangeInvalid' && hasDateRangeInvalid) } as unknown as FormGroup;
    return formGroup;
  }

  function createMatcherWithFormErrors(
    hasDateRangeInvalid: boolean
  ): { matcher: DateRangePairErrorStateMatcher; formGroup: FormGroup } {
    const formGroup = createMockFormGroup(hasDateRangeInvalid);
    const matcher = new DateRangePairErrorStateMatcher(() => formGroup);
    return { matcher, formGroup };
  }

  it('should return false when control is null', () => {
    const { matcher } = createMatcherWithFormErrors(false);
    expect(matcher.isErrorState(null, null)).toBeFalse();
  });

  it('should return false when control valid and not touched', () => {
    const { matcher } = createMatcherWithFormErrors(false);
    const c = new FormControl('x');
    expect(matcher.isErrorState(c, null)).toBeFalse();
  });

  it('should return true when control invalid and touched', () => {
    const { matcher } = createMatcherWithFormErrors(false);
    const c = new FormControl('', Validators.required);
    c.markAsTouched();
    c.updateValueAndValidity();
    expect(matcher.isErrorState(c, null)).toBeTrue();
  });

  it('should return true when form has dateRangeInvalid and control touched', () => {
    const { matcher, formGroup } = createMatcherWithFormErrors(true);
    const c = new FormControl(new Date());
    c.markAsTouched();
    expect(matcher.isErrorState(c, null)).toBeTrue();
    expect(formGroup.hasError).toHaveBeenCalledWith('dateRangeInvalid');
  });

  it('should return true when dirty and range error', () => {
    const { matcher } = createMatcherWithFormErrors(true);
    const c = new FormControl(new Date());
    c.markAsDirty();
    expect(matcher.isErrorState(c, null)).toBeTrue();
  });

  describe('isRangeErrorOwner callback', () => {
    it('should show range error when isRangeErrorOwner returns true', () => {
      const formGroup = createMockFormGroup(true);
      const matcher = new DateRangePairErrorStateMatcher(() => formGroup, () => true);
      const c = new FormControl(new Date());
      c.markAsTouched();
      expect(matcher.isErrorState(c, null)).toBeTrue();
    });

    it('should hide range error when isRangeErrorOwner returns false', () => {
      const formGroup = createMockFormGroup(true);
      const matcher = new DateRangePairErrorStateMatcher(() => formGroup, () => false);
      const c = new FormControl(new Date());
      c.markAsTouched();
      expect(matcher.isErrorState(c, null)).toBeFalse();
    });

    it('should show range error when no isRangeErrorOwner provided (backward compatible)', () => {
      const formGroup = createMockFormGroup(true);
      const matcher = new DateRangePairErrorStateMatcher(() => formGroup);
      const c = new FormControl(new Date());
      c.markAsTouched();
      expect(matcher.isErrorState(c, null)).toBeTrue();
    });
  });
});
