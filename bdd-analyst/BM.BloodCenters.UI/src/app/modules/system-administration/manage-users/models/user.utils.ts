/**
 * Utility functions for user management
 */

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

/**
 * Format date for display (MM/DD/YYYY)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

/**
 * Determine chapter status based on effective and termination dates
 * Uses chapter's local date instead of system date for accurate status
 * Compares date-only (YYYY-MM-DD) to avoid timezone issues
 */
export function getChapterStatus(
  effectiveDate: Date | string,
  terminationDate: Date | string | null,
  chapterOffset?: string
): 'Active' | 'Inactive' {
  // Get chapter's local date as YYYY-MM-DD string
  let todayStr: string;
  if (chapterOffset) {
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterOffset);
    todayStr = chapterToday.format('YYYY-MM-DD');
  } else {
    const now = new Date();
    todayStr = now.toISOString().split('T')[0];
  }

  // Extract date-only string from effective date (handles both ISO strings and Date objects)
  const effectiveStr = typeof effectiveDate === 'string'
    ? effectiveDate.split('T')[0]
    : effectiveDate.toISOString().split('T')[0];

  // Compare using date strings (YYYY-MM-DD format) to avoid timezone issues
  if (terminationDate) {
    const terminationStr = typeof terminationDate === 'string'
      ? terminationDate.split('T')[0]
      : terminationDate.toISOString().split('T')[0];
    return todayStr >= effectiveStr && todayStr <= terminationStr ? 'Active' : 'Inactive';
  }

  return todayStr >= effectiveStr ? 'Active' : 'Inactive';
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Get today's date at midnight
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}