import { TestBed } from '@angular/core/testing';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import moment from 'moment';

import { UppercaseMomentDateAdapter } from './uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from './date-formats';
import { ChapterTimezoneService } from '../services/chapter-timezone.service';

describe('UppercaseMomentDateAdapter', () => {
  let adapter: UppercaseMomentDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UppercaseMomentDateAdapter,
        { provide: DateAdapter, useExisting: UppercaseMomentDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: MAT_DATE_LOCALE, useValue: 'en' },
        { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } }
      ]
    });

    adapter = TestBed.inject(UppercaseMomentDateAdapter);
  });

  // ──────────────────────────────────────────────
  // constructor
  // ──────────────────────────────────────────────
  describe('constructor', () => {
    it('should create the adapter', () => {
      expect(adapter).toBeTruthy();
    });

    it('should set chapterTimezoneService to null when not provided in DI', () => {
      // No ChapterTimezoneService provider -> inject() throws -> catch sets null
      // Verified indirectly: today() falls back to super.today()
      const result = adapter.today();
      expect(result.isValid()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // today() — without ChapterTimezoneService
  // ──────────────────────────────────────────────
  describe('today()', () => {
    it('should fall back to super.today() when chapterTimezoneService is null', () => {
      const before = moment().startOf('day');
      const result = adapter.today();
      const after = moment().endOf('day');

      expect(result.isValid()).toBe(true);
      expect(result.isSameOrAfter(before)).toBe(true);
      expect(result.isSameOrBefore(after)).toBe(true);
    });

    it('should return a Moment object', () => {
      const result = adapter.today();
      expect(moment.isMoment(result)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // format()
  // ──────────────────────────────────────────────
  describe('format()', () => {
    it('should format date with uppercase month abbreviation', () => {
      const date = moment('2025-03-15');
      const result = adapter.format(date, 'DD-MMM-YYYY');

      expect(result).toBe('15-MAR-2025');
    });

    it('should format date with full uppercase month name', () => {
      const date = moment('2025-01-20');
      const result = adapter.format(date, 'DD-MMMM-YYYY');

      expect(result).toBe('20-JANUARY-2025');
    });

    it('should format month-year label in uppercase', () => {
      const date = moment('2026-12-01');
      const result = adapter.format(date, 'MMM YYYY');

      expect(result).toBe('DEC 2026');
    });

    it('should handle all twelve months in uppercase', () => {
      const expectedMonths = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
      ];

      expectedMonths.forEach((monthName, index) => {
        const date = moment({ year: 2025, month: index, day: 1 });
        const result = adapter.format(date, 'DD-MMM-YYYY');

        expect(result).toContain(monthName);
      });
    });

    it('should uppercase a day-of-week format', () => {
      const date = moment('2025-03-15'); // Saturday
      const result = adapter.format(date, 'ddd, DD-MMM-YYYY');

      expect(result).toBe(result.toUpperCase());
    });

    it('should handle leap year date formatting', () => {
      const date = moment('2024-02-29');
      const result = adapter.format(date, 'DD-MMM-YYYY');

      expect(result).toBe('29-FEB-2024');
    });
  });

  // ──────────────────────────────────────────────
  // parse() — null / falsy / non-string input
  // ──────────────────────────────────────────────
  describe('parse() — null, falsy, and non-string input', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should return null for null input', () => {
      const result = adapter.parse(null, parseFormats);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = adapter.parse(undefined, parseFormats);
      expect(result).toBeNull();
    });

    it('should return null for empty string input', () => {
      const result = adapter.parse('', parseFormats);
      expect(result).toBeNull();
    });

    it('should return null for numeric zero input', () => {
      const result = adapter.parse(0, parseFormats);
      expect(result).toBeNull();
    });

    it('should return null for boolean false input', () => {
      const result = adapter.parse(false, parseFormats);
      expect(result).toBeNull();
    });

    it('should pass Moment object input to super.parse()', () => {
      const input = moment('2025-03-15');
      const result = adapter.parse(input, parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
    });

    it('should pass Date object input to super.parse()', () => {
      const input = new Date(2025, 2, 15); // March 15, 2025
      const result = adapter.parse(input, parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
    });

    it('should pass numeric non-zero input to super.parse() (non-string branch)', () => {
      // A numeric timestamp should be handled by super.parse()
      const timestamp = moment('2025-06-15').valueOf();
      const result = adapter.parse(timestamp, parseFormats);

      // super.parse may or may not produce a valid result for a raw number,
      // but it should NOT return null (the non-string branch delegates to super)
      expect(result).not.toBeNull();
    });
  });

  // ──────────────────────────────────────────────
  // parse() — YYYY-MON-DD explicit handling (MLT-10635)
  // ──────────────────────────────────────────────
  describe('parse() — YYYY-MON-DD handling (MLT-10635)', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should correctly parse 2025-MAR-15 as March 15 2025', () => {
      const result = adapter.parse('2025-MAR-15', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2); // 0-indexed
      expect(result!.date()).toBe(15);
    });

    it('should correctly parse 2026-JAN-25 as January 25 2026', () => {
      const result = adapter.parse('2026-JAN-25', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2026);
      expect(result!.month()).toBe(0);
      expect(result!.date()).toBe(25);
    });

    it('should handle lowercase month in YYYY-mon-DD format', () => {
      const result = adapter.parse('2025-mar-15', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should handle mixed-case month in YYYY-Mon-DD format', () => {
      const result = adapter.parse('2025-Mar-15', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should handle single-digit day in YYYY-MON-D format', () => {
      const result = adapter.parse('2025-MAR-3', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(3);
    });

    it('should handle slash separator in YYYY/MON/DD format', () => {
      const result = adapter.parse('2025/MAR/15', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should handle dot separator in YYYY.MON.DD format', () => {
      const result = adapter.parse('2025.MAR.15', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should handle leading/trailing whitespace', () => {
      const result = adapter.parse('  2025-MAR-15  ', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should NOT change the date value during YYYY-MON-DD conversion', () => {
      // This is the core MLT-10635 regression test:
      // "2025-MAR-15" must NOT become "20-MAR-2015"
      const result = adapter.parse('2025-MAR-15', parseFormats);
      const formatted = adapter.format(result!, 'DD-MMM-YYYY');

      expect(formatted).toBe('15-MAR-2025');
    });

    it('should correctly round-trip all twelve months in YYYY-MON-DD', () => {
      const months = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
      ];

      months.forEach((monthName, index) => {
        const input = `2025-${monthName}-10`;
        const result = adapter.parse(input, parseFormats);

        expect(result).not.toBeNull();
        expect(result!.isValid()).toBe(true);
        expect(result!.year()).toBe(2025);
        expect(result!.month()).toBe(index);
        expect(result!.date()).toBe(10);
      });
    });

    it('should return null for YYYY-MON-DD with invalid month abbreviation', () => {
      // Matches YYYY-MON-DD regex shape, but strict parse fails for invalid month
      const result = adapter.parse('2025-XYZ-15', parseFormats);

      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should return null for non-leap year YYYY-FEB-29', () => {
      // 2025 is not a leap year, so Feb 29 is invalid
      const result = adapter.parse('2025-FEB-29', parseFormats);

      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should parse leap year YYYY-FEB-29 correctly', () => {
      const result = adapter.parse('2024-FEB-29', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2024);
      expect(result!.month()).toBe(1);
      expect(result!.date()).toBe(29);
    });

    it('should handle end-of-month date 2025-JAN-31', () => {
      const result = adapter.parse('2025-JAN-31', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(0);
      expect(result!.date()).toBe(31);
    });

    it('should handle single-digit day with slash separator YYYY/MON/D', () => {
      const result = adapter.parse('2025/JUN/5', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.month()).toBe(5);
      expect(result!.date()).toBe(5);
    });

    it('should handle single-digit day with dot separator YYYY.MON.D', () => {
      const result = adapter.parse('2025.JUL.7', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.month()).toBe(6);
      expect(result!.date()).toBe(7);
    });
  });

  // ──────────────────────────────────────────────
  // parse() — DD-MON-YYYY (standard primary format)
  // ──────────────────────────────────────────────
  describe('parse() — DD-MON-YYYY (standard format)', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should parse 15-MAR-2025 correctly', () => {
      const result = adapter.parse('15-MAR-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse 03-MAR-2025 with leading-zero day', () => {
      const result = adapter.parse('03-MAR-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(3);
    });

    it('should parse single-digit day 3-MAR-2025', () => {
      const result = adapter.parse('3-MAR-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.date()).toBe(3);
    });

    it('should parse lowercase month 15-mar-2025', () => {
      const result = adapter.parse('15-mar-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.date()).toBe(15);
      expect(result!.month()).toBe(2);
      expect(result!.year()).toBe(2025);
    });

    it('should parse mixed-case month 15-Mar-2025', () => {
      const result = adapter.parse('15-Mar-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.date()).toBe(15);
    });
  });

  // ──────────────────────────────────────────────
  // parse() — DD-MON-YYYY overflow and validation
  // ──────────────────────────────────────────────
  describe('parse() — DD-MON-YYYY overflow detection', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should reject 30-FEB-2025 (February only has 28 days in non-leap year)', () => {
      const result = adapter.parse('30-FEB-2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 31-APR-2025 (April only has 30 days)', () => {
      const result = adapter.parse('31-APR-2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 29-FEB-2025 (non-leap year)', () => {
      const result = adapter.parse('29-FEB-2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should accept 29-FEB-2024 (leap year)', () => {
      const result = adapter.parse('29-FEB-2024', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2024);
      expect(result!.month()).toBe(1);
      expect(result!.date()).toBe(29);
    });

    it('should reject 32-MAR-2025 (day > 31)', () => {
      const result = adapter.parse('32-MAR-2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 00-MAR-2025 (day < 1)', () => {
      const result = adapter.parse('00-MAR-2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should accept 31-JAN-2025 (January has 31 days)', () => {
      const result = adapter.parse('31-JAN-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.date()).toBe(31);
    });

    it('should accept 28-FEB-2025 (valid non-leap February)', () => {
      const result = adapter.parse('28-FEB-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.date()).toBe(28);
      expect(result!.month()).toBe(1);
    });

    it('should reject 31-JUN-2025 (June only has 30 days)', () => {
      const result = adapter.parse('31-JUN-2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 31-SEP-2025 (September only has 30 days)', () => {
      const result = adapter.parse('31-SEP-2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 31-NOV-2025 (November only has 30 days)', () => {
      const result = adapter.parse('31-NOV-2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // parse() — DDMMMYYYY compact format
  // ──────────────────────────────────────────────
  describe('parse() — DDMMMYYYY compact format', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should parse 01JAN2026 compact format', () => {
      const result = adapter.parse('01JAN2026', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2026);
      expect(result!.month()).toBe(0);
      expect(result!.date()).toBe(1);
    });

    it('should parse lowercase compact format 15mar2026', () => {
      const result = adapter.parse('15mar2026', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2026);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse mixed-case compact format 20Apr2025', () => {
      const result = adapter.parse('20Apr2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(3);
      expect(result!.date()).toBe(20);
    });

    it('should parse 31DEC2025 (end of year, compact)', () => {
      const result = adapter.parse('31DEC2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(11);
      expect(result!.date()).toBe(31);
    });

    it('should parse 29FEB2024 (leap year, compact)', () => {
      const result = adapter.parse('29FEB2024', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2024);
      expect(result!.month()).toBe(1);
      expect(result!.date()).toBe(29);
    });

    it('should reject 30FEB2025 (February overflow, compact)', () => {
      const result = adapter.parse('30FEB2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 00JAN2025 (day < 1, compact)', () => {
      const result = adapter.parse('00JAN2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 32JAN2025 (day > 31, compact)', () => {
      const result = adapter.parse('32JAN2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 29FEB2025 (non-leap year, compact)', () => {
      const result = adapter.parse('29FEB2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 31APR2025 (April overflow, compact)', () => {
      const result = adapter.parse('31APR2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // parse() — other supported formats
  // ──────────────────────────────────────────────
  describe('parse() — other supported formats', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should parse MM-DD-YYYY format (03-15-2025)', () => {
      const result = adapter.parse('03-15-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse YYYY-MM-DD ISO format (2025-03-15)', () => {
      const result = adapter.parse('2025-03-15', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse DD MMM YYYY with spaces (15 MAR 2025)', () => {
      const result = adapter.parse('15 MAR 2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse MMM DD, YYYY format (MAR 15, 2025)', () => {
      const result = adapter.parse('MAR 15, 2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse MM.DD.YYYY dot-separated (03.15.2025)', () => {
      const result = adapter.parse('03.15.2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse DD/MMM/YYYY slash-separated (15/MAR/2025)', () => {
      const result = adapter.parse('15/MAR/2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse DD.MMM.YYYY dot-separated (15.MAR.2025)', () => {
      const result = adapter.parse('15.MAR.2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.date()).toBe(15);
      expect(result!.month()).toBe(2);
      expect(result!.year()).toBe(2025);
    });

    it('should parse MM/DD/YYYY slash-separated (03/15/2025)', () => {
      const result = adapter.parse('03/15/2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse YYYY/MM/DD slash-separated (2025/03/15)', () => {
      const result = adapter.parse('2025/03/15', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse YYYY.MM.DD dot-separated (2025.03.15)', () => {
      const result = adapter.parse('2025.03.15', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse MMDDYYYY compact numeric (03152025)', () => {
      const result = adapter.parse('03152025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should parse YYYYMMDD compact ISO (20250315)', () => {
      const result = adapter.parse('20250315', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });
  });

  // ──────────────────────────────────────────────
  // parse() — single format string (Array.isArray branch)
  // ──────────────────────────────────────────────
  describe('parse() — single format string', () => {
    it('should handle a single format string (not array)', () => {
      const result = adapter.parse('15-MAR-2025', 'DD-MMM-YYYY');

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.date()).toBe(15);
      expect(result!.month()).toBe(2);
      expect(result!.year()).toBe(2025);
    });

    it('should return null for invalid input with single format string', () => {
      const result = adapter.parse('garbage', 'DD-MMM-YYYY');
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should parse with single DD/MM/YYYY format string', () => {
      const result = adapter.parse('15/03/2025', 'DD/MM/YYYY');

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.date()).toBe(15);
      expect(result!.month()).toBe(2);
      expect(result!.year()).toBe(2025);
    });

    it('should expand single-digit variants for single format with DD', () => {
      // 'DD-MMM-YYYY' should produce expansion 'D-MMM-YYYY'
      const result = adapter.parse('3-MAR-2025', 'DD-MMM-YYYY');

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.date()).toBe(3);
    });

    it('should expand single-digit variants for single format with MM (not MMM)', () => {
      // 'MM/DD/YYYY' should produce expansion 'M/DD/YYYY'
      const result = adapter.parse('3/15/2025', 'MM/DD/YYYY');

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.month()).toBe(2);
      expect(result!.date()).toBe(15);
    });

    it('should expand both DD and MM for single format with both DD and MM', () => {
      // 'MM-DD-YYYY' should produce 'MM-D-YYYY', 'M-DD-YYYY', and 'M-D-YYYY'
      const result = adapter.parse('3-5-2025', 'MM-DD-YYYY');

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // parse() — completely invalid strings
  // ──────────────────────────────────────────────
  describe('parse() — invalid strings', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should return null for random text "garbage"', () => {
      const result = adapter.parse('garbage', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should return null for "not-a-date"', () => {
      const result = adapter.parse('not-a-date', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should return null for "hello world"', () => {
      const result = adapter.parse('hello world', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should return null for date with only year "2025"', () => {
      const result = adapter.parse('2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should return null for partial date "MAR-2025"', () => {
      const result = adapter.parse('MAR-2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should return null for symbols only "---"', () => {
      const result = adapter.parse('---', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // parse() — numeric format validation
  // ──────────────────────────────────────────────
  describe('parse() — numeric format overflow detection', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should reject 13/13/2025 (invalid month or day)', () => {
      const result = adapter.parse('13/13/2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 00/15/2025 (month zero)', () => {
      const result = adapter.parse('00/15/2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 02/30/2025 (Feb 30 does not exist)', () => {
      const result = adapter.parse('02/30/2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should parse valid numeric format 12/25/2025 (MM/DD/YYYY)', () => {
      const result = adapter.parse('12/25/2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(11);
      expect(result!.date()).toBe(25);
    });

    it('should parse single-digit month and day in numeric format', () => {
      const result = adapter.parse('1/5/2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
    });

    it('should reject 04/31/2025 (April has 30 days, numeric)', () => {
      const result = adapter.parse('04/31/2025', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // parse() — YYYY-MM-DD ISO overflow detection
  // ──────────────────────────────────────────────
  describe('parse() — YYYY-MM-DD overflow detection', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should reject 2025-02-30 (February 30 does not exist)', () => {
      const result = adapter.parse('2025-02-30', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 2025-13-01 (month 13 does not exist)', () => {
      const result = adapter.parse('2025-13-01', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should reject 2025-00-15 (month 0 does not exist)', () => {
      const result = adapter.parse('2025-00-15', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should parse valid ISO 2025-12-31', () => {
      const result = adapter.parse('2025-12-31', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(11);
      expect(result!.date()).toBe(31);
    });

    it('should reject 2025-04-31 (April has 30 days, ISO)', () => {
      const result = adapter.parse('2025-04-31', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should parse valid ISO 2024-02-29 (leap year)', () => {
      const result = adapter.parse('2024-02-29', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2024);
      expect(result!.month()).toBe(1);
      expect(result!.date()).toBe(29);
    });

    it('should reject 2025-02-29 (non-leap year, ISO)', () => {
      const result = adapter.parse('2025-02-29', parseFormats);
      expect(result === null || !result.isValid()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // parse() — edge cases and boundary dates
  // ──────────────────────────────────────────────
  describe('parse() — edge cases', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should fall back to super.parse for non-YYYY-MON-DD string patterns', () => {
      // "15-MAR-2025" should NOT match the YYYY-MON-DD regex,
      // so it falls through to super.parse() and still works
      const result = adapter.parse('15-MAR-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.date()).toBe(15);
      expect(result!.month()).toBe(2);
      expect(result!.year()).toBe(2025);
    });

    it('should handle Moment object input (pass-through)', () => {
      const input = moment('2025-03-15');
      const result = adapter.parse(input, parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
    });

    it('should handle Date object input (pass-through)', () => {
      const input = new Date(2025, 2, 15); // March 15, 2025
      const result = adapter.parse(input, parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
    });

    it('should handle leap year date 2024-FEB-29', () => {
      const result = adapter.parse('2024-FEB-29', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2024);
      expect(result!.month()).toBe(1);
      expect(result!.date()).toBe(29);
    });

    it('should handle end-of-month date 2025-JAN-31', () => {
      const result = adapter.parse('2025-JAN-31', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2025);
      expect(result!.month()).toBe(0);
      expect(result!.date()).toBe(31);
    });

    it('should handle year 2000 (Y2K)', () => {
      const result = adapter.parse('15-MAR-2000', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.year()).toBe(2000);
    });

    it('should handle year boundary Dec 31', () => {
      const result = adapter.parse('31-DEC-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.month()).toBe(11);
      expect(result!.date()).toBe(31);
    });

    it('should handle year boundary Jan 1', () => {
      const result = adapter.parse('01-JAN-2026', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.month()).toBe(0);
      expect(result!.date()).toBe(1);
    });

    it('should handle whitespace-only input', () => {
      const result = adapter.parse('   ', parseFormats);
      // After trimming, the string is empty, but !value check happens before trim
      // Actually '   ' is truthy, so it passes !value. Then trimmedValue is ''.
      // This will fail strict parsing -> return null
      expect(result === null || !result.isValid()).toBe(true);
    });

    it('should round-trip parse and format for DD-MMM-YYYY', () => {
      const input = '15-MAR-2025';
      const parsed = adapter.parse(input, parseFormats);
      const formatted = adapter.format(parsed!, 'DD-MMM-YYYY');

      expect(formatted).toBe('15-MAR-2025');
    });

    it('should round-trip parse and format for compact DDMMMYYYY', () => {
      const parsed = adapter.parse('01JAN2026', parseFormats);
      const formatted = adapter.format(parsed!, 'DD-MMM-YYYY');

      expect(formatted).toBe('01-JAN-2026');
    });
  });

  // ──────────────────────────────────────────────
  // parse() — month abbreviation normalization
  // ──────────────────────────────────────────────
  describe('parse() — month abbreviation normalization', () => {
    const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput;

    it('should normalize ALL CAPS month in DD-MMM-YYYY (15-MAR-2025)', () => {
      const result = adapter.parse('15-MAR-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
    });

    it('should normalize all lowercase month in DD-mmm-YYYY (15-mar-2025)', () => {
      const result = adapter.parse('15-mar-2025', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
    });

    it('should normalize compact lowercase month (01jan2026)', () => {
      const result = adapter.parse('01jan2026', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.month()).toBe(0);
    });

    it('should normalize compact mixed-case month (15Mar2026)', () => {
      const result = adapter.parse('15Mar2026', parseFormats);

      expect(result).not.toBeNull();
      expect(result!.isValid()).toBe(true);
      expect(result!.month()).toBe(2);
    });

    it('should handle all twelve months in compact format', () => {
      const months = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
      ];

      months.forEach((monthName, index) => {
        const input = `15${monthName}2025`;
        const result = adapter.parse(input, parseFormats);

        expect(result).not.toBeNull();
        expect(result!.isValid()).toBe(true);
        expect(result!.month()).toBe(index);
        expect(result!.date()).toBe(15);
        expect(result!.year()).toBe(2025);
      });
    });
  });
});

// ──────────────────────────────────────────────────────────────────
// today() with ChapterTimezoneService injected
// (Separate describe to avoid TestBed configuration conflicts)
// ──────────────────────────────────────────────────────────────────
describe('UppercaseMomentDateAdapter — today() with ChapterTimezoneService', () => {
  let adapter: UppercaseMomentDateAdapter;
  let mockTzService: jasmine.SpyObj<ChapterTimezoneService>;

  beforeEach(() => {
    mockTzService = jasmine.createSpyObj('ChapterTimezoneService', [
      'isChapterLocalDateAvailable',
      'getChapterLocalDate'
    ]);

    TestBed.configureTestingModule({
      providers: [
        UppercaseMomentDateAdapter,
        { provide: DateAdapter, useExisting: UppercaseMomentDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: MAT_DATE_LOCALE, useValue: 'en' },
        { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } },
        { provide: ChapterTimezoneService, useValue: mockTzService }
      ]
    });

    adapter = TestBed.inject(UppercaseMomentDateAdapter);
  });

  it('should return chapter local date when isChapterLocalDateAvailable is true', () => {
    const chapterDate = moment('2026-06-15');
    mockTzService.isChapterLocalDateAvailable.and.returnValue(true);
    mockTzService.getChapterLocalDate.and.returnValue(chapterDate);

    const result = adapter.today();

    expect(mockTzService.isChapterLocalDateAvailable).toHaveBeenCalled();
    expect(mockTzService.getChapterLocalDate).toHaveBeenCalled();
    expect(result.format('YYYY-MM-DD')).toBe('2026-06-15');
  });

  it('should fall back to super.today() when isChapterLocalDateAvailable is false', () => {
    mockTzService.isChapterLocalDateAvailable.and.returnValue(false);

    const before = moment().startOf('day');
    const result = adapter.today();
    const after = moment().endOf('day');

    expect(mockTzService.isChapterLocalDateAvailable).toHaveBeenCalled();
    expect(mockTzService.getChapterLocalDate).not.toHaveBeenCalled();
    expect(result.isValid()).toBe(true);
    expect(result.isSameOrAfter(before)).toBe(true);
    expect(result.isSameOrBefore(after)).toBe(true);
  });

  it('should not call getChapterLocalDate when isChapterLocalDateAvailable returns false', () => {
    mockTzService.isChapterLocalDateAvailable.and.returnValue(false);

    adapter.today();

    expect(mockTzService.getChapterLocalDate).not.toHaveBeenCalled();
  });

  it('should return the exact Moment from getChapterLocalDate', () => {
    const specificDate = moment('2020-01-01');
    mockTzService.isChapterLocalDateAvailable.and.returnValue(true);
    mockTzService.getChapterLocalDate.and.returnValue(specificDate);

    const result = adapter.today();

    expect(result).toBe(specificDate);
  });
});
