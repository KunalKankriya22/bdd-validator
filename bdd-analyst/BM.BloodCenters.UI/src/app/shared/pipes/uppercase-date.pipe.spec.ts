import { UppercaseDatePipe } from './uppercase-date.pipe';
import { DatePipe } from '@angular/common';

describe('UppercaseDatePipe', () => {
  let pipe: UppercaseDatePipe;

  beforeEach(() => {
    pipe = new UppercaseDatePipe();
  });

  describe('Null and undefined handling', () => {
    it('should return null when value is null', () => {
      const result = pipe.transform(null);

      expect(result).toBeNull();
    });

    it('should return null when value is undefined', () => {
      const result = pipe.transform(undefined);

      expect(result).toBeNull();
    });
  });

  describe('Default format (dd-MMM-yyyy)', () => {
    it('should format a Date object with uppercase month abbreviation', () => {
      const date = new Date(2026, 3, 16); // April 16, 2026

      const result = pipe.transform(date);

      expect(result).toBe('16-APR-2026');
    });

    it('should format January date correctly', () => {
      const date = new Date(2026, 0, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-JAN-2026');
    });

    it('should format February date correctly', () => {
      const date = new Date(2026, 1, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-FEB-2026');
    });

    it('should format March date correctly', () => {
      const date = new Date(2026, 2, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-MAR-2026');
    });

    it('should format May date correctly', () => {
      const date = new Date(2026, 4, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-MAY-2026');
    });

    it('should format June date correctly', () => {
      const date = new Date(2026, 5, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-JUN-2026');
    });

    it('should format July date correctly', () => {
      const date = new Date(2026, 6, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-JUL-2026');
    });

    it('should format August date correctly', () => {
      const date = new Date(2026, 7, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-AUG-2026');
    });

    it('should format September date correctly', () => {
      const date = new Date(2026, 8, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-SEP-2026');
    });

    it('should format October date correctly', () => {
      const date = new Date(2026, 9, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-OCT-2026');
    });

    it('should format November date correctly', () => {
      const date = new Date(2026, 10, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-NOV-2026');
    });

    it('should format December date correctly', () => {
      const date = new Date(2026, 11, 15);

      const result = pipe.transform(date);

      expect(result).toBe('15-DEC-2026');
    });
  });

  describe('Custom format strings', () => {
    it('should format date with datetime format', () => {
      const date = new Date(2026, 3, 16, 14, 30);

      const result = pipe.transform(date, 'dd-MMM-yyyy HH:mm');

      expect(result).toBe('16-APR-2026 14:30');
    });

    it('should handle format without month abbreviation', () => {
      const date = new Date(2026, 3, 16);

      const result = pipe.transform(date, 'dd/yyyy');

      expect(result).toBe('16/2026');
    });

    it('should handle format with multiple month abbreviations', () => {
      const date = new Date(2026, 3, 16);

      const result = pipe.transform(date, 'MMM dd, yyyy (MMM)');

      expect(result).toBe('APR 16, 2026 (APR)');
    });

    it('should handle format with full month name', () => {
      const date = new Date(2026, 3, 16);

      const result = pipe.transform(date, 'MMMM dd, yyyy');

      expect(result).toBe('April 16, 2026');
    });

    it('should handle time-only format', () => {
      const date = new Date(2026, 3, 16, 9, 5, 30);

      const result = pipe.transform(date, 'HH:mm:ss');

      expect(result).toBe('09:05:30');
    });

    it('should handle year-month format', () => {
      const date = new Date(2026, 3, 16);

      const result = pipe.transform(date, 'yyyy-MMM');

      expect(result).toBe('2026-APR');
    });
  });

  describe('Different input types', () => {
    it('should handle ISO string dates', () => {
      const date = '2026-04-16T14:30:00';

      const result = pipe.transform(date);

      expect(result).toBe('16-APR-2026');
    });

    it('should handle date-only string', () => {
      const date = '2026-04-16';

      const result = pipe.transform(date);

      expect(result).not.toBeNull();
      expect(result!).toContain('APR');
    });

    it('should handle timestamp number', () => {
      const timestamp = new Date(2026, 3, 16).getTime();

      const result = pipe.transform(timestamp);

      expect(result).toBe('16-APR-2026');
    });
  });

  describe('DatePipe returning null (second branch guard)', () => {
    it('should return null when internal DatePipe returns null for invalid input', () => {
      // Access the private datePipe and spy on its transform method
      // to simulate the DatePipe returning null
      const datePipeSpy = jasmine.createSpyObj<DatePipe>('DatePipe', ['transform']);
      datePipeSpy.transform.and.returnValue(null);
      (pipe as any).datePipe = datePipeSpy;

      const result = pipe.transform('some-value');

      expect(result).toBeNull();
      expect(datePipeSpy.transform).toHaveBeenCalledWith('some-value', 'dd-MMM-yyyy');
    });

    it('should return null when internal DatePipe returns null with custom format', () => {
      const datePipeSpy = jasmine.createSpyObj<DatePipe>('DatePipe', ['transform']);
      datePipeSpy.transform.and.returnValue(null);
      (pipe as any).datePipe = datePipeSpy;

      const result = pipe.transform('some-value', 'yyyy-MM-dd');

      expect(result).toBeNull();
      expect(datePipeSpy.transform).toHaveBeenCalledWith('some-value', 'yyyy-MM-dd');
    });
  });

  describe('Uppercase month regex behavior', () => {
    it('should uppercase three-letter month abbreviation at word boundary', () => {
      const datePipeSpy = jasmine.createSpyObj<DatePipe>('DatePipe', ['transform']);
      datePipeSpy.transform.and.returnValue('16-Apr-2026');
      (pipe as any).datePipe = datePipeSpy;

      const result = pipe.transform(new Date(2026, 3, 16));

      expect(result).toBe('16-APR-2026');
    });

    it('should not uppercase text that is not a three-letter capitalized word', () => {
      const datePipeSpy = jasmine.createSpyObj<DatePipe>('DatePipe', ['transform']);
      datePipeSpy.transform.and.returnValue('16/04/2026');
      (pipe as any).datePipe = datePipeSpy;

      const result = pipe.transform(new Date(2026, 3, 16));

      expect(result).toBe('16/04/2026');
    });

    it('should uppercase multiple month abbreviations in the formatted string', () => {
      const datePipeSpy = jasmine.createSpyObj<DatePipe>('DatePipe', ['transform']);
      datePipeSpy.transform.and.returnValue('Apr 16, 2026 (Apr)');
      (pipe as any).datePipe = datePipeSpy;

      const result = pipe.transform(new Date(2026, 3, 16));

      expect(result).toBe('APR 16, 2026 (APR)');
    });

    it('should not affect already-uppercase text', () => {
      const datePipeSpy = jasmine.createSpyObj<DatePipe>('DatePipe', ['transform']);
      datePipeSpy.transform.and.returnValue('16-APRIL-2026');
      (pipe as any).datePipe = datePipeSpy;

      const result = pipe.transform(new Date(2026, 3, 16));

      // "APRIL" is 5 chars, not 3, so regex does not match; result unchanged
      expect(result).toBe('16-APRIL-2026');
    });
  });

  describe('Edge cases', () => {
    it('should handle first day of year', () => {
      const date = new Date(2026, 0, 1);

      const result = pipe.transform(date);

      expect(result).toBe('01-JAN-2026');
    });

    it('should handle last day of year', () => {
      const date = new Date(2026, 11, 31);

      const result = pipe.transform(date);

      expect(result).toBe('31-DEC-2026');
    });

    it('should handle leap year date', () => {
      const date = new Date(2024, 1, 29); // Feb 29, 2024

      const result = pipe.transform(date);

      expect(result).toBe('29-FEB-2024');
    });

    it('should use default format when format parameter is not provided', () => {
      const date = new Date(2026, 3, 16);

      const result = pipe.transform(date);

      expect(result).toBe('16-APR-2026');
    });
  });
});
