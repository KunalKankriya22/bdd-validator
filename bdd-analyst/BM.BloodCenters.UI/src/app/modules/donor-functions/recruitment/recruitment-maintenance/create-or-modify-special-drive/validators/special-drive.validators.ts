import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';
import moment, { Moment } from 'moment';

/**
 * BR-007: Drive date cannot be earlier than (chapterLocalDate - SPDR_LIMIT)
 */
export function driveDateNotTooOldValidator(
  maxDaysOld: number | (() => number) = 30,
  chapterLocalDateGetter?: () => Moment | null
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const days = typeof maxDaysOld === 'function' ? maxDaysOld() : maxDaysOld;

    const driveDate = moment(control.value).startOf('day');
    if (!driveDate.isValid()) return null;

    const today = chapterLocalDateGetter?.() ?? moment();
    const minDate = today.clone().startOf('day').subtract(days, 'days');

    if (driveDate.isBefore(minDate)) {
      return {
        driveDateTooOld: {
          errorCode: '11019',
          maxDaysOld: days,
          message: `Drive date cannot be more than ${days} days in the past`
        }
      };
    }
    return null;
  };
}

/**
 * BR-021: Time format validation - 24-hour format HH:MM
 */
export function timeFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const value = control.value.toString().trim();
    const time24HrRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!time24HrRegex.test(value)) {
      return {
        invalidTimeFormat: {
          errorCode: '11110',
          message: 'Invalid time format. Use HH:MM format.'
        }
      };
    }

    return null;
  };
}

/**
 * BR-022: End time must be after start time
 * Cross-field validator for form group
 */
export function endTimeAfterStartTimeValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) return null;

    const startTimeControl = group.get('scheduleStartTime');
    const endTimeControl = group.get('scheduleEndTime');

    const startTime = startTimeControl?.value;
    const endTime = endTimeControl?.value;

    if (!startTime || !endTime) return null;

    // Only validate if both times have valid format
    if (startTimeControl?.hasError('invalidTimeFormat') || endTimeControl?.hasError('invalidTimeFormat')) {
      return null;
    }

    // Convert HH:MM to minutes for comparison
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      return {
        endTimeBeforeStart: {
          errorCode: '11273',
          message: 'End time must be after start time'
        }
      };
    }
    return null;
  };
}

/**
 * BR-013: Projected show must be greater than zero
 */
export function projectedShowPositiveValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined) return null;

    const value = Number(control.value);
    if (value <= 0) {
      return {
        projectedShowNotPositive: {
          errorCode: '11274',
          message: 'Projected show must be > 0.'
        }
      };
    }
    return null;
  };
}

/**
 * BR-017: Resource number required must be non-negative
 */
export function resourceNumberNonNegativeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined) return null;

    const value = Number(control.value);
    if (value < 0) {
      return {
        resourceNumberNegative: {
          errorCode: '11131',
          message: 'Number required cannot be negative'
        }
      };
    }
    return null;
  };
}

export function timeToMinutes(time: string): number {
  if (!time) return 0;

  const match = time.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return 0;

  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

/**
 * Validator for deferral rate (must be between 0 and 99)
 */
export function deferralRateRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined) return null;

    const value = Number(control.value);
    if (value < 0 || value > 99) {
      return {
        deferralRateOutOfRange: {
          errorCode: '11274',
          message: value < 0
            ? 'Deferral rate cannot be negative.'
            : 'Deferral % must be between 0 and 99'
        }
      };
    }
    return null;
  };
}
