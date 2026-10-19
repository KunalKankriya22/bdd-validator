import { convertUTCToTimezone, getDateInTimezone } from './timezone.util';

describe('Timezone Utilities', () => {
  describe('getDateInTimezone', () => {
    it('should get current date components in America/Chicago timezone', () => {
      const result = getDateInTimezone('America/Chicago');

      expect(result.year).toBeGreaterThan(2020);
      expect(result.month).toBeGreaterThanOrEqual(0);
      expect(result.month).toBeLessThan(12);
      expect(result.day).toBeGreaterThan(0);
      expect(result.day).toBeLessThanOrEqual(31);
    });

    it('should get current date components in Asia/Kolkata timezone', () => {
      const result = getDateInTimezone('Asia/Kolkata');

      expect(result.year).toBeGreaterThan(2020);
      expect(result.month).toBeGreaterThanOrEqual(0);
      expect(result.month).toBeLessThan(12);
      expect(result.day).toBeGreaterThan(0);
      expect(result.day).toBeLessThanOrEqual(31);
    });

    it('should return UTC date for invalid timezone', () => {
      const result = getDateInTimezone('Invalid/Timezone');
      const now = new Date();

      expect(result.year).toBe(now.getUTCFullYear());
      expect(result.month).toBe(now.getUTCMonth());
      expect(result.day).toBe(now.getUTCDate());
    });
  });

  describe('convertUTCToTimezone', () => {
    it('should convert UTC date to America/Chicago timezone', () => {
      // Create a UTC date: April 9, 2026 at 20:30 UTC
      const utcDate = new Date(`${new Date().getFullYear()}-04-09T20:30:00Z`);

      // Convert to Chicago time (UTC-5 in summer, UTC-6 in winter)
      const chicagoDate = convertUTCToTimezone(utcDate, 'America/Chicago');

      // Verify the date object is valid
      expect(chicagoDate).toBeInstanceOf(Date);
      expect(chicagoDate.getFullYear()).toBe(new Date().getFullYear());
      expect(chicagoDate.getMonth()).toBe(3); // April (0-based)
      expect(chicagoDate.getDate()).toBe(9);

      // Chicago is UTC-5 during daylight saving time (April)
      // So 20:30 UTC = 15:30 Chicago time
      expect(chicagoDate.getHours()).toBe(15);
      expect(chicagoDate.getMinutes()).toBe(30);
    });

    it('should convert UTC date to Asia/Kolkata timezone', () => {
      // Create a UTC date: April 9, 2026 at 20:30 UTC
      const utcDate = new Date(`${new Date().getFullYear()}-04-09T20:30:00Z`);

      // Convert to Kolkata time (UTC+5:30)
      const kolkataDate = convertUTCToTimezone(utcDate, 'Asia/Kolkata');

      // Verify the date object is valid
      expect(kolkataDate).toBeInstanceOf(Date);
      expect(kolkataDate.getFullYear()).toBe(new Date().getFullYear());
      expect(kolkataDate.getMonth()).toBe(3); // April (0-based)

      // Kolkata is UTC+5:30
      // So 20:30 UTC = 02:00 next day (April 10) in Kolkata
      expect(kolkataDate.getDate()).toBe(10);
      expect(kolkataDate.getHours()).toBe(2);
      expect(kolkataDate.getMinutes()).toBe(0);
    });

    it('should handle ISO string input', () => {
      // Test with ISO string instead of Date object
      const isoString = '2026-04-09T20:30:00Z';

      const chicagoDate = convertUTCToTimezone(isoString, 'America/Chicago');

      expect(chicagoDate).toBeInstanceOf(Date);
      expect(chicagoDate.getFullYear()).toBe(new Date().getFullYear());
    });

    it('should handle date crossing midnight boundary', () => {
      // Create a UTC date late in the day
      const utcDate = new Date(`${new Date().getFullYear()}-04-09T23:30:00Z`);

      // Convert to Kolkata time (will be next day)
      const kolkataDate = convertUTCToTimezone(utcDate, 'Asia/Kolkata');

      // UTC+5:30 means April 10 at 05:00
      expect(kolkataDate.getDate()).toBe(10);
      expect(kolkataDate.getHours()).toBe(5);
      expect(kolkataDate.getMinutes()).toBe(0);
    });

    it('should return original date for invalid timezone', () => {
      const utcDate = new Date(`${new Date().getFullYear()}-04-09T20:30:00Z`);

      const result = convertUTCToTimezone(utcDate, 'Invalid/Timezone');

      expect(result).toEqual(utcDate);
    });

    it('should preserve time precision (seconds)', () => {
      const utcDate = new Date(`${new Date().getFullYear()}-04-09T20:30:45Z`);

      const chicagoDate = convertUTCToTimezone(utcDate, 'America/Chicago');

      expect(chicagoDate.getSeconds()).toBe(45);
    });
  });
});