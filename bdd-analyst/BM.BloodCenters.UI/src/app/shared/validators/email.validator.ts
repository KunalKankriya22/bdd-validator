import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function emailFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    const emailRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*(\.[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*)*\.[a-zA-Z0-9]{2,}$/;
    const valid = emailRegex.test(value);
    
    return valid ? null : { emailFormat: true };
  };
}