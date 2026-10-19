import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { FormControl } from '@angular/forms';
import { CustomDateAdapter, dateFormatValidator } from './date-adapter.util';
import { ChapterTimezoneService } from '../../shared/services/chapter-timezone.service';

describe('CustomDateAdapter', () => {
  let adapter: CustomDateAdapter;
  let chapterTzSpy: jasmine.SpyObj<ChapterTimezoneService>;

  beforeEach(() => {
    chapterTzSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'isChapterLocalDateAvailable',
      'getChapterLocalDate',
    ]);
    chapterTzSpy.isChapterLocalDateAvailable.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        CustomDateAdapter,
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
        { provide: ChapterTimezoneService, useValue: chapterTzSpy },
      ],
    });
    adapter = TestBed.inject(CustomDateAdapter);
  });

  // ── today ─────────────────────────────────────────────────────────

  describe('today', () => {
    it('returns chapter local date when available', () => {
      const chapterDate = new Date(2025, 5, 15);
      chapterTzSpy.isChapterLocalDateAvailable.and.returnValue(true);
      chapterTzSpy.getChapterLocalDate.and.returnValue({ toDate: () => chapterDate } as any);

      const result = adapter.today();

      expect(result).toEqual(chapterDate);
    });

    it('falls back to native today when chapter date is not available', () => {
      chapterTzSpy.isChapterLocalDateAvailable.and.returnValue(false);

      const result = adapter.today();

      expect(result instanceof Date).toBe(true);
    });
  });

  // ── format ────────────────────────────────────────────────────────

  describe('format', () => {
    it.each([
      { date: new Date(2025, 0, 11), displayFormat: 'DD-MMM-YYYY', expected: '11-JAN-2025' },
      { date: new Date(2026, 2, 5), displayFormat: 'DD-MMM-YYYY', expected: '05-MAR-2026' },
      { date: new Date(2026, 11, 25), displayFormat: 'DD-MMM-YYYY', expected: '25-DEC-2026' },
      { date: new Date(2026, 5, 1), displayFormat: 'DD-MMM-YYYY', expected: '01-JUN-2026' },
    ])('formats $expected in DD-MMM-YYYY', ({ date, displayFormat, expected }) => {
      expect(adapter.format(date, displayFormat)).toBe(expected);
    });

    it('formats as MMM YYYY for month/year display', () => {
      const date = new Date(2026, 3, 15);

      expect(adapter.format(date, 'MMM YYYY')).toBe('APR 2026');
    });

    it('formats as MMM YYYY when displayFormat string contains monthYear', () => {
      const date = new Date(2026, 8, 20);

      expect(adapter.format(date, 'monthYear')).toBe('SEP 2026');
    });

    it.each([
      { month: 0, name: 'JAN' }, { month: 1, name: 'FEB' }, { month: 2, name: 'MAR' },
      { month: 3, name: 'APR' }, { month: 4, name: 'MAY' }, { month: 5, name: 'JUN' },
      { month: 6, name: 'JUL' }, { month: 7, name: 'AUG' }, { month: 8, name: 'SEP' },
      { month: 9, name: 'OCT' }, { month: 10, name: 'NOV' }, { month: 11, name: 'DEC' },
    ])('maps month index $month to $name', ({ month, name }) => {
      const date = new Date(2026, month, 15);
      const formatted = adapter.format(date, 'DD-MMM-YYYY');
      expect(formatted).toContain(name);
    });
  });

  // ── parse ─────────────────────────────────────────────────────────

  describe('parse', () => {
    describe('null/invalid inputs', () => {
      it.each([
        { input: null, label: 'null' },
        { input: undefined, label: 'undefined' },
        { input: '', label: 'empty string' },
        { input: 0, label: 'number zero' },
        { input: true, label: 'boolean' },
      ])('returns null for $label', ({ input }) => {
        expect(adapter.parse(input)).toBeNull();
      });

      it('returns the Date object directly for Date input', () => {
        const date = new Date(2026, 2, 20);

        expect(adapter.parse(date)).toEqual(date);
      });
    });

    describe('DD-MMM-YYYY format', () => {
      it.each([
        { input: '20-MAR-2026', day: 20, month: 2, year: 2026 },
        { input: '01-JAN-2025', day: 1, month: 0, year: 2025 },
        { input: '31-DEC-2030', day: 31, month: 11, year: 2030 },
        { input: '5-JUL-2026', day: 5, month: 6, year: 2026 },
      ])('parses $input', ({ input, day, month, year }) => {
        const result = adapter.parse(input);

        expect(result).toEqual(new Date(year, month, day));
      });

      it('is case insensitive', () => {
        expect(adapter.parse('20-mar-2026')).toEqual(new Date(2026, 2, 20));
      });

      it('trims whitespace', () => {
        expect(adapter.parse('  20-MAR-2026  ')).toEqual(new Date(2026, 2, 20));
      });
    });

    describe('YYYY-MMM-DD format', () => {
      it('parses 2026-MAR-20', () => {
        expect(adapter.parse('2026-MAR-20')).toEqual(new Date(2026, 2, 20));
      });

      it('is case insensitive', () => {
        expect(adapter.parse('2026-mar-20')).toEqual(new Date(2026, 2, 20));
      });

      it('parses single digit day', () => {
        expect(adapter.parse('2026-JUL-5')).toEqual(new Date(2026, 6, 5));
      });

      it('returns null for invalid date (Feb 31)', () => {
        expect(adapter.parse('2026-FEB-31')).toBeNull();
      });
    });

    describe('DD/MMM/YYYY format', () => {
      it('parses 20/MAR/2026', () => {
        expect(adapter.parse('20/MAR/2026')).toEqual(new Date(2026, 2, 20));
      });

      it('is case insensitive', () => {
        expect(adapter.parse('20/mar/2026')).toEqual(new Date(2026, 2, 20));
      });

      it('parses single digit day', () => {
        expect(adapter.parse('5/JUL/2026')).toEqual(new Date(2026, 6, 5));
      });

      it('returns null for invalid date (Feb 31)', () => {
        expect(adapter.parse('31/FEB/2026')).toBeNull();
      });
    });

    describe('DD.MMM.YYYY format', () => {
      it('parses 20.MAR.2026', () => {
        expect(adapter.parse('20.MAR.2026')).toEqual(new Date(2026, 2, 20));
      });

      it('is case insensitive', () => {
        expect(adapter.parse('20.mar.2026')).toEqual(new Date(2026, 2, 20));
      });

      it('parses single digit day', () => {
        expect(adapter.parse('5.JUL.2026')).toEqual(new Date(2026, 6, 5));
      });

      it('returns null for invalid date (Feb 31)', () => {
        expect(adapter.parse('31.FEB.2026')).toBeNull();
      });
    });

    describe('numeric DD-MM-YYYY format', () => {
      it.each([
        { input: '20-03-2026', label: 'dash separator' },
        { input: '20/03/2026', label: 'slash separator' },
        { input: '20.03.2026', label: 'dot separator' },
      ])('parses with $label', ({ input }) => {
        expect(adapter.parse(input)).toEqual(new Date(2026, 2, 20));
      });

      it('returns null when month is zero (out of range after 0-index conversion)', () => {
        expect(adapter.parse('20-00-2026')).toBeNull();
      });

      it('returns null for invalid date with valid month (Apr 31)', () => {
        expect(adapter.parse('31-04-2026')).toBeNull();
      });
    });

    describe('YYYY-MM-DD (ISO) format', () => {
      it.each([
        { input: '2026-03-20', label: 'dash separator' },
        { input: '2026/03/20', label: 'slash separator' },
        { input: '2026.03.20', label: 'dot separator' },
      ])('parses with $label', ({ input }) => {
        expect(adapter.parse(input)).toEqual(new Date(2026, 2, 20));
      });

      it('returns null for month out of range (month 13)', () => {
        expect(adapter.parse('2026-13-20')).toBeNull();
      });

      it('returns null for month zero (out of range after 0-index conversion)', () => {
        expect(adapter.parse('2026-00-20')).toBeNull();
      });

      it('returns null for invalid date in ISO format (Feb 30)', () => {
        expect(adapter.parse('2026-02-30')).toBeNull();
      });
    });

    describe('compact formats (8 digits)', () => {
      it('parses DDMMYYYY format', () => {
        expect(adapter.parse('16042026')).toEqual(new Date(2026, 3, 16));
      });

      it('parses YYYYMMDD when DDMMYYYY fails', () => {
        expect(adapter.parse('20261231')).toEqual(new Date(2026, 11, 31));
      });

      it('returns null when both compact formats fail', () => {
        expect(adapter.parse('99992626')).toBeNull();
      });

      it('returns null when DDMMYYYY passes range check but fails date validation', () => {
        // 29022025 -> day=29, month=Feb, year=2025 (not leap year) -> invalid
        expect(adapter.parse('29022025')).toBeNull();
      });

      it('returns null when YYYYMMDD passes range check but fails date validation', () => {
        // 20260230 -> DDMMYYYY: month=26-1=25 (fails range)
        //          -> YYYYMMDD: year=2026, month=Feb, day=30 (invalid)
        expect(adapter.parse('20260230')).toBeNull();
      });

      it('returns null when DDMMYYYY day is out of range (day=0)', () => {
        // 00032026 -> dayFirst=0 (<1, fails range), YYYYMMDD: month=32-1=31 (>11, fails)
        expect(adapter.parse('00032026')).toBeNull();
      });
    });

    describe('invalid date validation', () => {
      it('returns null for Feb 31', () => {
        expect(adapter.parse('31-FEB-2026')).toBeNull();
      });

      it('returns null for Feb 29 in non-leap year', () => {
        expect(adapter.parse('29-02-2025')).toBeNull();
      });

      it('parses Feb 29 in leap year', () => {
        expect(adapter.parse('29-02-2024')).toEqual(new Date(2024, 1, 29));
      });

      it('returns null for invalid month in numeric format', () => {
        expect(adapter.parse('20-13-2026')).toBeNull();
      });

      it('returns null for unrecognizable string', () => {
        expect(adapter.parse('not-a-date')).toBeNull();
      });
    });
  });
});

describe('CustomDateAdapter (no ChapterTimezoneService)', () => {
  let adapter: CustomDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomDateAdapter,
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
        // ChapterTimezoneService intentionally NOT provided —
        // inject() throws, caught by constructor, sets service to null
      ],
    });
    adapter = TestBed.inject(CustomDateAdapter);
  });

  it('falls back to super.today() when ChapterTimezoneService is unavailable (null)', () => {
    const result = adapter.today();

    expect(result instanceof Date).toBe(true);
  });

  it('still formats dates correctly without ChapterTimezoneService', () => {
    const result = adapter.format(new Date(2026, 0, 15), 'DD-MMM-YYYY');

    expect(result).toBe('15-JAN-2026');
  });
});

describe('CustomDateAdapter format edge cases', () => {
  let adapter: CustomDateAdapter;
  let chapterTzSpy: jasmine.SpyObj<ChapterTimezoneService>;

  beforeEach(() => {
    chapterTzSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'isChapterLocalDateAvailable',
      'getChapterLocalDate',
    ]);
    chapterTzSpy.isChapterLocalDateAvailable.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        CustomDateAdapter,
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
        { provide: ChapterTimezoneService, useValue: chapterTzSpy },
      ],
    });
    adapter = TestBed.inject(CustomDateAdapter);
  });

  it('uses default DD-MMM-YYYY format when displayFormat Object stringifies to a non-matching value', () => {
    const result = adapter.format(new Date(2026, 5, 10), {});

    expect(result).toBe('10-JUN-2026');
  });

  it('pads single-digit day with leading zero', () => {
    const result = adapter.format(new Date(2026, 0, 1), 'DD-MMM-YYYY');

    expect(result).toBe('01-JAN-2026');
  });
});

// ── dateFormatValidator ─────────────────────────────────────────────

describe('dateFormatValidator', () => {
  const validator = dateFormatValidator();

  it.each([
    { value: null, label: 'null' },
    { value: '', label: 'empty string' },
    { value: undefined, label: 'undefined' },
  ])('returns null (valid) for $label', ({ value }) => {
    const control = new FormControl(value);

    expect(validator(control)).toBeNull();
  });

  it('returns null for Date object', () => {
    const control = new FormControl(new Date(2026, 2, 20));

    expect(validator(control)).toBeNull();
  });

  it('returns null for valid moment-like object', () => {
    const momentLike = { isValid: () => true };
    const control = new FormControl(momentLike);

    expect(validator(control)).toBeNull();
  });

  it('returns error for invalid moment-like object', () => {
    const momentLike = { isValid: () => false };
    const control = new FormControl(momentLike);

    const result = validator(control);

    expect(result).not.toBeNull();
    expect(result!['invalidDateFormat']).toBeDefined();
  });

  it.each([
    '12-MAR-2026',
    '01-JAN-2025',
    '31-DEC-2030',
    '15-jun-2026',
  ])('returns null for valid format: %s', (value) => {
    const control = new FormControl(value);

    expect(validator(control)).toBeNull();
  });

  it.each([
    { value: '2026-MAR-12', label: 'wrong order' },
    { value: '12/MAR/2026', label: 'slash separator' },
    { value: '12-13-2026', label: 'numeric month' },
    { value: '1-MAR-2026', label: 'single digit day' },
    { value: 'invalid', label: 'random string' },
  ])('returns error for invalid format: $label ($value)', ({ value }) => {
    const control = new FormControl(value);

    const result = validator(control);

    expect(result).not.toBeNull();
    expect(result!['invalidDateFormat'].expectedFormat).toContain('DD-MMM-YYYY');
  });

  it('returns error for invalid date in valid format (31-FEB-2026)', () => {
    const control = new FormControl('31-FEB-2026');

    const result = validator(control);

    expect(result).not.toBeNull();
    expect(result!['invalidDateFormat']).toBeDefined();
  });

  it('returns null (valid) for non-zero number (falls through all type checks)', () => {
    const control = new FormControl(42);

    expect(validator(control)).toBeNull();
  });

  it('returns null (valid) for plain object without isValid method', () => {
    const control = new FormControl({ foo: 'bar' });

    expect(validator(control)).toBeNull();
  });

  it('returns error for valid format but invalid day for month (Apr 31)', () => {
    const control = new FormControl('31-APR-2026');

    const result = validator(control);

    expect(result).not.toBeNull();
    expect(result!['invalidDateFormat']).toBeDefined();
  });

  it('returns null for valid leap year date (29-FEB-2024)', () => {
    const control = new FormControl('29-FEB-2024');

    expect(validator(control)).toBeNull();
  });

  it('returns error for non-leap year Feb 29 (29-FEB-2025)', () => {
    const control = new FormControl('29-FEB-2025');

    const result = validator(control);

    expect(result).not.toBeNull();
    expect(result!['invalidDateFormat']).toBeDefined();
  });
});
