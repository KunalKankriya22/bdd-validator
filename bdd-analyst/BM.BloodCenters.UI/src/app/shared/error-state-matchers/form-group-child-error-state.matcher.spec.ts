import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupChildErrorStateMatcher } from './form-group-child-error-state.matcher';

describe('FormGroupChildErrorStateMatcher', () => {
  let formGroup: FormGroup;
  let control: FormControl;
  let matcher: FormGroupChildErrorStateMatcher;

  beforeEach(() => {
    control = new FormControl('', Validators.required);
    formGroup = new FormGroup({
      testField: control,
    });
    matcher = new FormGroupChildErrorStateMatcher(
      () => formGroup,
      'crossFieldError'
    );
  });

  it('should return false for null control', () => {
    expect(matcher.isErrorState(null, null)).toBe(false);
  });

  it('should return false when control is valid and untouched', () => {
    control.setValue('valid');
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('should return false when control is invalid but untouched/pristine', () => {
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('should return true when control is invalid and touched', () => {
    control.markAsTouched();
    expect(matcher.isErrorState(control, null)).toBe(true);
  });

  it('should return true when control is invalid and dirty', () => {
    control.markAsDirty();
    expect(matcher.isErrorState(control, null)).toBe(true);
  });

  it('should return true when form group has the specified error and control is touched', () => {
    control.setValue('valid');
    formGroup.setErrors({ crossFieldError: true });
    control.markAsTouched();
    expect(matcher.isErrorState(control, null)).toBe(true);
  });

  it('should return false when form group has a different error key', () => {
    control.setValue('valid');
    formGroup.setErrors({ otherError: true });
    control.markAsTouched();
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('should return false when form group has the error but control is untouched', () => {
    control.setValue('valid');
    formGroup.setErrors({ crossFieldError: true });
    expect(matcher.isErrorState(control, null)).toBe(false);
  });
});
