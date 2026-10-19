import { Injectable, inject } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ChapterTimezoneService } from '../../shared/services/chapter-timezone.service';

/**
 * Custom date adapter for DD-MMM-YYYY format (e.g., 11-JAN-2025)
 * Used across the application for consistent date formatting
 */
@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {

  private chapterTimezoneService: ChapterTimezoneService | null = null;

  constructor() {
    super();
    try {
      this.chapterTimezoneService = inject(ChapterTimezoneService);
    } catch {
      this.chapterTimezoneService = null;
    }
  }

  /**
   * Override today() to return the chapter's local date instead of the browser's date.
   * This ensures the datepicker calendar highlights the correct "today" per chapter timezone.
   */
  override today(): Date {
    if (this.chapterTimezoneService?.isChapterLocalDateAvailable()) {
      return this.chapterTimezoneService.getChapterLocalDate().toDate();
    }
    return super.today();
  }
  override format(date: Date, displayFormat: Object): string {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // Check if this is for month/year display (calendar header)
    const displayStr = String(displayFormat);
    if (displayStr === 'MMM YYYY' || displayStr.includes('monthYear')) {
      return `${month} ${year}`;
    }

    // Default: full date format
    return `${day}-${month}-${year}`;
  }

  override parse(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;

    if (typeof value !== 'string') return null;

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const trimmedValue = value.trim();

    // Try DD-MMM-YYYY format (e.g., 20-MAR-2026)
    const ddMmmYyyyRegex = /^(\d{1,2})-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(\d{4})$/i;
    let match = trimmedValue.match(ddMmmYyyyRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthIndex = monthNames.indexOf(match[2].toUpperCase());
      const year = parseInt(match[3], 10);
      const date = new Date(year, monthIndex, day);
      if (date.getDate() === day && date.getMonth() === monthIndex && date.getFullYear() === year) {
        return date;
      }
    }

    // Try YYYY-MMM-DD format (e.g., 2026-MAR-20) - auto convert
    const yyyyMmmDdRegex = /^(\d{4})-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(\d{1,2})$/i;
    match = trimmedValue.match(yyyyMmmDdRegex);
    if (match) {
      const year = parseInt(match[1], 10);
      const monthIndex = monthNames.indexOf(match[2].toUpperCase());
      const day = parseInt(match[3], 10);
      const date = new Date(year, monthIndex, day);
      if (date.getDate() === day && date.getMonth() === monthIndex && date.getFullYear() === year) {
        return date;
      }
    }

    // Try DD/MMM/YYYY format (e.g., 20/MAR/2026)
    const ddMmmYyyySlashRegex = /^(\d{1,2})\/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\/(\d{4})$/i;
    match = trimmedValue.match(ddMmmYyyySlashRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthIndex = monthNames.indexOf(match[2].toUpperCase());
      const year = parseInt(match[3], 10);
      const date = new Date(year, monthIndex, day);
      if (date.getDate() === day && date.getMonth() === monthIndex && date.getFullYear() === year) {
        return date;
      }
    }

    // Try DD.MMM.YYYY format (e.g., 20.MAR.2026)
    const ddMmmYyyyDotRegex = /^(\d{1,2})\.(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\.(\d{4})$/i;
    match = trimmedValue.match(ddMmmYyyyDotRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthIndex = monthNames.indexOf(match[2].toUpperCase());
      const year = parseInt(match[3], 10);
      const date = new Date(year, monthIndex, day);
      if (date.getDate() === day && date.getMonth() === monthIndex && date.getFullYear() === year) {
        return date;
      }
    }

    // Try numeric formats: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD
    const numericRegex = /^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/;
    match = trimmedValue.match(numericRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // 0-indexed
      const year = parseInt(match[3], 10);
      if (month >= 0 && month <= 11) {
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date;
        }
      }
    }

    // Try YYYY-MM-DD format (with -, /, or . separators)
    const isoRegex = /^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/;
    match = trimmedValue.match(isoRegex);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // 0-indexed
      const day = parseInt(match[3], 10);
      if (month >= 0 && month <= 11) {
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date;
        }
      }
    }

    // Try compact numeric formats without separators: DDMMYYYY (8 digits)
    const compactRegex = /^(\d{8})$/;
    match = trimmedValue.match(compactRegex);
    if (match) {
      const digits = match[1];

      // Try DDMMYYYY format (day-first, e.g., 16042026 → 16-APR-2026)
      const dayFirst = parseInt(digits.substring(0, 2), 10);
      const monthFirst = parseInt(digits.substring(2, 4), 10) - 1; // 0-indexed
      const yearFirst = parseInt(digits.substring(4, 8), 10);

      if (monthFirst >= 0 && monthFirst <= 11 && dayFirst >= 1 && dayFirst <= 31) {
        const dateFirst = new Date(yearFirst, monthFirst, dayFirst);
        if (dateFirst.getDate() === dayFirst && dateFirst.getMonth() === monthFirst && dateFirst.getFullYear() === yearFirst) {
          return dateFirst;
        }
      }

      // Try YYYYMMDD format (ISO compact, e.g., 20260416 → 16-APR-2026)
      const yearThird = parseInt(digits.substring(0, 4), 10);
      const monthThird = parseInt(digits.substring(4, 6), 10) - 1; // 0-indexed
      const dayThird = parseInt(digits.substring(6, 8), 10);

      if (monthThird >= 0 && monthThird <= 11 && dayThird >= 1 && dayThird <= 31) {
        const dateThird = new Date(yearThird, monthThird, dayThird);
        if (dateThird.getDate() === dayThird && dateThird.getMonth() === monthThird && dateThird.getFullYear() === yearThird) {
          return dateThird;
        }
      }
    }

    return null; // Could not parse
  }
}

/**
 * Date format configuration for DD-MMM-YYYY format
 */
export const DD_MMM_YYYY_FORMAT = {
  parse: {
    dateInput: 'DD-MMM-YYYY',
  },
  display: {
    dateInput: 'DD-MMM-YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD-MMM-YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

/**
 * Validator to check if the entered date matches DD-MMM-YYYY format
 * Shows error if format is invalid (e.g., must be like 12-MAR-2026)
 */
export function dateFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow empty/null values (use required validator separately if needed)
    if (!value) {
      return null;
    }

    // If it's already a Date object from the picker, it's valid
    if (value instanceof Date) {
      return null;
    }

    // If it's a moment object (from MomentDateAdapter), it's valid if the moment is valid
    if (typeof value === 'object' && value !== null && typeof value.isValid === 'function') {
      return value.isValid() ? null : { invalidDateFormat: { value, expectedFormat: 'DD-MMM-YYYY (e.g., 12-MAR-2026)' } };
    }

    // Check if it's a string in DD-MMM-YYYY format
    if (typeof value === 'string') {
      const dateFormatRegex = /^\d{2}-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/i;

      if (!dateFormatRegex.test(value)) {
        return { invalidDateFormat: { value, expectedFormat: 'DD-MMM-YYYY (e.g., 12-MAR-2026)' } };
      }

      // Additional validation: check if the date is actually valid
      const parts = value.split('-');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = parseInt(parts[0], 10);
      const monthIndex = monthNames.indexOf(parts[1].toUpperCase());
      const year = parseInt(parts[2], 10);

      if (monthIndex === -1 || isNaN(day) || isNaN(year)) {
        return { invalidDateFormat: { value, expectedFormat: 'DD-MMM-YYYY (e.g., 12-MAR-2026)' } };
      }

      // Check if day is valid for the given month
      const date = new Date(year, monthIndex, day);
      if (date.getDate() !== day || date.getMonth() !== monthIndex || date.getFullYear() !== year) {
        return { invalidDateFormat: { value, expectedFormat: 'DD-MMM-YYYY (e.g., 12-MAR-2026)' } };
      }
    }

    return null;
  };
}
