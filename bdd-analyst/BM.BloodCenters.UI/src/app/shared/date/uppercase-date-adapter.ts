import { Injectable, Optional, Inject, inject } from '@angular/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, MatMomentDateAdapterOptions } from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import moment, { Moment } from 'moment';
import { ChapterTimezoneService } from '../services/chapter-timezone.service';

/** Matches YYYY-MON-DD pattern (e.g., "2025-MAR-15", "2026-jan-03") */
const YYYY_MON_DD_REGEX = /^\d{4}[-/.]([A-Za-z]{3})[-/.]\d{1,2}$/;

/**
 * Custom date adapter that formats month names in uppercase (e.g., "15-JAN-2024")
 * to match the table display format from table-display.util.ts.
 *
 * Also overrides parse() to explicitly handle YYYY-MON-DD inputs,
 * preventing moment's lenient multi-format parsing from misinterpreting
 * the year digits as a day value (MLT-10635).
 */
@Injectable()
export class UppercaseMomentDateAdapter extends MomentDateAdapter {

  private chapterTimezoneService: ChapterTimezoneService | null = null;

  constructor(
    @Optional() @Inject(MAT_DATE_LOCALE) dateLocale: string,
    @Optional() @Inject(MAT_MOMENT_DATE_ADAPTER_OPTIONS) options?: MatMomentDateAdapterOptions
  ) {
    super(dateLocale, options);
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
  override today(): Moment {
    if (this.chapterTimezoneService?.isChapterLocalDateAvailable()) {
      return this.chapterTimezoneService.getChapterLocalDate();
    }
    return super.today();
  }

  override parse(value: any, parseFormat: string | string[]): Moment | null {
    if (!value) {
      return null;
    }

    if (typeof value !== 'string') {
      // For non-string values (e.g., Moment objects), call parent parse method
      return super.parse(value, parseFormat);
    }

    const trimmedValue = value.trim();

    // Normalize month abbreviations to title case (e.g., "APR" → "Apr", "apr" → "Apr")
    // This allows users to type months in any case while moment expects title case in strict mode
    // Matches: DD-MMM-YYYY, DD.MMM.YYYY, DD/MMM/YYYY, YYYY-MMM-DD, etc.
    let normalizedValue = trimmedValue.replace(
      /\b([A-Z]{3})\b/gi,
      (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
    );

    // Also normalize month abbreviations between digits for compact format (e.g., 01JAN2026)
    // \b won't fire between digits and letters since both are \w characters
    normalizedValue = normalizedValue.replace(
      /(\d)(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d)/gi,
      (_, d1, month, d2) => d1 + month.charAt(0).toUpperCase() + month.slice(1).toLowerCase() + d2
    );

    // Handle YYYY-MON-DD pattern explicitly
    if (YYYY_MON_DD_REGEX.test(normalizedValue)) {
      const formats = ['YYYY-MMM-DD', 'YYYY-MMM-D', 'YYYY/MMM/DD', 'YYYY/MMM/D', 'YYYY.MMM.DD', 'YYYY.MMM.D'];
      const parsed = moment(normalizedValue, formats, this.locale, true);
      if (parsed.isValid()) {
        return parsed;
      }
      return null;
    }

    // Get the parse formats from parseFormat parameter
    const formats = Array.isArray(parseFormat) ? parseFormat : [parseFormat];

    // Add single-digit day and month variants to handle inputs like "3-MAR-2025" or "12-2-2026"
    const expandedFormats = [...formats];
    formats.forEach(fmt => {
      if (fmt.includes('DD')) {
        expandedFormats.push(fmt.replace('DD', 'D'));
      }
      if (fmt.includes('MM') && !fmt.includes('MMM')) {
        expandedFormats.push(fmt.replace('MM', 'M'));
      }
      if (fmt.includes('DD') && fmt.includes('MM') && !fmt.includes('MMM')) {
        expandedFormats.push(fmt.replace('DD', 'D').replace('MM', 'M'));
      }
    });

    // Try strict parsing with all formats (using normalized value)
    const strictParsed = moment(normalizedValue, expandedFormats, this.locale, true);

    // If strict parsing fails, return null
    if (!strictParsed.isValid()) {
      return null;
    }

    // Additional validation: verify the parsed date matches the input
    // This catches cases where moment might accept overflow dates
    const inputUpper = trimmedValue.toUpperCase();

    // Check for DD-MMM-YYYY format (our primary format)
    const ddMmmYyyyMatch = inputUpper.match(/^(\d{1,2})[-/.]([A-Z]{3})[-/.](\d{4})$/);
    if (ddMmmYyyyMatch) {
      const [, dayStr, monthStr, yearStr] = ddMmmYyyyMatch;
      const inputDay = parseInt(dayStr, 10);
      const inputYear = parseInt(yearStr, 10);

      // Basic day validation (1-31)
      if (inputDay < 1 || inputDay > 31) {
        return null; // Invalid day value
      }

      // Verify the parsed date components match the input
      if (strictParsed.date() !== inputDay || strictParsed.year() !== inputYear) {
        return null; // Date was overflow-corrected (e.g., 32-MAR became 01-APR)
      }

      // Verify month abbreviation matches
      const parsedMonthAbbr = strictParsed.format('MMM').toUpperCase();
      if (parsedMonthAbbr !== monthStr) {
        return null; // Invalid month abbreviation
      }

      // Additional check: Validate the day is valid for the specific month/year
      // This catches cases like Feb 30, Apr 31, etc.
      // Use the already-parsed month index from strictParsed (which was parsed with correct format)
      const monthIndex = strictParsed.month(); // Get month index (0-11) from parsed date
      const tempDate = moment([inputYear, monthIndex, 1]); // Create date for that month/year
      const maxDaysInMonth = tempDate.daysInMonth();
      if (inputDay > maxDaysInMonth) {
        return null; // Day exceeds max days in this month (e.g., 32-jan, 30-feb, 31-apr)
      }
    }

    // Check for DDMMMYYYY compact format (e.g., 01JAN2026)
    const ddMmmYyyyCompactMatch = inputUpper.match(/^(\d{1,2})([A-Z]{3})(\d{4})$/);
    if (ddMmmYyyyCompactMatch) {
      const [, dayStr, monthStr, yearStr] = ddMmmYyyyCompactMatch;
      const inputDay = parseInt(dayStr, 10);
      const inputYear = parseInt(yearStr, 10);

      if (inputDay < 1 || inputDay > 31) {
        return null;
      }

      if (strictParsed.date() !== inputDay || strictParsed.year() !== inputYear) {
        return null;
      }

      const parsedMonthAbbr = strictParsed.format('MMM').toUpperCase();
      if (parsedMonthAbbr !== monthStr) {
        return null;
      }

      const monthIndex = strictParsed.month();
      const tempDate = moment([inputYear, monthIndex, 1]);
      const maxDaysInMonth = tempDate.daysInMonth();
      if (inputDay > maxDaysInMonth) {
        return null;
      }
    }

    // Check for DD/MM/YYYY (day-first, priority) or MM-DD-YYYY (month-first, fallback) numeric format
    const numericMatch = inputUpper.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (numericMatch) {
      const [, firstNum, secondNum, yearStr] = numericMatch;
      const first = parseInt(firstNum, 10);
      const second = parseInt(secondNum, 10);
      const inputYear = parseInt(yearStr, 10);

      // Verify the parsed result matches one of the two interpretations
      const parsedDay = strictParsed.date();
      const parsedMonth = strictParsed.month() + 1;
      const parsedYear = strictParsed.year();

      // DD/MM/YYYY interpretation: first=day, second=month
      const matchesDdMm = parsedDay === first && parsedMonth === second && parsedYear === inputYear;
      // MM/DD/YYYY interpretation: first=month, second=day
      const matchesMmDd = parsedMonth === first && parsedDay === second && parsedYear === inputYear;

      if (!matchesDdMm && !matchesMmDd) {
        return null; // Overflow detected — neither interpretation matches
      }
    }

    // Check for YYYY-MM-DD ISO format
    const yyyyMmDdMatch = inputUpper.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (yyyyMmDdMatch) {
      const [, yearStr, monthStr, dayStr] = yyyyMmDdMatch;
      const inputDay = parseInt(dayStr, 10);
      const inputMonth = parseInt(monthStr, 10);
      const inputYear = parseInt(yearStr, 10);

      // Verify no overflow occurred
      if (strictParsed.date() !== inputDay ||
          strictParsed.month() + 1 !== inputMonth ||
          strictParsed.year() !== inputYear) {
        return null;
      }
    }

    return strictParsed;
  }

  override format(date: Moment, displayFormat: string): string {
    const formatted = super.format(date, displayFormat);
    // Convert month abbreviations to uppercase for consistent display
    return formatted.toUpperCase();
  }
}
