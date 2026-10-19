import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { map, catchError, debounceTime, switchMap, first, shareReplay } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { TestTypesApiService } from '../services/test-types-api.service';

/**
 * Validator to ensure Y/N field contains only 'Y' or 'N'
 * Error Code: 1017
 */
export function yesNoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    if (value !== 'Y' && value !== 'N') {
      return {
        invalidYesNo: {
          errorCode: '1017',
          message: 'Value must be Y or N'
        }
      };
    }
    return null;
  };
}

/**
 * Validator to ensure effective date is not in the past (for CREATE only)
 * Error Code: 5003
 */
export function effectiveDateNotInPastValidator(chapterToday?: Moment): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const effDate = moment(value).startOf('day');
    const today = chapterToday ? chapterToday.clone().startOf('day') : moment().startOf('day');

    if (effDate.isBefore(today)) {
      return {
        dateInPast: {
          errorCode: '5003',
          message: 'Effective date cannot be in the past'
        }
      };
    }
    return null;
  };
}

/**
 * Validator to ensure termination date is not in the past
 * Error Code: 3115
 */
export function terminationDateNotInPastValidator(chapterToday?: Moment): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const termDate = moment(value).startOf('day');
    const today = chapterToday ? chapterToday.clone().startOf('day') : moment().startOf('day');

    if (termDate.isBefore(today)) {
      return {
        terminationDateInPast: {
          errorCode: '3115',
          message: 'Termination date has passed'
        }
      };
    }
    return null;
  };
}

/**
 * Form group validator to ensure termination date >= effective date
 * Error Code: 5004
 */
export function terminationAfterEffectiveValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const effDate = formGroup.get('effDate')?.value;
    const termDate = formGroup.get('termDate')?.value;
    if (!effDate || !termDate) return null;

    const effectiveDate = moment(effDate);
    const terminationDate = moment(termDate);

    if (terminationDate.isBefore(effectiveDate)) {
      return {
        terminationBeforeEffective: {
          errorCode: '5004',
          message: 'Termination Date must be greater than or equal to Effective Date'
        }
      };
    }
    return null;
  };
}

/**
 * Validator to ensure test type description is not empty
 * Error Code: 0080
 */
export function testTypeDescriptionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || value.trim().length === 0) {
      return {
        descriptionRequired: {
          errorCode: '0080',
          message: 'Test Type Description must be entered'
        }
      };
    }
    return null;
  };
}

/**
 * Validator to ensure effective date is entered
 * Error Code: 5002
 */
export function effectiveDateRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return {
        effectiveDateRequired: {
          errorCode: '5002',
          message: 'Effective Date must be entered'
        }
      };
    }
    return null;
  };
}

/**
 * Async validator to check for duplicate test type code per test ID.
 * Uses a shared Subject so debounceTime works across repeated invocations.
 * Error Code: 0319
 */
export function duplicateTestTypeValidator(
  apiService: TestTypesApiService,
  testId: string
): AsyncValidatorFn {
  const input$ = new Subject<string>();
  const result$ = input$.pipe(
    debounceTime(400),
    switchMap(val =>
      apiService.getTestTypeById(testId, val.toUpperCase()).pipe(
        map(existing => existing
          ? { duplicateTestType: { errorCode: '0319', message: 'Test type already exists for this test' } }
          : null
        ),
        catchError(() => of(null))
      )
    ),
    shareReplay(1)
  );

  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;
    if (!value || !testId) return of(null);

    input$.next(value);
    return result$.pipe(first());
  };
}
