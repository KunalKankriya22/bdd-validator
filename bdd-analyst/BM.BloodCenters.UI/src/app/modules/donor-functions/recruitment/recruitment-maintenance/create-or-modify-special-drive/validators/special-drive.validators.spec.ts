import { FormControl, FormGroup } from '@angular/forms';
import moment, { Moment } from 'moment';
import {
  driveDateNotTooOldValidator,
  timeFormatValidator,
  endTimeAfterStartTimeValidator,
  projectedShowPositiveValidator,
  deferralRateRangeValidator,
  resourceNumberNonNegativeValidator,
  timeToMinutes
} from './special-drive.validators';

describe('SpecialDriveValidators', () => {

  describe('timeToMinutes', () => {
    it('should convert 00:00 (midnight) to 0 minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0);
    });

    it('should convert 00:30 to 30 minutes', () => {
      expect(timeToMinutes('00:30')).toBe(30);
    });

    it('should convert 01:00 to 60 minutes', () => {
      expect(timeToMinutes('01:00')).toBe(60);
    });

    it('should convert 12:00 (noon) to 720 minutes', () => {
      expect(timeToMinutes('12:00')).toBe(720);
    });

    it('should convert 13:00 to 780 minutes', () => {
      expect(timeToMinutes('13:00')).toBe(780);
    });

    it('should convert 23:59 to 1439 minutes', () => {
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('should return 0 for invalid format', () => {
      expect(timeToMinutes('invalid')).toBe(0);
    });

  });

  describe('driveDateNotTooOldValidator', () => {

    it('should return error for date older than 30 days', () => {
      const control = new FormControl(moment().subtract(35, 'days').toDate());
      const validator = driveDateNotTooOldValidator(30);
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['driveDateTooOld']).toBeDefined();
    });

  });

  describe('timeFormatValidator', () => {
    it('should accept valid 24-hour format (morning)', () => {
      const control = new FormControl('11:00');
      const validator = timeFormatValidator();
      expect(validator(control)).toBeNull();
    });

    it('should accept valid 24-hour format (afternoon)', () => {
      const control = new FormControl('18:00');
      const validator = timeFormatValidator();
      expect(validator(control)).toBeNull();
    });

    it('should accept 00:00 (midnight)', () => {
      const control = new FormControl('00:00');
      const validator = timeFormatValidator();
      expect(validator(control)).toBeNull();
    });

    it('should accept 23:59 (last minute of day)', () => {
      const control = new FormControl('23:59');
      const validator = timeFormatValidator();
      expect(validator(control)).toBeNull();
    });

    it('should reject invalid hour (24:00)', () => {
      const control = new FormControl('24:00');
      const validator = timeFormatValidator();
      expect(validator(control)?.['invalidTimeFormat']).toBeDefined();
    });

    it('should reject 12-hour AM/PM format', () => {
      const control = new FormControl('11:00 AM');
      const validator = timeFormatValidator();
      expect(validator(control)?.['invalidTimeFormat']).toBeDefined();
    });

    it('should reject 12-hour PM format', () => {
      const control = new FormControl('06:00 PM');
      const validator = timeFormatValidator();
      expect(validator(control)?.['invalidTimeFormat']).toBeDefined();
    });

  });

  describe('endTimeAfterStartTimeValidator', () => {
    it('should return null when end time is after start time', () => {
      const group = new FormGroup({
        scheduleStartTime: new FormControl('09:00'),
        scheduleEndTime: new FormControl('17:00')
      });
      const validator = endTimeAfterStartTimeValidator();
      expect(validator(group)).toBeNull();
    });

    it('should return error when end time equals start time', () => {
      const group = new FormGroup({
        scheduleStartTime: new FormControl('09:00'),
        scheduleEndTime: new FormControl('09:00')
      });
      const validator = endTimeAfterStartTimeValidator();
      expect(validator(group)?.['endTimeBeforeStart']).toBeDefined();
    });

    it('should return error when end time is before start time', () => {
      const group = new FormGroup({
        scheduleStartTime: new FormControl('17:00'),
        scheduleEndTime: new FormControl('09:00')
      });
      const validator = endTimeAfterStartTimeValidator();
      expect(validator(group)?.['endTimeBeforeStart']).toBeDefined();
    });

    it('should return null when times are missing', () => {
      const group = new FormGroup({
        scheduleStartTime: new FormControl(null),
        scheduleEndTime: new FormControl(null)
      });
      const validator = endTimeAfterStartTimeValidator();
      expect(validator(group)).toBeNull();
    });

    it('should return null when time format is invalid', () => {
      const group = new FormGroup({
        scheduleStartTime: new FormControl('invalid'),
        scheduleEndTime: new FormControl('invalid')
      });
      group.get('scheduleStartTime')?.setErrors({ invalidTimeFormat: true });
      const validator = endTimeAfterStartTimeValidator();
      expect(validator(group)).toBeNull();
    });
  });

  describe('projectedShowPositiveValidator', () => {
    it('should return null for positive value', () => {
      const control = new FormControl(10);
      const validator = projectedShowPositiveValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return error for zero', () => {
      const control = new FormControl(0);
      const validator = projectedShowPositiveValidator();
      expect(validator(control)?.['projectedShowNotPositive']).toBeDefined();
    });

    it('should return error for negative value', () => {
      const control = new FormControl(-5);
      const validator = projectedShowPositiveValidator();
      expect(validator(control)?.['projectedShowNotPositive']).toBeDefined();
    });

  });

  describe('deferralRateRangeValidator', () => {
    it('should return null for value within range (0-99)', () => {
      const control = new FormControl(50);
      const validator = deferralRateRangeValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for 0', () => {
      const control = new FormControl(0);
      const validator = deferralRateRangeValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for 99', () => {
      const control = new FormControl(99);
      const validator = deferralRateRangeValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return error for negative value', () => {
      const control = new FormControl(-1);
      const validator = deferralRateRangeValidator();
      const result = validator(control);
      expect(result?.['deferralRateOutOfRange']).toBeDefined();
      expect(result?.['deferralRateOutOfRange']?.message).toContain('cannot be negative');
    });

    it('should return error for value > 99', () => {
      const control = new FormControl(100);
      const validator = deferralRateRangeValidator();
      const result = validator(control);
      expect(result?.['deferralRateOutOfRange']).toBeDefined();
      expect(result?.['deferralRateOutOfRange']?.message).toContain('must be between 0 and 99');
    });

  });

  describe('resourceNumberNonNegativeValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);
      const validator = resourceNumberNonNegativeValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for undefined value', () => {
      const control = new FormControl(undefined);
      const validator = resourceNumberNonNegativeValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for positive value', () => {
      const control = new FormControl(5);
      const validator = resourceNumberNonNegativeValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for zero', () => {
      const control = new FormControl(0);
      const validator = resourceNumberNonNegativeValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return error for negative value', () => {
      const control = new FormControl(-3);
      const validator = resourceNumberNonNegativeValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['resourceNumberNegative']).toBeDefined();
      expect(result?.['resourceNumberNegative']?.errorCode).toBe('11131');
    });
  });

  describe('driveDateNotTooOldValidator (additional)', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);
      const validator = driveDateNotTooOldValidator(30);
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid date within range', () => {
      const control = new FormControl(moment().subtract(5, 'days').toDate());
      const validator = driveDateNotTooOldValidator(30);
      expect(validator(control)).toBeNull();
    });

    it('should return null for future date', () => {
      const control = new FormControl(moment().add(10, 'days').toDate());
      const validator = driveDateNotTooOldValidator(30);
      expect(validator(control)).toBeNull();
    });

    it('should return null for date exactly at boundary', () => {
      const control = new FormControl(moment().subtract(30, 'days').startOf('day').toDate());
      const validator = driveDateNotTooOldValidator(30);
      expect(validator(control)).toBeNull();
    });

    it('should support function-based maxDaysOld', () => {
      const control = new FormControl(moment().subtract(15, 'days').toDate());
      const validator = driveDateNotTooOldValidator(() => 10);
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['driveDateTooOld']).toBeDefined();
    });

    it('should use chapterLocalDateGetter when provided', () => {
      const chapterDate = moment().subtract(5, 'days');
      const driveDate = moment().subtract(40, 'days').toDate();
      const validator = driveDateNotTooOldValidator(30, () => chapterDate);
      const control = new FormControl(driveDate);
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['driveDateTooOld']).toBeDefined();
    });

    it('should return null for invalid date', () => {
      const control = new FormControl('not-a-date');
      const validator = driveDateNotTooOldValidator(30);
      expect(validator(control)).toBeNull();
    });
  });

  describe('projectedShowPositiveValidator (additional)', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);
      const validator = projectedShowPositiveValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for undefined value', () => {
      const control = new FormControl(undefined);
      const validator = projectedShowPositiveValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('deferralRateRangeValidator (additional)', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);
      const validator = deferralRateRangeValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for undefined value', () => {
      const control = new FormControl(undefined);
      const validator = deferralRateRangeValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('timeToMinutes (additional)', () => {
    it('should return 0 for null input', () => {
      expect(timeToMinutes(null as any)).toBe(0);
    });

    it('should return 0 for undefined input', () => {
      expect(timeToMinutes(undefined as any)).toBe(0);
    });

    it('should return 0 for empty string', () => {
      expect(timeToMinutes('')).toBe(0);
    });
  });

  describe('timeFormatValidator (additional)', () => {
    it('should return null for empty value', () => {
      const control = new FormControl('');
      const validator = timeFormatValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      const validator = timeFormatValidator();
      expect(validator(control)).toBeNull();
    });

    it('should reject invalid minute (25:00)', () => {
      const control = new FormControl('25:00');
      const validator = timeFormatValidator();
      expect(validator(control)?.['invalidTimeFormat']).toBeDefined();
    });

    it('should reject partial time (1:00)', () => {
      const control = new FormControl('1:00');
      const validator = timeFormatValidator();
      expect(validator(control)?.['invalidTimeFormat']).toBeDefined();
    });
  });
});
