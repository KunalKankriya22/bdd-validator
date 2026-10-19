import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { TrayDefinitionFilterValue } from '../models/tray-definition.model';

/**
 * Utility class for converting filter values to filter chips
 * and managing chip removal
 */
export class TrayDefinitionFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   *
   * @param filters Current filter values
   * @returns Array of filter chips
   */
  static convertFiltersToChips(filters: TrayDefinitionFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Tray Status
    if (filters.trayStatus) {
      chips.push({
        key: 'trayStatus',
        label: `Status: ${filters.trayStatus}`,
        value: filters.trayStatus
      });
    }

    // Effective Date with Period (≤ for Before, ≥ for After)
    if (filters.effectiveDate) {
      const period = filters.effectiveDatePeriod || 'After';
      const symbol = period === 'Before' ? '≤' : '≥';
      const dateStr = this.formatDate(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${dateStr}`,
        value: filters.effectiveDate
      });
    }

    // Termination Date with Period (≤ for Before, ≥ for After)
    if (filters.terminationDate) {
      const period = filters.terminationDatePeriod || 'After';
      const symbol = period === 'Before' ? '≤' : '≥';
      const dateStr = this.formatDate(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${dateStr}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key and return updated filter values
   *
   * @param filters Current filter values
   * @param chipKey Key of the chip to remove
   * @returns Updated filter values with the specified filter removed
   */
  static removeFilterByChipKey(
    filters: TrayDefinitionFilterValue | null,
    chipKey: string
  ): TrayDefinitionFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'trayStatus':
        updatedFilters.trayStatus = null;
        break;

      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectiveDatePeriod = null;
        break;

      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationDatePeriod = null;
        break;
    }

    // Return null if all filters are now null
    if (this.isEmptyFilter(updatedFilters)) {
      return null;
    }

    return updatedFilters;
  }

  /**
   * Check if any filters are currently active
   *
   * @param filters Current filter values
   * @returns True if at least one filter is active
   */
  static hasActiveFilters(filters: TrayDefinitionFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.trayStatus ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }

  /**
   * Check if filter object has all null values
   *
   * @param filters Filter values to check
   * @returns True if all filters are null
   */
  private static isEmptyFilter(filters: TrayDefinitionFilterValue): boolean {
    return (
      !filters.trayStatus &&
      !filters.effectiveDate &&
      !filters.terminationDate
    );
  }

  /**
   * Format date for chip display (DD-MMM-YYYY)
   *
   * @param date Date to format
   * @returns Formatted date string
   */
  private static formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }
}
