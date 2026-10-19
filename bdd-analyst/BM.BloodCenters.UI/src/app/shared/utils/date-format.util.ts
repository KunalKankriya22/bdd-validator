import moment from 'moment';

/**
 * Format ISO date string to DD-MON-YYYY display format
 * @param isoDate - ISO date string (e.g., "2025-01-11T00:00:00Z")
 * @returns Formatted date string (e.g., "11-JAN-2025") or '-' if null/undefined
 */
export function formatTableDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return '-';
  }

  // Ensure the input is a string and not an invalid literal
  if (typeof isoDate !== 'string' || isoDate.trim() === '') {
    return '-';
  }

  try {
    // Parse with moment to avoid UTC vs local timezone issues.
    // API may return "2026-04-05" or "2026-04-05T00:00:00" (no Z suffix),
    // which new Date() treats as local time — getUTCDate() then shifts the day.
    const m = moment(isoDate);
    if (!m.isValid()) {
      return '-';
    }

    return m.format('DD-MMM-YYYY').toUpperCase();
  } catch {
    return '-';
  }
}

/**
 * Format note timestamp for display
 * @param isoDate - ISO date string
 * @returns Formatted timestamp (e.g., "11-JAN-2025 2:30 PM")
 */
export function formatTableDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return '-';
  }

  try {
    const m = moment(isoDate);
    if (!m.isValid()) {
      return '-';
    }

    return m.format('DD-MMM-YYYY HH:mm').toUpperCase();
  } catch {
    return '-';
  }
}

export function formatNoteTimestamp(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      return '-';
    }

    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // hour '0' should be '12'

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  } catch {
    return '-';
  }
}
