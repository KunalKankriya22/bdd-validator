import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DayStatusFilterValue } from '../models/day-status-codes.model';

export class DayStatusFilterChipsUtils {
  /**
   * Format date to DD-MMM-YYYY format
   */
  private static formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  static convertFiltersToChips(filters: DayStatusFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.resourceCode) {
      chips.push({
        key: 'resourceCode',
        label: `Resource Code: ${filters.resourceCode}`,
        value: filters.resourceCode
      });
    }

    if (filters.status) {
      chips.push({
        key: 'status',
        label: `Status: ${filters.status}`,
        value: filters.status
      });
    }

    // Effective Date chip
    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      const periodSymbol = filters.effectiveDatePeriod === 'after' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${periodSymbol} ${this.formatDate(filters.effectiveDate)}`,
        value: { period: filters.effectiveDatePeriod, date: filters.effectiveDate }
      });
    }

    // Termination Date chip
    if (filters.terminationDatePeriod && filters.terminationDate) {
      const periodSymbol = filters.terminationDatePeriod === 'after' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${periodSymbol} ${this.formatDate(filters.terminationDate)}`,
        value: { period: filters.terminationDatePeriod, date: filters.terminationDate }
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: DayStatusFilterValue | null,
    chipKey: string
  ): DayStatusFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'resourceCode':
        updatedFilters.resourceCode = undefined;
        break;
      case 'status':
        updatedFilters.status = undefined;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDatePeriod = undefined;
        updatedFilters.effectiveDate = undefined;
        break;
      case 'terminationDate':
        updatedFilters.terminationDatePeriod = undefined;
        updatedFilters.terminationDate = undefined;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: DayStatusFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.resourceCode ||
      filters.status ||
      (filters.effectiveDatePeriod && filters.effectiveDate) ||
      (filters.terminationDatePeriod && filters.terminationDate)
    );
  }
}
