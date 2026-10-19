import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InternalContractFilterValue } from '../internal-contract-filter-panel/internal-contract-filter-panel.component';
import moment from 'moment';

export class InternalContractFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: InternalContractFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Effective Date filter
    if (filters.effectiveDate && filters.effectivePeriod) {
      const periodSymbol = this.getPeriodSign(filters.effectivePeriod);
      const formattedDate = this.formatDateForChip(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${periodSymbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    // Termination Date filter
    if (filters.terminationDate && filters.terminationPeriod) {
      const periodSymbol = this.getPeriodSign(filters.terminationPeriod);
      const formattedDate = this.formatDateForChip(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${periodSymbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: InternalContractFilterValue | null,
    chipKey: string
  ): InternalContractFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'effectiveDate':
        delete updatedFilters.effectiveDate;
        delete updatedFilters.effectivePeriod;
        break;
      case 'terminationDate':
        delete updatedFilters.terminationDate;
        delete updatedFilters.terminationPeriod;
        break;
    }

    // Return null if no filters remain
    const hasFilters = Object.values(updatedFilters).some(
      (value) => value !== undefined && value !== null
    );

    return hasFilters ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: InternalContractFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return Object.values(filters).some(
      (value) => value !== undefined && value !== null
    );
  }

  private static getPeriodSign(period: 'Before' | 'After'): string {
    return period === 'After' ? '≥' : '≤';
  }

  /**
   * Format date for chip display (Moment to DD-MON-YYYY)
   */
  private static formatDateForChip(date: any): string {
    try {
      const m = moment(date);
      return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
    } catch {
      return '';
    }
  }
}
