import { TestBed } from '@angular/core/testing';
import { DateValidationService, DateValidationResult, ChapterTimezoneConfig } from './date-validation.service';
import { ApiService } from '@shared/services/api.service';
import { ErrorCodeService } from './error-code.service';
import moment from 'moment';

describe('DateValidationService', () => {
  let service: DateValidationService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let errorCodeServiceSpy: jasmine.SpyObj<ErrorCodeService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);
    errorCodeServiceSpy = jasmine.createSpyObj('ErrorCodeService', ['getErrorMessage']);

    // Default error message stub
    errorCodeServiceSpy.getErrorMessage.and.callFake((code: string) => {
      const messages: { [key: string]: string } = {
        '0060': 'Collection date cannot be in the future',
        '1145': 'Collection date is too old and exceeds the allowed limit',
        '16157': 'Collection date does not match the registered unit date',
        'INVALID_DATE_FORMAT': 'Invalid date format. Please use MM-DD-YYYY'
      };
      return messages[code] || 'An error occurred. Please try again.';
    });

    TestBed.configureTestingModule({
      providers: [
        DateValidationService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ErrorCodeService, useValue: errorCodeServiceSpy }
      ]
    });

    service = TestBed.inject(DateValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // getChapterTimezone (mock mode)
  // ---------------------------------------------------------------------------
  describe('getChapterTimezone', () => {
    it('should return mock timezone config with America/Chicago', (done) => {
      service.getChapterTimezone('1').subscribe({
        next: (config: ChapterTimezoneConfig) => {
          expect(config.chapterId).toBe('1');
          expect(config.timezone).toBe('America/Chicago');
          expect(config.pastDateLimitDays).toBe(365);
          done();
        }
      });
    });

    it('should echo back the provided chapterId', (done) => {
      service.getChapterTimezone('42').subscribe({
        next: (config: ChapterTimezoneConfig) => {
          expect(config.chapterId).toBe('42');
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // convertToChapterLocalTime
  // ---------------------------------------------------------------------------
  describe('convertToChapterLocalTime', () => {
    it('should return a Date object from a Date input', () => {
      const input = new Date(2026, 0, 15);
      const result = service.convertToChapterLocalTime(input, 'America/Chicago');

      expect(result instanceof Date).toBe(true);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it('should return a Date object from a string input', () => {
      const result = service.convertToChapterLocalTime('2026-03-10', 'America/Chicago');

      expect(result instanceof Date).toBe(true);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(2);
      expect(result.getDate()).toBe(10);
    });
  });

  // ---------------------------------------------------------------------------
  // getCurrentChapterDate
  // ---------------------------------------------------------------------------
  describe('getCurrentChapterDate', () => {
    it('should return a Date representing today', (done) => {
      service.getCurrentChapterDate('1').subscribe({
        next: (date: Date) => {
          const today = moment().startOf('day');
          const returned = moment(date).startOf('day');
          expect(returned.isSame(today)).toBe(true);
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // validateFutureDate
  // ---------------------------------------------------------------------------
  describe('validateFutureDate', () => {
    it('should return invalid with error 0060 when date is in the future', (done) => {
      const futureDate = moment().add(5, 'days').toDate();

      service.validateFutureDate(futureDate, '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe('0060');
          expect(result.errorMessage).toBe('Collection date cannot be in the future');
          expect(errorCodeServiceSpy.getErrorMessage).toHaveBeenCalledWith('0060');
          done();
        }
      });
    });

    it('should return valid when date is today', (done) => {
      const today = moment().startOf('day').toDate();

      service.validateFutureDate(today, '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.convertedDate).toBe(moment().startOf('day').format('YYYY-MM-DD'));
          done();
        }
      });
    });

    it('should return valid when date is in the past', (done) => {
      const pastDate = moment().subtract(10, 'days').toDate();

      service.validateFutureDate(pastDate, '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.convertedDate).toBeDefined();
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // validatePastDateLimit
  // ---------------------------------------------------------------------------
  describe('validatePastDateLimit', () => {
    it('should return invalid with error 1145 when date is older than the limit', (done) => {
      // Default limit is 365 days; go beyond that
      const tooOldDate = moment().subtract(400, 'days').toDate();

      service.validatePastDateLimit(tooOldDate, '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe('1145');
          expect(result.errorMessage).toBe('Collection date is too old and exceeds the allowed limit');
          expect(errorCodeServiceSpy.getErrorMessage).toHaveBeenCalledWith('1145');
          done();
        }
      });
    });

    it('should return valid when date is within the allowed limit', (done) => {
      const recentDate = moment().subtract(30, 'days').toDate();

      service.validatePastDateLimit(recentDate, '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.convertedDate).toBeDefined();
          done();
        }
      });
    });

    it('should return valid when date is exactly at the past limit boundary', (done) => {
      // 365 days ago should be exactly on the boundary (not before), so valid
      const boundaryDate = moment().subtract(365, 'days').startOf('day').toDate();

      service.validatePastDateLimit(boundaryDate, '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(true);
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // validateRegisteredUnitDate
  // ---------------------------------------------------------------------------
  describe('validateRegisteredUnitDate', () => {
    it('should return valid when dates match', () => {
      const collDate = new Date(2026, 4, 20);
      const regDate = new Date(2026, 4, 20);

      const result = service.validateRegisteredUnitDate(collDate, regDate, true);

      expect(result.isValid).toBe(true);
      expect(result.convertedDate).toBe('2026-05-20');
    });

    it('should return invalid with error 16157 when dates differ', () => {
      const collDate = new Date(2026, 4, 20);
      const regDate = new Date(2026, 4, 21);

      const result = service.validateRegisteredUnitDate(collDate, regDate, true);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('16157');
      expect(result.errorMessage).toBe('Collection date does not match the registered unit date');
      expect(errorCodeServiceSpy.getErrorMessage).toHaveBeenCalledWith('16157');
    });

    it('should return valid when unit is not registered', () => {
      const collDate = new Date(2026, 4, 20);
      const regDate = new Date(2026, 4, 21);

      const result = service.validateRegisteredUnitDate(collDate, regDate, false);

      expect(result.isValid).toBe(true);
    });

    it('should return valid when registeredDate is undefined', () => {
      const collDate = new Date(2026, 4, 20);

      const result = service.validateRegisteredUnitDate(collDate, undefined, true);

      expect(result.isValid).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // validateDateFormat
  // ---------------------------------------------------------------------------
  describe('validateDateFormat', () => {
    it('should accept MM-DD-YYYY format', () => {
      const result = service.validateDateFormat('05-20-2026');

      expect(result.isValid).toBe(true);
      expect(result.convertedDate).toBe('2026-05-20');
    });

    it('should accept YYYY-MM-DD format', () => {
      const result = service.validateDateFormat('2026-05-20');

      expect(result.isValid).toBe(true);
      expect(result.convertedDate).toBe('2026-05-20');
    });

    it('should accept MM/DD/YYYY format', () => {
      const result = service.validateDateFormat('05/20/2026');

      expect(result.isValid).toBe(true);
      expect(result.convertedDate).toBe('2026-05-20');
    });

    it('should accept MMDDYYYY format', () => {
      const result = service.validateDateFormat('05202026');

      expect(result.isValid).toBe(true);
      expect(result.convertedDate).toBe('2026-05-20');
    });

    it('should return invalid for an unrecognized format', () => {
      const result = service.validateDateFormat('20-May-2026');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_DATE_FORMAT');
      expect(result.errorMessage).toBe('Invalid date format. Please use MM-DD-YYYY');
      expect(errorCodeServiceSpy.getErrorMessage).toHaveBeenCalledWith('INVALID_DATE_FORMAT');
    });

    it('should return invalid for nonsense input', () => {
      const result = service.validateDateFormat('not-a-date');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_DATE_FORMAT');
    });
  });

  // ---------------------------------------------------------------------------
  // validateCollectionDate (comprehensive pipeline)
  // ---------------------------------------------------------------------------
  describe('validateCollectionDate', () => {
    it('should stop with format error when date string is invalid', (done) => {
      service.validateCollectionDate('invalid-date', '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe('INVALID_DATE_FORMAT');
          done();
        }
      });
    });

    it('should stop with error 16157 when registered date does not match', (done) => {
      const collDate = new Date(2026, 4, 20);
      const regDate = new Date(2026, 4, 21);

      service.validateCollectionDate(collDate, '1', regDate, true).subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe('16157');
          done();
        }
      });
    });

    it('should stop with error 0060 when date is in the future', (done) => {
      const futureDate = moment().add(10, 'days').toDate();

      service.validateCollectionDate(futureDate, '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe('0060');
          done();
        }
      });
    });

    it('should stop with error 1145 when date is too old', (done) => {
      const tooOldDate = moment().subtract(400, 'days').toDate();

      service.validateCollectionDate(tooOldDate, '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe('1145');
          done();
        }
      });
    });

    it('should return valid when all checks pass', (done) => {
      const validDate = moment().subtract(5, 'days').toDate();

      service.validateCollectionDate(validDate, '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.convertedDate).toBeDefined();
          done();
        }
      });
    });

    it('should accept a valid date string and pass all checks', (done) => {
      const dateStr = moment().subtract(5, 'days').format('MM-DD-YYYY');

      service.validateCollectionDate(dateStr, '1').subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.convertedDate).toBeDefined();
          done();
        }
      });
    });

    it('should skip range validation when registered date matches', (done) => {
      const collDate = new Date(2026, 4, 20);
      const regDate = new Date(2026, 4, 20);

      service.validateCollectionDate(collDate, '1', regDate, true).subscribe({
        next: (result: DateValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.convertedDate).toBe('2026-05-20');
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // formatDateForDisplay
  // ---------------------------------------------------------------------------
  describe('formatDateForDisplay', () => {
    it('should format a Date as DD-MMM-YYYY', () => {
      const date = new Date(2026, 4, 20); // May 20, 2026
      const result = service.formatDateForDisplay(date);

      expect(result).toBe('20-May-2026');
    });

    it('should format a date string as DD-MMM-YYYY', () => {
      const result = service.formatDateForDisplay('2026-01-05');

      expect(result).toBe('05-Jan-2026');
    });
  });

  // ---------------------------------------------------------------------------
  // formatDateForApi
  // ---------------------------------------------------------------------------
  describe('formatDateForApi', () => {
    it('should format a Date as YYYY-MM-DD', () => {
      const date = new Date(2026, 4, 20);
      const result = service.formatDateForApi(date);

      expect(result).toBe('2026-05-20');
    });

    it('should format a date string as YYYY-MM-DD', () => {
      const result = service.formatDateForApi('05/20/2026');

      expect(result).toBe('2026-05-20');
    });
  });

  // ---------------------------------------------------------------------------
  // getDayOfWeek
  // ---------------------------------------------------------------------------
  describe('getDayOfWeek', () => {
    it('should return the full day name for a known date', () => {
      // May 20, 2026 is a Wednesday
      const date = new Date(2026, 4, 20);
      const result = service.getDayOfWeek(date);

      expect(result).toBe('Wednesday');
    });

    it('should return the full day name from a date string', () => {
      // January 1, 2026 is a Thursday
      const result = service.getDayOfWeek('2026-01-01');

      expect(result).toBe('Thursday');
    });
  });
});
