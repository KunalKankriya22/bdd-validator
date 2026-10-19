import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';
import moment from 'moment';

const DATETIME_FORMAT = 'MM-DD-YY HH:mm';

export function dateTimeRangeValidator(
  startField: string,
  endField: string,
  errorKey: string = 'dateTimeRangeInvalid'
): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const group = formGroup as FormGroup;
    const startValue = group.get(startField)?.value;
    const endValue = group.get(endField)?.value;

    if (!startValue || !endValue) {
      return null;
    }

    const startDt = moment(startValue, DATETIME_FORMAT, true);
    const endDt = moment(endValue, DATETIME_FORMAT, true);

    if (!startDt.isValid() || !endDt.isValid()) {
      return null;
    }

    if (endDt.isBefore(startDt)) {
      return { [errorKey]: true };
    }

    return null;
  };
}

export function atLeastOneSectionValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const group = formGroup as FormGroup;

    const hasDowntimeData =
      group.get('downtimeType')?.value ||
      group.get('downtimeStart')?.value ||
      group.get('downtimeEnd')?.value;

    const hasServiceData =
      group.get('serviceType')?.value ||
      group.get('servicePerson')?.value ||
      group.get('serviceCompany')?.value ||
      group.get('serviceStart')?.value ||
      group.get('serviceEnd')?.value;

    if (!hasDowntimeData && !hasServiceData) {
      return { atLeastOneSectionRequired: true };
    }

    return null;
  };
}

export function downtimeFlagValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || value === '') {
      return null;
    }

    if (value !== 'Y' && value !== 'N') {
      return { invalidDowntimeFlag: true };
    }

    return null;
  };
}

export function dateTimeFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || value.trim() === '') {
      return null;
    }

    const parsed = moment(value, DATETIME_FORMAT, true);
    if (!parsed.isValid()) {
      return { invalidDateTimeFormat: true };
    }

    return null;
  };
}

export function parseDateTimeToISO(value: string | null): string | null {
  if (!value || value.trim() === '') {
    return null;
  }
  const parsed = moment(value, DATETIME_FORMAT, true);
  return parsed.isValid() ? parsed.toISOString() : null;
}

export function formatISOToDateTime(isoString: string | null | undefined): string | null {
  if (!isoString) {
    return null;
  }
  const parsed = moment(isoString);
  return parsed.isValid() ? parsed.format(DATETIME_FORMAT) : null;
}
