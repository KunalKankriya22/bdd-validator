import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { VenipunctureAttributesFilterValue } from '../models/venipuncture-attributes.model';

export class VenipunctureAttributesFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: VenipunctureAttributesFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.code) {
      chips.push({
        key: 'code',
        label: `Code: ${filters.code}`,
        value: filters.code
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const operator = this.getDatePeriodSymbol(filters.effectiveDatePeriod);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${formattedDate}`,
        value: formattedDate
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const operator = this.getDatePeriodSymbol(filters.terminationDatePeriod);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${formattedDate}`,
        value: formattedDate
      });
    }

    return chips;
  }

  /**
   * Get typographic symbol for date period
   */
  private static getDatePeriodSymbol(period: string): string {
    return period === 'AFTER' ? '≥' : '≤';
  }

  /**
   * Format date to DD-MMM-YYYY format
   * Accepts both Date objects and string dates (YYYY-MM-DD format)
   */
  private static formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    // Convert to Date object if it's a string
    const d = date instanceof Date ? date : new Date(date);

    // Validate the date is valid
    if (isNaN(d.getTime())) {
      console.error('Invalid date:', date);
      return '-';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: VenipunctureAttributesFilterValue | null,
    chipKey: string
  ): VenipunctureAttributesFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'code':
        updatedFilters.code = null;
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

    // Return null if no filters are active
    if (!this.hasActiveFilters(updatedFilters)) {
      return null;
    }

    return updatedFilters;
  }

  /**
   * Check if any filters are currently active
   */
  static hasActiveFilters(filters: VenipunctureAttributesFilterValue | null): boolean {
    if (!filters) return false;
    return !!(
      filters.code ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }
}
