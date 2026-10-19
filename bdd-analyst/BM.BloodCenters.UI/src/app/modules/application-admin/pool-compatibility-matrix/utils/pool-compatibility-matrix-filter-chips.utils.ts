import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PoolCompatibilityMatrixFilterValue } from '../models/pool-compatibility-matrix.model';

/**
 * Utility class for managing filter chips in Pool Compatibility Matrix table
 * Handles conversion between filter values and chip display, and filter removal logic
 */
export class PoolCompatibilityMatrixFilterChipsUtils {
  /**
   * Converts filter values to displayable chips
   * @param filters Current filter state
   * @returns Array of filter chips for display
   */
  static convertFiltersToChips(filters: PoolCompatibilityMatrixFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.inventoryProductType) {
      chips.push({
        key: 'inventoryProductType',
        label: `Inventory Product Type: ${filters.inventoryProductType}`,
        value: filters.inventoryProductType
      });
    }

    if (filters.finishedInventoryProductType) {
      chips.push({
        key: 'finishedInventoryProductType',
        label: `Finished Inventory Product Type: ${filters.finishedInventoryProductType}`,
        value: filters.finishedInventoryProductType
      });
    }

    if (filters.effectiveDateFrom) {
      chips.push({
        key: 'effectiveDateFrom',
        label: `Effective Date ≥ ${this.formatDateDisplay(filters.effectiveDateFrom)}`,
        value: filters.effectiveDateFrom
      });
    }

    if (filters.effectiveDateTo) {
      chips.push({
        key: 'effectiveDateTo',
        label: `Effective Date ≤ ${this.formatDateDisplay(filters.effectiveDateTo)}`,
        value: filters.effectiveDateTo
      });
    }

    if (filters.terminationDateFrom) {
      chips.push({
        key: 'terminationDateFrom',
        label: `Termination Date ≥ ${this.formatDateDisplay(filters.terminationDateFrom)}`,
        value: filters.terminationDateFrom
      });
    }

    if (filters.terminationDateTo) {
      chips.push({
        key: 'terminationDateTo',
        label: `Termination Date ≤ ${this.formatDateDisplay(filters.terminationDateTo)}`,
        value: filters.terminationDateTo
      });
    }

    return chips;
  }

  /**
   * Removes a specific filter based on chip key
   * @param filters Current filter state
   * @param chipKey Key of the chip to remove
   * @returns Updated filter state with specified filter removed
   */
  static removeFilterByChipKey(
    filters: PoolCompatibilityMatrixFilterValue | null,
    chipKey: string
  ): PoolCompatibilityMatrixFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'inventoryProductType':
        updatedFilters.inventoryProductType = null;
        break;
      case 'finishedInventoryProductType':
        updatedFilters.finishedInventoryProductType = null;
        break;
      case 'effectiveDateFrom':
        updatedFilters.effectiveDateFrom = null;
        break;
      case 'effectiveDateTo':
        updatedFilters.effectiveDateTo = null;
        break;
      case 'terminationDateFrom':
        updatedFilters.terminationDateFrom = null;
        break;
      case 'terminationDateTo':
        updatedFilters.terminationDateTo = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Checks if any filters are currently active
   * @param filters Current filter state
   * @returns True if at least one filter is active
   */
  static hasActiveFilters(filters: PoolCompatibilityMatrixFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.inventoryProductType ||
      filters.finishedInventoryProductType ||
      filters.effectiveDateFrom ||
      filters.effectiveDateTo ||
      filters.terminationDateFrom ||
      filters.terminationDateTo
    );
  }

  /**
   * Formats date string for display in chips
   * @param dateString Date in YYYY-MM-DD format
   * @returns Formatted date string (DD-MMM-YYYY)
   */
  private static formatDateDisplay(dateString: string): string {
    try {
      const date = new Date(dateString);
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = String(date.getDate()).padStart(2, '0');
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  }
}
