import { FilterChip } from "@shared/components/filter-chips/filter-chips";
import { ReportMasterTableFilterValue } from '../models/report-master-table.model';

/**
 * Utility class for converting Report Master filter values to filter chips
 */
export class ReportMasterFilterChipsUtils {

  /**
   * Format date to DD-MMM-YYYY
   */
  private static formatDate(date: Date | null): string {
    if (!date) return '';

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Convert period text to symbol
   * @param period - "Before" or "After"
   * @returns "≤" for Before, "≥" for After
   */
  private static getPeriodSymbol(period: string | null): string {
    if (!period) return '';
    if (period.toLowerCase() === 'before') return '≤';
    if (period.toLowerCase() === 'after') return '≥';
    return period;
  }

  /**
   * Convert ReportMasterTableFilterValue to FilterChip array
   * @param filters - The filter values from the filter panel
   * @returns Array of FilterChip objects
   */
  static convertFiltersToChips(
    filters: ReportMasterTableFilterValue | null
  ): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Type filter
    if (filters.type) {
      chips.push({
        key: 'type',
        label: `Type: ${filters.type}`,
        value: filters.type,
        removable: true
      });
    }

    // Chapter ID filter
    if (filters.chapterId) {
      chips.push({
        key: 'chapterId',
        label: `Chapter ID: ${filters.chapterId}`,
        value: filters.chapterId,
        removable: true
      });
    }

    // Warehouse filter
    if (filters.warehouse) {
      chips.push({
        key: 'warehouse',
        label: `Warehouse: ${filters.warehouse}`,
        value: filters.warehouse,
        removable: true
      });
    }

    // Effective Date filter
    if (filters.effectiveDate) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const periodSymbol = this.getPeriodSymbol(filters.effectiveDatePeriod);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${periodSymbol} ${formattedDate}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    // Termination Date filter
    if (filters.terminationDate) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const periodSymbol = this.getPeriodSymbol(filters.terminationDatePeriod);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${periodSymbol} ${formattedDate}`,
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
    filters: ReportMasterTableFilterValue | null,
    chipKey: string
  ): ReportMasterTableFilterValue {
    if (!filters) {
      return this.getEmptyFilters();
    }

    const updated = { ...filters };

    switch (chipKey) {
      case 'type':
        updated.type = null;
        break;
      case 'chapterId':
        updated.chapterId = null;
        break;
      case 'warehouse':
        updated.warehouse = null;
        break;
      case 'effectiveDate':
        updated.effectiveDate = null;
        updated.effectiveDatePeriod = null;
        break;
      case 'terminationDate':
        updated.terminationDate = null;
        updated.terminationDatePeriod = null;
        break;
    }

    return updated;
  }

  /**
   * Check if filters object has any active filters
   * @param filters - Filter values to check
   * @returns true if any filter is active
   */
  static hasActiveFilters(filters: ReportMasterTableFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return Object.values(filters).some(value => value !== null && value !== undefined);
  }

  /**
   * Get empty filters object
   * @returns Empty ReportMasterTableFilterValue
   */
  static getEmptyFilters(): ReportMasterTableFilterValue {
    return {
      type: null,
      chapterId: null,
      warehouse: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    };
  }
}