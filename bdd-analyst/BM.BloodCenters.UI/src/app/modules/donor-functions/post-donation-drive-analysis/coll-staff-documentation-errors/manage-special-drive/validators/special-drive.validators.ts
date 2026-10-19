import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';
import moment from 'moment';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';

/**
 * BR-007: Drive date cannot be earlier than (sysdate - SPDR_LIMIT parameter)
 * Default: 30 days old
 */
export function driveDateNotTooOldValidator(maxDaysOld: number = 30): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const driveDate = new Date(control.value);
    driveDate.setHours(0, 0, 0, 0);

    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() - maxDaysOld);

    if (driveDate < minDate) {
      return {
        driveDateTooOld: {
          errorCode: '11019',
          maxDaysOld,
          message: `Drive date cannot be more than ${maxDaysOld} days in the past`
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
 */
export function endTimeAfterStartTimeValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) return null;

    const startTimeControl = group.get('startTime');
    const endTimeControl = group.get('endTime');

    const startTime = startTimeControl?.value;
    const endTime = endTimeControl?.value;

    if (!startTime || !endTime) return null;

    if (startTimeControl?.hasError('invalidTimeFormat') || endTimeControl?.hasError('invalidTimeFormat')) {
      return null;
    }

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
 * BR-023: Start time must be after chapter time when drive date equals chapter date
 */
export function startTimeAfterChapterTimeValidator(
  chapterTimezoneService: ChapterTimezoneService,
  headerService: HeaderService
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) return null;

    const driveDateControl = group.get('driveDate');
    const startTimeControl = group.get('startTime');

    const driveDate = driveDateControl?.value;
    const startTime = startTimeControl?.value;

    if (!driveDate || !startTime) return null;

    if (startTimeControl?.hasError('invalidTimeFormat')) {
      return null;
    }

    const chapterLocalDate = chapterTimezoneService.chapterLocalDate();
    const chapterDate = chapterLocalDate ?? moment();

    const driveDateMoment = moment.isMoment(driveDate) ? driveDate : moment(driveDate);

    if (!driveDateMoment.isSame(chapterDate, 'day')) {
      return null;
    }

    const now = new Date();
    const chapterTimeZone = headerService.chapterTimeZone();

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: chapterTimeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const currentMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

    const startTimeMinutes = timeToMinutes(startTime);
    const chapterTimeMinutes = currentHour * 60 + currentMinute;

    if (startTimeMinutes <= chapterTimeMinutes) {
      return {
        startTimeBeforeChapterTime: {
          errorCode: '11275',
          message: 'Start time must be after chapter time'
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
