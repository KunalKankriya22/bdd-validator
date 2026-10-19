import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidReagentSupplierCodeFilterValue } from '../filter-panel/valid-reagent-supplier-code-filter-panel';
import moment, { Moment } from 'moment';

export class ValidReagentSupplierCodeFilterChipsUtils {
  /**
   * Format date to display string
   */
  private static formatDate(date: Moment | string | null | undefined): string {
    if (!date) return '';
    const formatted = moment.isMoment(date)
      ? date.format('DD-MMM-YYYY')
      : moment(date).format('DD-MMM-YYYY');
    return formatted.toUpperCase();
  }

  /**
   * Map period text to symbol sign
   */
  private static getPeriodSign(period: string): string {
    switch (period) {
      case 'After': return '≥';
      case 'Before': return '≤';
      default: return period;
    }
  }

  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: ValidReagentSupplierCodeFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Show Terminated filter chip
    if (filters.showTerminated !== undefined && filters.showTerminated !== null) {
      chips.push({
        key: 'showTerminated',
        label: `Show Terminated: ${filters.showTerminated === 'Y' ? 'Yes' : 'No'}`,
        value: filters.showTerminated
      });
    }

    // Effective Date filter chip
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${this.getPeriodSign(filters.effectiveDatePeriod)} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    // Termination Date filter chip
    if (filters.terminationDate && filters.terminationDatePeriod) {
      const formattedDate = this.formatDate(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${this.getPeriodSign(filters.terminationDatePeriod)} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: ValidReagentSupplierCodeFilterValue | null,
    chipKey: string
  ): ValidReagentSupplierCodeFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'showTerminated':
        updatedFilters.showTerminated = undefined;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = undefined;
        updatedFilters.effectiveDatePeriod = undefined;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = undefined;
        updatedFilters.terminationDatePeriod = undefined;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: ValidReagentSupplierCodeFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      (filters.showTerminated !== undefined && filters.showTerminated !== null) ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }
}
