import { AbstractControl, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import moment from 'moment';

export class CrossFieldErrorMatcher implements ErrorStateMatcher {
  constructor(private groupErrorKeys: string[]) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const controlInvalid = !!(control?.invalid && (control?.dirty || control?.touched));
    const groupHasError = this.groupErrorKeys.some(key => control?.parent?.hasError(key));
    const groupTouched = !!(control?.touched);
    return controlInvalid || (groupHasError && groupTouched);
  }
}

export function minTargetMaxValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const units = group.get('units')?.value;
    if (units === 'FREE' || units === 'CHAR') return null;

    const targetValue = group.get('targetValue')?.value;
    const minAccept = group.get('minAccept')?.value;
    const maxAccept = group.get('maxAccept')?.value;

    const targetNum = parseFloat(targetValue);
    const minNum = parseFloat(minAccept);
    const maxNum = parseFloat(maxAccept);

    if (targetValue && !isNaN(targetNum)) {
      if (minAccept && !isNaN(minNum) && targetNum < minNum) {
        return { targetLessThanMin: true };
      }
      if (maxAccept && !isNaN(maxNum) && targetNum > maxNum) {
        return { targetGreaterThanMax: true };
      }
    }

    if (minAccept && maxAccept && !isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
      return { minGreaterThanMax: true };
    }

    if (targetValue && !isNaN(targetNum) && targetNum < 0 && !minAccept) {
      return { negativeTargetWithoutMin: true };
    }

    return null;
  };
}

export function numericFieldValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    if (isNaN(Number(value))) {
      return { numeric: true };
    }
    return null;
  };
}

export function headerDateRangeValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const effDate = group.get('effectiveDate')?.value;
    const termDate = group.get('terminationDate')?.value;
    if (!effDate || !termDate) return null;
    const eff = new Date(effDate);
    const term = new Date(termDate);
    if (eff > term) {
      return { effDateAfterTermDate: true };
    }
    return null;
  };
}

export function detailDateRangeValidator(
  getHeaderEffDate: () => moment.Moment | null,
  getHeaderTermDate: () => moment.Moment | null
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const effDate = group.get('effectiveDate')?.value;
    const termDate = group.get('terminationDate')?.value;
    const headerEffDate = getHeaderEffDate();
    const headerTermDate = getHeaderTermDate();

    if (headerEffDate && effDate) {
      const eff = moment.isMoment(effDate) ? effDate : moment(effDate);
      if (eff.isValid() && eff.isBefore(headerEffDate, 'day')) {
        return { detailEffBeforeHeader: true };
      }
    }

    if (headerTermDate && termDate) {
      const term = moment.isMoment(termDate) ? termDate : moment(termDate);
      if (term.isValid() && term.isAfter(headerTermDate, 'day')) {
        return { detailTermAfterHeader: true };
      }
    }

    return null;
  };
}

export function termDateNotInPastValidator(chapterLocalDate: moment.Moment): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const date = moment.isMoment(value) ? value : moment(value);
    if (date.isValid() && date.isBefore(chapterLocalDate, 'day')) {
      return { termDateInPast: true };
    }
    return null;
  };
}

