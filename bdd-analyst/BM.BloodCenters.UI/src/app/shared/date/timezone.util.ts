/**
 * Validates if a timezone string is a valid IANA timezone.
 * @param timezone - The timezone string to validate
 * @returns true if valid, false otherwise
 */
function isValidTimezone(timezone: string): boolean {
  if (!timezone) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current date components in a given IANA timezone.
 * Uses Intl.DateTimeFormat for reliable cross-browser timezone conversion.
 *
 * @param timezone - IANA timezone name (e.g., "America/Chicago")
 * @returns Object with year, month (0-based), and day
 * @returns UTC date if timezone is invalid
 */
export function getDateInTimezone(timezone: string): { year: number; month: number; day: number } {
  if (!isValidTimezone(timezone)) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth(),
      day: now.getUTCDate(),
    };
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  return {
    year: parseInt(parts.find(p => p.type === 'year')!.value, 10),
    month: parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1,
    day: parseInt(parts.find(p => p.type === 'day')!.value, 10),
  };
}

/**
 * Convert a UTC date to a specific IANA timezone, returning a Date object
 * that represents the same moment in time, but with the local date/time
 * components adjusted to the target timezone.
 *
 * Uses Intl.DateTimeFormat for reliable cross-browser timezone conversion.
 *
 * @param utcDate - The UTC date to convert (Date object or ISO string)
 * @param timezone - IANA timezone name (e.g., "America/Chicago", "Asia/Kolkata")
 * @returns Date object with date/time components in the target timezone
 * @returns Original date if timezone is invalid
 *
 * @example
 * // Convert UTC date to Chicago timezone
 * const utcDate = new Date('2026-04-09T15:30:00Z');
 * const chicagoDate = convertUTCToTimezone(utcDate, 'America/Chicago');
 * // chicagoDate will have the local date/time components for Chicago
 */
export function convertUTCToTimezone(utcDate: Date | string, timezone: string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  if (!isValidTimezone(timezone)) {
    return date;
  }

  // Use Intl.DateTimeFormat to get all date/time components in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);

  const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // 0-based
  const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')!.value, 10);
  const second = parseInt(parts.find(p => p.type === 'second')!.value, 10);

  // Create a new Date with the local components
  // Note: This creates a Date in the browser's timezone with these component values
  return new Date(year, month, day, hour, minute, second);
}