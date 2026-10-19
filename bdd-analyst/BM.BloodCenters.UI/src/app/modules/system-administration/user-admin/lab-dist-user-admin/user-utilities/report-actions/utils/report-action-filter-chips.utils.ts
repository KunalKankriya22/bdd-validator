import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ReportActionFilterValue } from '../models/report-action.model';

/**
 * Utility class for managing Report Action filter chips
 * Handles conversion between filter values and display chips
 */
export class ReportActionFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   * @param filters Current filter values
   * @returns Array of filter chips
   */
  static convertFiltersToChips(
    filters: ReportActionFilterValue | null
  ): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // User filter
    if (filters.userName) {
      chips.push({
        key: 'userName',
        label: `User: ${filters.userName}`,
        value: filters.userName,
        removable: true
      });
    }

    // Generated Date filter with period
    if (filters.generatedDate) {
      const periodSymbol = filters.generatedPeriodType === 'before' ? '≤' : '≥';
      chips.push({
        key: 'generatedDate',
        label: `generated date ${periodSymbol} ${this.formatDate(filters.generatedDate)}`,
        value: filters.generatedDate,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   * @param filters Current filter values
   * @param chipKey Key of chip to remove
   * @returns Updated filter values
   */
  static removeFilterByChipKey(
    filters: ReportActionFilterValue | null,
    chipKey: string
  ): ReportActionFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'userName':
        delete updatedFilters.userName;
        break;
      case 'generatedDate':
        delete updatedFilters.generatedDate;
        delete updatedFilters.generatedPeriodType;
        break;
    }

    return updatedFilters;
  }

  /**
   * Check if any filters are active
   * @param filters Filter values to check
   * @returns True if any filters are active
   */
  static hasActiveFilters(filters: ReportActionFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.userName ||
      filters.generatedDate
    );
  }

  /**
   * Get empty filter object
   * @returns Empty filter values
   */
  static getEmptyFilters(): ReportActionFilterValue {
    return {
      userName: undefined,
      generatedPeriodType: undefined,
      generatedDate: undefined
    };
  }

  /**
   * Convert filters to request body parameters for API
   * @param filters Filter values
   * @returns Request body parameters object
   */
  static filtersToQueryParams(filters: ReportActionFilterValue | null): any {
    if (!filters) {
      return {};
    }

    const params: any = {};

    if (filters.userName) {
      params.userName = filters.userName;
    }

    if (filters.generatedDate) {
      const formattedDate = this.formatDateForApi(filters.generatedDate);

      // Convert period type to submitDateFrom/submitDateTo
      if (filters.generatedPeriodType === 'after') {
        params.submitDateFrom = formattedDate;
      } else if (filters.generatedPeriodType === 'before') {
        params.submitDateTo = formattedDate;
      }
    }

    return params;
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   * @param date Date to format
   * @returns Formatted date string
   */
  private static formatDate(date: Date): string {
    if (!date) {
      return '';
    }

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Format date for API (ISO string without timezone conversion)
   * Sends the date as-is in ISO format with full time precision
   * Example: Nov 21, 2025 10:30:00.123 local becomes "2025-11-21T10:30:00.123Z"
   * @param date Date to format
   * @returns ISO date string
   */
  private static formatDateForApi(date: Date): string {
    if (!date) {
      return '';
    }

    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    const milliseconds = d.getMilliseconds().toString().padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
  }
}
