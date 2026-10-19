import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import moment from 'moment';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { ErrorCodeService } from './error-code.service';

/**
 * Date validation result
 */
export interface DateValidationResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
  convertedDate?: string;
  localDate?: Date;
}

/**
 * Chapter timezone configuration
 */
export interface ChapterTimezoneConfig {
  chapterId: string;
  timezone: string;
  pastDateLimitDays: number; // How many days in the past are allowed
}

/**
 * Date Validation Service
 * Handles all date validations with timezone support
 * Based on Oracle Forms COLL_DATE.WHEN-VALIDATE-ITEM trigger
 */
@Injectable({
  providedIn: 'root'
})
export class DateValidationService {
  private apiService = inject(ApiService);
  private errorCodeService = inject(ErrorCodeService);

  // Toggle for mock mode
  private useMockData = true;

  // Default past date limit (from GLOBAL.value in Oracle Forms)
  private readonly DEFAULT_PAST_DATE_LIMIT_DAYS = 365;

  /**
   * Get chapter timezone configuration
   */
  getChapterTimezone(chapterId: string): Observable<ChapterTimezoneConfig> {
    console.log('🔍 DateValidationService - getChapterTimezone:', chapterId);

    // Use mock data if enabled
    if (this.useMockData) {
      return of({
        chapterId: chapterId,
        timezone: 'America/Chicago',
        pastDateLimitDays: this.DEFAULT_PAST_DATE_LIMIT_DAYS
      });
    }

    const url = (API as any).SPECIAL_PATIENTS.GET_CHAPTER_TIMEZONE(chapterId);

    return this.apiService.get<any>(url).pipe(
      map(response => ({
        chapterId: chapterId,
        timezone: response.timezone || 'UTC',
        pastDateLimitDays: response.pastDateLimitDays || this.DEFAULT_PAST_DATE_LIMIT_DAYS
      }))
    );
  }

  /**
   * Convert date to chapter local time
   * Note: Without moment-timezone, using browser local time
   * TODO: Install moment-timezone for proper timezone support
   */
  convertToChapterLocalTime(date: Date | string, timezone: string): Date {
    return moment(date).toDate();
  }

  /**
   * Get current date in chapter timezone
   * Note: Without moment-timezone, using browser local time
   */
  getCurrentChapterDate(chapterId: string): Observable<Date> {
    return this.getChapterTimezone(chapterId).pipe(
      map(config => {
        return moment().toDate();
      })
    );
  }

  /**
   * Validate future date
   * Error 0060: Collection date cannot be in the future
   */
  validateFutureDate(
    collectionDate: Date | string,
    chapterId: string
  ): Observable<DateValidationResult> {
    console.log('🔍 DateValidationService - validateFutureDate:', { collectionDate, chapterId });

    return this.getChapterTimezone(chapterId).pipe(
      map(config => {
        const collDate = moment(collectionDate).startOf('day');
        const localNow = moment().startOf('day');

        console.log('📅 Date comparison:', {
          collectionDate: collDate.format('YYYY-MM-DD'),
          localToday: localNow.format('YYYY-MM-DD'),
          timezone: config.timezone
        });

        if (collDate.isAfter(localNow)) {
          return {
            isValid: false,
            errorCode: '0060',
            errorMessage: this.errorCodeService.getErrorMessage('0060')
          };
        }

        return {
          isValid: true,
          convertedDate: collDate.format('YYYY-MM-DD'),
          localDate: collDate.toDate()
        };
      })
    );
  }

  /**
   * Validate past date limit
   * Error 1145: Collection date is too old
   */
  validatePastDateLimit(
    collectionDate: Date | string,
    chapterId: string
  ): Observable<DateValidationResult> {
    console.log('🔍 DateValidationService - validatePastDateLimit:', { collectionDate, chapterId });

    return this.getChapterTimezone(chapterId).pipe(
      map(config => {
        const collDate = moment(collectionDate).startOf('day');
        const localNow = moment().startOf('day');
        const pastLimit = localNow.clone().subtract(config.pastDateLimitDays, 'days');

        console.log('📅 Past date check:', {
          collectionDate: collDate.format('YYYY-MM-DD'),
          localToday: localNow.format('YYYY-MM-DD'),
          pastLimit: pastLimit.format('YYYY-MM-DD'),
          limitDays: config.pastDateLimitDays
        });

        if (collDate.isBefore(pastLimit)) {
          return {
            isValid: false,
            errorCode: '1145',
            errorMessage: this.errorCodeService.getErrorMessage('1145')
          };
        }

        return {
          isValid: true,
          convertedDate: collDate.format('YYYY-MM-DD'),
          localDate: collDate.toDate()
        };
      })
    );
  }

  /**
   * Validate collection date matches registered unit date
   * Error 16157: Collection date does not match registered unit date
   * Based on Oracle Forms: IF trunc(:special_units.coll_date) != labCollDate
   */
  validateRegisteredUnitDate(
    collectionDate: Date | string,
    registeredDate: Date | string | undefined,
    isUnitRegistered: boolean
  ): DateValidationResult {
    console.log('🔍 DateValidationService - validateRegisteredUnitDate:', {
      collectionDate,
      registeredDate,
      isUnitRegistered
    });

    // Only validate if unit is registered
    if (!isUnitRegistered || !registeredDate) {
      return {
        isValid: true
      };
    }

    const collDate = moment(collectionDate).startOf('day');
    const regDate = moment(registeredDate).startOf('day');

    console.log('📅 Registered date check:', {
      collectionDate: collDate.format('YYYY-MM-DD'),
      registeredDate: regDate.format('YYYY-MM-DD'),
      matches: collDate.isSame(regDate)
    });

    if (!collDate.isSame(regDate)) {
      return {
        isValid: false,
        errorCode: '16157',
        errorMessage: this.errorCodeService.getErrorMessage('16157')
      };
    }

    return {
      isValid: true,
      convertedDate: collDate.format('YYYY-MM-DD'),
      localDate: collDate.toDate()
    };
  }

  /**
   * Validate date format
   */
  validateDateFormat(dateString: string): DateValidationResult {
    // Accept formats: MM-DD-YYYY, YYYY-MM-DD, MM/DD/YYYY, MMDDYYYY
    const formats = [
      'MM-DD-YYYY',
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'MMDDYYYY'
    ];

    const parsedDate = moment(dateString, formats, true);

    if (!parsedDate.isValid()) {
      return {
        isValid: false,
        errorCode: 'INVALID_DATE_FORMAT',
        errorMessage: this.errorCodeService.getErrorMessage('INVALID_DATE_FORMAT')
      };
    }

    return {
      isValid: true,
      convertedDate: parsedDate.format('YYYY-MM-DD'),
      localDate: parsedDate.toDate()
    };
  }

  /**
   * Comprehensive collection date validation
   * Combines all validation checks
   */
  validateCollectionDate(
    collectionDate: Date | string,
    chapterId: string,
    registeredDate?: Date | string,
    isUnitRegistered: boolean = false
  ): Observable<DateValidationResult> {
    console.log('🔍 DateValidationService - validateCollectionDate:', {
      collectionDate,
      chapterId,
      registeredDate,
      isUnitRegistered
    });

    // Step 1: Validate format if string
    if (typeof collectionDate === 'string') {
      const formatValidation = this.validateDateFormat(collectionDate);
      if (!formatValidation.isValid) {
        return of(formatValidation);
      }
      collectionDate = formatValidation.localDate!;
    }

    // Step 2: Check registered unit date match first (IM 160 logic)
    const registeredDateCheck = this.validateRegisteredUnitDate(
      collectionDate,
      registeredDate,
      isUnitRegistered
    );
    if (!registeredDateCheck.isValid) {
      return of(registeredDateCheck);
    }

    // Step 3: Only validate future/past if date doesn't match lab collection date
    const shouldValidateRange = !isUnitRegistered ||
      !registeredDate ||
      !moment(collectionDate).startOf('day').isSame(moment(registeredDate).startOf('day'));

    if (!shouldValidateRange) {
      console.log('⏭️ Skipping range validation - matches registered date');
      return of({
        isValid: true,
        convertedDate: moment(collectionDate).format('YYYY-MM-DD'),
        localDate: moment(collectionDate).toDate()
      });
    }

    // Step 4 & 5: Validate future date, then past date limit
    return this.validateFutureDate(collectionDate, chapterId).pipe(
      switchMap(futureValidation => {
        if (!futureValidation.isValid) {
          return of(futureValidation);
        }

        // If future date is valid, check past date limit
        return this.validatePastDateLimit(collectionDate, chapterId);
      })
    );
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDateForDisplay(date: Date | string): string {
    return moment(date).format('DD-MMM-YYYY');
  }

  /**
   * Format date for API (YYYY-MM-DD)
   */
  formatDateForApi(date: Date | string): string {
    return moment(date).format('YYYY-MM-DD');
  }

  /**
   * Get day of week
   */
  getDayOfWeek(date: Date | string): string {
    return moment(date).format('dddd'); // Returns full day name like "Tuesday"
  }
}
