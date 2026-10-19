import { formatTableDate, formatNoteTimestamp } from './table-display.util';

describe('table-display.util', () => {

  describe('formatTableDate', () => {



    it('should format ISO date with Z suffix correctly', () => {
      const result = formatTableDate('2025-01-11T00:00:00Z');
      expect(result).toBe('11-JAN-2025');
    });

    it('should format ISO date without Z suffix correctly', () => {
      const result = formatTableDate('2026-04-05T00:00:00');
      expect(result).toBe('05-APR-2026');
    });

    it('should format date-only string correctly', () => {
      const result = formatTableDate('2025-03-14');
      expect(result).toBe('14-MAR-2025');
    });


    it('should format various months correctly', () => {
      expect(formatTableDate('2025-02-28')).toBe('28-FEB-2025');
      expect(formatTableDate('2025-06-15')).toBe('15-JUN-2025');
      expect(formatTableDate('2025-12-25')).toBe('25-DEC-2025');
    });
  });

  describe('formatNoteTimestamp', () => {

    it('should format timestamp with AM/PM', () => {
      const result = formatNoteTimestamp('2025-01-11T14:30:00');
      expect(result).toMatch(/11-JAN-2025 2:30 PM/);
    });

    it('should format midnight as 12 AM', () => {
      const result = formatNoteTimestamp('2025-01-11T00:15:00');
      expect(result).toMatch(/11-JAN-2025 12:15 AM/);
    });

    it('should format noon as 12 PM', () => {
      const result = formatNoteTimestamp('2025-01-11T12:00:00');
      expect(result).toMatch(/11-JAN-2025 12:00 PM/);
    });

    it('should format morning time as AM', () => {
      const result = formatNoteTimestamp('2025-03-14T09:05:00');
      expect(result).toMatch(/14-MAR-2025 9:05 AM/);
    });
  });
});
