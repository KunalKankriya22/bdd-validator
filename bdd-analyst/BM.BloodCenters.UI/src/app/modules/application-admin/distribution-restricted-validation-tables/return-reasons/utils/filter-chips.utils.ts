import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ReturnReasonsFilterValue } from '../models/return-reasons.model';

export class ReturnReasonsFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: ReturnReasonsFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.locationType) {
      chips.push({
        key: 'locationType',
        label: `Location: ${filters.locationType}`,
        value: filters.locationType
      });
    }

    if (filters.crNcr) {
      chips.push({
        key: 'crNcr',
        label: `Credit: ${filters.crNcr}`,
        value: filters.crNcr
      });
    }

    if (filters.enforce) {
      chips.push({
        key: 'enforce',
        label: `Enforce Policy: ${filters.enforce}`,
        value: filters.enforce
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const dateStr = this.formatDate(filters.effectiveDate);
      const operator = filters.effectiveDatePeriod.toUpperCase() === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${dateStr}`,
        value: filters.effectiveDate.toString()
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const dateStr = this.formatDate(filters.terminationDate);
      const operator = filters.terminationDatePeriod.toUpperCase() === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${dateStr}`,
        value: filters.terminationDate.toString()
      });
    }

    return chips;
  }

  /**
   * Format date for chip display
   */
  private static formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: ReturnReasonsFilterValue | null,
    chipKey: string
  ): ReturnReasonsFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'locationType':
        updatedFilters.locationType = null;
        break;
      case 'crNcr':
        updatedFilters.crNcr = null;
        break;
      case 'enforce':
        updatedFilters.enforce = null;
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

    // Check if all filters are null
    const hasAnyFilter = Object.values(updatedFilters).some(value => value !== null);
    return hasAnyFilter ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: ReturnReasonsFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return (
      !!filters.locationType ||
      !!filters.crNcr ||
      !!filters.enforce ||
      !!(filters.effectiveDatePeriod && filters.effectiveDate) ||
      !!(filters.terminationDatePeriod && filters.terminationDate)
    );
  }
}
