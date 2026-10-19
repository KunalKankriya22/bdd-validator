/**
 * Utility functions for table display formatting
 */

/**
 * Formats any value for table display
 * All null/undefined values show as '-'
 * 
 * @param value - Value to format
 * @returns Formatted string or '-' for null/undefined
 */
export function formatTableValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string' && value.trim() === '') return '-';
  return value.toString();
}

/**
 * Formats a date for table display with timezone conversion
 * Returns '-' for null dates
 * 
 * Handles:
 * - UTC ISO strings with 'Z' suffix (e.g., "2025-11-22T00:00:03Z")
 * - Date objects
 * - Converts UTC to browser's local timezone automatically
 * 
 * @param date - Date to format (ISO string, Date object, or null)
 * @param format - Date format (default: dd-MMM-yyyy)
 * @returns Formatted date string in local timezone or '-'
 */
export function formatTableDate(date: string | Date | null, format: string = 'dd-MMM-yyyy'): string {
  if (!date) return '-';
  
  // Convert to Date object if string (handles UTC with 'Z' automatically)
  const localDate = typeof date === 'string' ? new Date(date) : date;
  
  // Validate date
  if (isNaN(localDate.getTime())) return '-';
  
  // Format date as shown in screenshot: "15-JAN-2026"
  // Note: getDate(), getMonth(), getFullYear() return values in local timezone
  const day = localDate.getDate().toString().padStart(2, '0');
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = monthNames[localDate.getMonth()];
  const year = localDate.getFullYear();
  
  return `${day}-${month}-${year}`;
}
