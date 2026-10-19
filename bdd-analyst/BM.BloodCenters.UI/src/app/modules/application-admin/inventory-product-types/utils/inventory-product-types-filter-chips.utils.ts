import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InventoryProductTypeFilterValue } from '../models/inventory-product-types.model';

/**
 * Utility class for managing filter chips in Inventory Product Types table
 * Handles conversion between filter values and chip display, and filter removal logic
 */
export class InventoryProductTypesFilterChipsUtils {
  /**
   * Converts filter values to displayable chips
   * @param filters Current filter state
   * @returns Array of filter chips for display
   */
  static convertFiltersToChips(filters: InventoryProductTypeFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.productGrouping) {
      chips.push({
        key: 'productGrouping',
        label: `Grouping: ${filters.productGrouping}`,
        value: filters.productGrouping
      });
    }

    if (filters.specialInventory !== null && filters.specialInventory !== undefined) {
      chips.push({
        key: 'specialInventory',
        label: `Special: ${filters.specialInventory ? 'Yes' : 'No'}`,
        value: filters.specialInventory
      });
    }

    if (filters.priceRange && filters.price !== null) {
      chips.push({
        key: 'price',
        label: `Price ${filters.priceRange}: $${Number(filters.price).toFixed(2)}`,
        value: filters.price
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
    filters: InventoryProductTypeFilterValue | null,
    chipKey: string
  ): InventoryProductTypeFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'productGrouping':
        updatedFilters.productGrouping = null;
        break;
      case 'specialInventory':
        updatedFilters.specialInventory = null;
        break;
      case 'price':
        updatedFilters.priceRange = null;
        updatedFilters.price = null;
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
  static hasActiveFilters(filters: InventoryProductTypeFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.productGrouping ||
      filters.specialInventory !== null ||
      (filters.priceRange && filters.price !== null) ||
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
