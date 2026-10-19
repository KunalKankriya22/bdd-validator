import { formatTableDate, formatTableDateTime, formatNoteTimestamp } from './date-format.util';

describe('DateFormatUtil', () => {
  describe('formatTableDate', () => {
    it('should format ISO date to DD-MON-YYYY', () => {
      expect(formatTableDate('2025-01-11T00:00:00')).toBe('11-JAN-2025');
    });

    it('should format date-only ISO string', () => {
      expect(formatTableDate('2026-04-05')).toBe('05-APR-2026');
    });

    it('should format date with Z suffix', () => {
      expect(formatTableDate('2025-06-15T10:30:00Z')).toBe('15-JUN-2025');
    });

    it('should return uppercase month abbreviation', () => {
      const result = formatTableDate('2025-12-25T00:00:00');
      expect(result).toBe('25-DEC-2025');
    });

    it('should return dash for null', () => {
      expect(formatTableDate(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(formatTableDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(formatTableDate('')).toBe('-');
    });

    it('should return dash for whitespace-only string', () => {
      expect(formatTableDate('   ')).toBe('-');
    });

    it('should return dash for invalid date string', () => {
      expect(formatTableDate('not-a-date')).toBe('-');
    });

    it('should return dash for non-string input', () => {
      expect(formatTableDate(123 as any)).toBe('-');
    });
  });

  describe('formatTableDateTime', () => {
    it('should format ISO date to DD-MON-YYYY HH:MM', () => {
      expect(formatTableDateTime('2025-01-11T14:30:00')).toBe('11-JAN-2025 14:30');
    });

    it('should format midnight correctly', () => {
      expect(formatTableDateTime('2025-06-15T00:00:00')).toBe('15-JUN-2025 00:00');
    });

    it('should return dash for null', () => {
      expect(formatTableDateTime(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(formatTableDateTime(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(formatTableDateTime('')).toBe('-');
    });

    it('should return dash for invalid date', () => {
      expect(formatTableDateTime('invalid')).toBe('-');
    });
  });

  describe('formatNoteTimestamp', () => {
    it('should format ISO date to DD-MON-YYYY H:MM AM/PM', () => {
      const result = formatNoteTimestamp('2025-01-11T14:30:00');
      expect(result).toMatch(/11-JAN-2025 2:30 PM/);
    });

    it('should format midnight as 12:00 AM', () => {
      const result = formatNoteTimestamp('2025-06-15T00:00:00');
      expect(result).toMatch(/15-JUN-2025 12:00 AM/);
    });

    it('should format noon as 12:00 PM', () => {
      const result = formatNoteTimestamp('2025-06-15T12:00:00');
      expect(result).toMatch(/15-JUN-2025 12:00 PM/);
    });

    it('should return dash for invalid date', () => {
      expect(formatNoteTimestamp('not-a-date')).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(formatNoteTimestamp('')).toBe('-');
    });
  });
});
