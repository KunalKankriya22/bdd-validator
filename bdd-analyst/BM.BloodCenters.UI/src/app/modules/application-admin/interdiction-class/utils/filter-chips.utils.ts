import { FilterChip } from "@shared/components/filter-chips/filter-chips";
import { AssignInterdictionClassFilterValue } from '../models/assign-interdiction-class.model';

/**
 * Utility class for converting filter values to filter chips
 */
export class FilterChipsUtils {

  /**
   * Convert AssignInterdictionClassFilterValue to FilterChip array
   * @param filters - The filter values from the filter panel
   * @param formatDate - Optional date formatter function
   * @returns Array of FilterChip objects
   */
  static convertFiltersToChips(
    filters: AssignInterdictionClassFilterValue | null,
    formatDate?: (date: string | null) => string
  ): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Interdiction Code
    if (filters.interdictionCode) {
      chips.push({
        key: 'interdictionCode',
        label: `Interdiction Code: ${filters.interdictionCode}`,
        value: filters.interdictionCode,
        removable: true
      });
    }

    // Type
    if (filters.type) {
      chips.push({
        key: 'type',
        label: `Type: ${filters.type}`,
        value: filters.type,
        removable: true
      });
    }

    // Class
    if (filters.class) {
      chips.push({
        key: 'class',
        label: `Class: ${filters.class}`,
        value: filters.class,
        removable: true
      });
    }

    // Effective Date with Period
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const dateStr = formatDate ? formatDate(filters.effectiveDate) : this.defaultFormatDate(filters.effectiveDate);

      const symbol = filters.effectiveDatePeriod === 'After' ? '≥' : '≤';

      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${dateStr}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    // Termination Date with Period
    if (filters.terminationDate && filters.terminationDatePeriod) {
      const dateStr = formatDate ? formatDate(filters.terminationDate) : this.defaultFormatDate(filters.terminationDate);

      const symbol = filters.terminationDatePeriod === 'After' ? '≥' : '≤';

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
   * Default date formatter (DD-MMM-YYYY format)
   */
  private static defaultFormatDate(date: string | null): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Remove a specific filter from filter values
   * @param filters - Current filter values
   * @param chipKey - The key of the chip to remove
   * @returns Updated filter values with the specified filter removed
   */
  static removeFilterByChipKey(
    filters: AssignInterdictionClassFilterValue | null,
    chipKey: string
  ): AssignInterdictionClassFilterValue {
    if (!filters) {
      return this.getEmptyFilters();
    }

    const updated = { ...filters };

    switch (chipKey) {
      case 'interdictionCode':
        updated.interdictionCode = null;
        break;
      case 'type':
        updated.type = null;
        break;
      case 'class':
        updated.class = null;
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
  static hasActiveFilters(filters: AssignInterdictionClassFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return Object.values(filters).some(value => value !== null && value !== undefined);
  }

  /**
   * Get empty filters object
   * @returns Empty AssignInterdictionClassFilterValue
   */
  static getEmptyFilters(): AssignInterdictionClassFilterValue {
    return {
      interdictionCode: null,
      type: null,
      class: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    };
  }
}