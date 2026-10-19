import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineDonationTypesFilterFormValue } from '../define-donation-types-filter-panel/define-donation-types-filter-panel';
import moment from 'moment';

export class DefineDonationTypesFilterChipsUtils {
  /**
   * Format date to display string (DD-MMM-YYYY)
   */
  private static formatDate(date: Date | null): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  /**
   * Convert period type to symbol
   */
  private static getPeriodSymbol(periodType: string): string {
    return periodType === 'after' ? '≥' : '≤';
  }

  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: DefineDonationTypesFilterFormValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.donationTypeCode) {
      chips.push({
        key: 'donationTypeCode',
        label: `Donation Type Code: ${filters.donationTypeCode}`,
        value: filters.donationTypeCode
      });
    }

    if (filters.sequence !== null && filters.sequence !== undefined) {
      chips.push({
        key: 'sequence',
        label: `Sequence: ${filters.sequence}`,
        value: filters.sequence
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const symbol = this.getPeriodSymbol(filters.effectiveDatePeriod);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const symbol = this.getPeriodSymbol(filters.terminationDatePeriod);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: DefineDonationTypesFilterFormValue | null,
    chipKey: string
  ): DefineDonationTypesFilterFormValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'donationTypeCode':
        updatedFilters.donationTypeCode = null;
        break;
      case 'sequence':
        updatedFilters.sequence = null;
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

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: DefineDonationTypesFilterFormValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.donationTypeCode ||
      (filters.sequence !== null && filters.sequence !== undefined) ||
      (filters.effectiveDate && filters.effectiveDatePeriod) ||
      (filters.terminationDate && filters.terminationDatePeriod)
    );
  }
}
