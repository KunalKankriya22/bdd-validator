import { FormControl, FormGroup } from '@angular/forms';
import {
  dateTimeRangeValidator,
  atLeastOneSectionValidator,
  downtimeFlagValidator,
  dateTimeFormatValidator,
  parseDateTimeToISO,
  formatISOToDateTime,
} from './equipment-event.validators';
import moment from 'moment';

describe('Equipment Event Validators', () => {

  describe('dateTimeRangeValidator', () => {
    const DATETIME_FORMAT = 'MM-DD-YY HH:mm';

    it('should return null when both start and end are valid and end is after start', () => {
      const validator = dateTimeRangeValidator('startField', 'endField');
      const group = new FormGroup({
        startField: new FormControl('01-15-25 08:00'),
        endField: new FormControl('01-15-25 17:00'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return error when end is before start', () => {
      const validator = dateTimeRangeValidator('startField', 'endField');
      const group = new FormGroup({
        startField: new FormControl('01-15-25 17:00'),
        endField: new FormControl('01-15-25 08:00'),
      });
      expect(validator(group)).toEqual({ dateTimeRangeInvalid: true });
    });

    it('should return null when end equals start', () => {
      const validator = dateTimeRangeValidator('startField', 'endField');
      const group = new FormGroup({
        startField: new FormControl('01-15-25 08:00'),
        endField: new FormControl('01-15-25 08:00'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should use custom error key', () => {
      const validator = dateTimeRangeValidator('startField', 'endField', 'customError');
      const group = new FormGroup({
        startField: new FormControl('01-15-25 17:00'),
        endField: new FormControl('01-15-25 08:00'),
      });
      expect(validator(group)).toEqual({ customError: true });
    });

    it('should return null when start value is null', () => {
      const validator = dateTimeRangeValidator('startField', 'endField');
      const group = new FormGroup({
        startField: new FormControl(null),
        endField: new FormControl('01-15-25 17:00'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when end value is null', () => {
      const validator = dateTimeRangeValidator('startField', 'endField');
      const group = new FormGroup({
        startField: new FormControl('01-15-25 08:00'),
        endField: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when both values are null', () => {
      const validator = dateTimeRangeValidator('startField', 'endField');
      const group = new FormGroup({
        startField: new FormControl(null),
        endField: new FormControl(null),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when start value is empty string', () => {
      const validator = dateTimeRangeValidator('startField', 'endField');
      const group = new FormGroup({
        startField: new FormControl(''),
        endField: new FormControl('01-15-25 17:00'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when start date is invalid format', () => {
      const validator = dateTimeRangeValidator('startField', 'endField');
      const group = new FormGroup({
        startField: new FormControl('invalid-date'),
        endField: new FormControl('01-15-25 17:00'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when end date is invalid format', () => {
      const validator = dateTimeRangeValidator('startField', 'endField');
      const group = new FormGroup({
        startField: new FormControl('01-15-25 08:00'),
        endField: new FormControl('invalid-date'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should use default errorKey when not provided', () => {
      const validator = dateTimeRangeValidator('start', 'end');
      const group = new FormGroup({
        start: new FormControl('01-15-25 17:00'),
        end: new FormControl('01-15-25 08:00'),
      });
      expect(validator(group)).toEqual({ dateTimeRangeInvalid: true });
    });
  });

  describe('atLeastOneSectionValidator', () => {
    let validator: ReturnType<typeof atLeastOneSectionValidator>;

    beforeEach(() => {
      validator = atLeastOneSectionValidator();
    });

    function buildGroup(overrides: Record<string, any> = {}): FormGroup {
      return new FormGroup({
        downtimeType: new FormControl(overrides.downtimeType ?? null),
        downtimeStart: new FormControl(overrides.downtimeStart ?? null),
        downtimeEnd: new FormControl(overrides.downtimeEnd ?? null),
        serviceType: new FormControl(overrides.serviceType ?? null),
        servicePerson: new FormControl(overrides.servicePerson ?? null),
        serviceCompany: new FormControl(overrides.serviceCompany ?? null),
        serviceStart: new FormControl(overrides.serviceStart ?? null),
        serviceEnd: new FormControl(overrides.serviceEnd ?? null),
      });
    }

    it('should return error when no section has data', () => {
      const group = buildGroup();
      expect(validator(group)).toEqual({ atLeastOneSectionRequired: true });
    });

    it('should return null when downtime type is provided', () => {
      const group = buildGroup({ downtimeType: 'PLANNED' });
      expect(validator(group)).toBeNull();
    });

    it('should return null when downtime start is provided', () => {
      const group = buildGroup({ downtimeStart: '01-15-25 08:00' });
      expect(validator(group)).toBeNull();
    });

    it('should return null when downtime end is provided', () => {
      const group = buildGroup({ downtimeEnd: '01-15-25 17:00' });
      expect(validator(group)).toBeNull();
    });

    it('should return null when service type is provided', () => {
      const group = buildGroup({ serviceType: 'REPAIR' });
      expect(validator(group)).toBeNull();
    });

    it('should return null when service person is provided', () => {
      const group = buildGroup({ servicePerson: 'John Doe' });
      expect(validator(group)).toBeNull();
    });

    it('should return null when service company is provided', () => {
      const group = buildGroup({ serviceCompany: 'ACME Corp' });
      expect(validator(group)).toBeNull();
    });

    it('should return null when service start is provided', () => {
      const group = buildGroup({ serviceStart: '01-15-25 08:00' });
      expect(validator(group)).toBeNull();
    });

    it('should return null when service end is provided', () => {
      const group = buildGroup({ serviceEnd: '01-15-25 17:00' });
      expect(validator(group)).toBeNull();
    });

    it('should return null when both sections have data', () => {
      const group = buildGroup({ downtimeType: 'PLANNED', serviceType: 'REPAIR' });
      expect(validator(group)).toBeNull();
    });

    it('should treat empty strings as no data', () => {
      const group = buildGroup({ downtimeType: '', serviceType: '' });
      expect(validator(group)).toEqual({ atLeastOneSectionRequired: true });
    });
  });

  describe('downtimeFlagValidator', () => {
    let validator: ReturnType<typeof downtimeFlagValidator>;

    beforeEach(() => {
      validator = downtimeFlagValidator();
    });

    it('should return null for value Y', () => {
      const control = new FormControl('Y');
      expect(validator(control)).toBeNull();
    });

    it('should return null for value N', () => {
      const control = new FormControl('N');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for undefined', () => {
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });

    it('should return error for lowercase y', () => {
      const control = new FormControl('y');
      expect(validator(control)).toEqual({ invalidDowntimeFlag: true });
    });

    it('should return error for lowercase n', () => {
      const control = new FormControl('n');
      expect(validator(control)).toEqual({ invalidDowntimeFlag: true });
    });

    it('should return error for invalid string', () => {
      const control = new FormControl('X');
      expect(validator(control)).toEqual({ invalidDowntimeFlag: true });
    });

    it('should return error for boolean true', () => {
      const control = new FormControl(true);
      expect(validator(control)).toEqual({ invalidDowntimeFlag: true });
    });
  });

  describe('dateTimeFormatValidator', () => {
    let validator: ReturnType<typeof dateTimeFormatValidator>;

    beforeEach(() => {
      validator = dateTimeFormatValidator();
    });

    it('should return null for valid datetime format (MM-DD-YY HH:mm)', () => {
      const control = new FormControl('01-15-25 08:30');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      const control = new FormControl('   ');
      expect(validator(control)).toBeNull();
    });

    it('should return error for invalid date format', () => {
      const control = new FormControl('2025-01-15 08:30');
      expect(validator(control)).toEqual({ invalidDateTimeFormat: true });
    });

    it('should return error for date-only format', () => {
      const control = new FormControl('01-15-25');
      expect(validator(control)).toEqual({ invalidDateTimeFormat: true });
    });

    it('should return error for random string', () => {
      const control = new FormControl('not a date');
      expect(validator(control)).toEqual({ invalidDateTimeFormat: true });
    });

    it('should return null for undefined value', () => {
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });
  });

  describe('parseDateTimeToISO', () => {
    it('should parse valid datetime string to ISO format', () => {
      const result = parseDateTimeToISO('01-15-25 08:30');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return null for null input', () => {
      expect(parseDateTimeToISO(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseDateTimeToISO('')).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      expect(parseDateTimeToISO('   ')).toBeNull();
    });

    it('should return null for invalid datetime format', () => {
      expect(parseDateTimeToISO('2025-01-15')).toBeNull();
    });

    it('should return null for random string', () => {
      expect(parseDateTimeToISO('not a date')).toBeNull();
    });
  });

  describe('formatISOToDateTime', () => {
    it('should format valid ISO string to MM-DD-YY HH:mm format', () => {
      const isoString = moment('2025-01-15T08:30:00').toISOString();
      const result = formatISOToDateTime(isoString);
      expect(result).toBeTruthy();
      // Verify it matches expected format pattern
      expect(result).toMatch(/^\d{2}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('should return null for null input', () => {
      expect(formatISOToDateTime(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(formatISOToDateTime(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(formatISOToDateTime('')).toBeNull();
    });

    it('should return null for invalid ISO string', () => {
      expect(formatISOToDateTime('not-an-iso-string')).toBeNull();
    });

    it('should handle ISO string with timezone', () => {
      const result = formatISOToDateTime('2025-01-15T08:30:00.000Z');
      expect(result).toBeTruthy();
      expect(result).toMatch(/^\d{2}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });
  });
});
