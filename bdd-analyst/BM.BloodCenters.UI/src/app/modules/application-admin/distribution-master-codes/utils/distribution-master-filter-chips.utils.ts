import { FilterChip } from "@shared/components/filter-chips/filter-chips";
import { MasterCodeFilter } from '../services/distribution-master-codes.service';

/**
 * Utility class for converting Distribution Master filter values to filter chips
 */
export class DistributionMasterFilterChipsUtils {

  /**
   * Convert MasterCodeFilter to FilterChip array
   * @param filters - The filter values from the filter panel
   * @returns Array of FilterChip objects
   */
  static convertFiltersToChips(
    filters: MasterCodeFilter | null
  ): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Effective Date filter
    if (filters.effectiveDate) {
      const period = (filters.effectiveDatePeriod || 'After').toLowerCase();
      const symbol = period === 'after' ? '≥' : '≤';
      const dateStr = this.formatDate(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${dateStr}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    // Termination Date filter
    if (filters.terminationDate) {
      const period = (filters.terminationDatePeriod || 'Before').toLowerCase();
      const symbol = period === 'after' ? '≥' : '≤';
      const dateStr = this.formatDate(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${dateStr}`,
        value: filters.terminationDate,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter from filter values
   * @param filters - Current filter values
   * @param chipKey - The key of the chip to remove
   * @returns Updated filter values with the specified filter removed
   */
  static removeFilterByChipKey(
    filters: MasterCodeFilter | null,
    chipKey: string
  ): MasterCodeFilter {
    if (!filters) {
      return this.getEmptyFilters();
    }

    const updated = { ...filters };

    switch (chipKey) {
      case 'effectiveDate':
        updated.effectiveDate = undefined;
        updated.effectiveDatePeriod = undefined;
        break;
      case 'terminationDate':
        updated.terminationDate = undefined;
        updated.terminationDatePeriod = undefined;
        break;
    }

    return updated;
  }

  /**
   * Check if filters object has any active filters
   * @param filters - Filter values to check
   * @returns true if any filter is active
   */
  static hasActiveFilters(filters: MasterCodeFilter | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(filters.effectiveDate || filters.terminationDate);
  }

  /**
   * Get empty filters object
   * @returns Empty MasterCodeFilter
   */
  static getEmptyFilters(): MasterCodeFilter {
    return {};
  }

  /**
   * Format date for display in chip
   * @param date - Date to format
   * @returns Formatted date string
   */
  private static formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
