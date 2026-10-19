import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineDurationBetweenProceduresFilterValue } from '../models/define-duration-between-procedures.model';

/**
 * Utility class for converting filter values to filter chips
 */
export class DefineDurationFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: DefineDurationBetweenProceduresFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.currDonationType) {
      chips.push({
        key: 'currDonationType',
        label: `Current Donation Type: ${filters.currDonationType}`,
        value: filters.currDonationType
      });
    }

    if (filters.procedureCode) {
      chips.push({
        key: 'procedureCode',
        label: `Current Procedure: ${filters.procedureCode}`,
        value: filters.procedureCode
      });
    }

    if (filters.effectiveDate) {
      const symbol = filters.effectiveDatePeriod === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${this.formatDate(filters.effectiveDate)}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate) {
      const symbol = filters.terminationDatePeriod === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${this.formatDate(filters.terminationDate)}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: DefineDurationBetweenProceduresFilterValue | null,
    chipKey: string
  ): DefineDurationBetweenProceduresFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'currDonationType':
        updatedFilters.currDonationType = null;
        break;
      case 'procedureCode':
        updatedFilters.procedureCode = null;
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

    // Check if all filters are null/false
    const hasAnyFilter =
      updatedFilters.currDonationType ||
      updatedFilters.procedureCode ||
      updatedFilters.effectiveDate ||
      updatedFilters.terminationDate;

    return hasAnyFilter ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: DefineDurationBetweenProceduresFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.currDonationType ||
      filters.procedureCode ||
      filters.effectiveDate ||
      filters.terminationDate
    );
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
}
