import { FormControl } from '@angular/forms';
import { SubmitErrorStateMatcher } from './submit-error-state.matcher';

describe('SubmitErrorStateMatcher', () => {
  let submitted = false;
  let matcher: SubmitErrorStateMatcher;

  beforeEach(() => {
    submitted = false;
    matcher = new SubmitErrorStateMatcher(() => submitted);
  });

  it('should return false when control is null', () => {
    expect(matcher.isErrorState(null, null)).toBe(false);
  });

  it('should return false when control is valid', () => {
    const control = new FormControl('valid value');
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('should return false when control is invalid but untouched and not submitted', () => {
    const control = new FormControl('');
    control.setErrors({ required: true });

    expect(control.invalid).toBe(true);
    expect(control.touched).toBe(false);
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('should return true when control is invalid and touched', () => {
    const control = new FormControl('');
    control.setErrors({ required: true });
    control.markAsTouched();

    expect(matcher.isErrorState(control, null)).toBe(true);
  });

  it('should return true when control is invalid and form is submitted', () => {
    const control = new FormControl('');
    control.setErrors({ required: true });

    submitted = true;

    expect(matcher.isErrorState(control, null)).toBe(true);
  });

  it('should return false when control is valid even if form is submitted', () => {
    const control = new FormControl('valid');
    submitted = true;

    expect(matcher.isErrorState(control, null)).toBe(false);
  });
});
