import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineDonationProceduresFilterFormValue } from '../define-donation-procedures-filter-panel/define-donation-procedures-filter-panel';

export class DefineDonationProceduresFilterChipsUtils {
  /**
   * Format date to display string
   */
  private static formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Map period text to symbol sign
   */
  private static getPeriodSign(period: string): string {
    switch (period) {
      case 'After':
      case 'On or After': return '≥';
      case 'Before':
      case 'On or Before': return '≤';
      default: return period;
    }
  }

  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: DefineDonationProceduresFilterFormValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.donationType) {
      chips.push({
        key: 'donationType',
        label: `Donation Type: ${filters.donationType}`,
        value: filters.donationType
      });
    }

    if (filters.procedureCode) {
      chips.push({
        key: 'procedureCode',
        label: `Procedure Code: ${filters.procedureCode}`,
        value: filters.procedureCode
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${this.getPeriodSign(filters.effectiveDatePeriod)} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

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
    filters: DefineDonationProceduresFilterFormValue | null,
    chipKey: string
  ): DefineDonationProceduresFilterFormValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'donationType':
        updatedFilters.donationType = null;
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

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: DefineDonationProceduresFilterFormValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.donationType ||
      filters.procedureCode ||
      (filters.effectiveDate && filters.effectiveDatePeriod) ||
      (filters.terminationDate && filters.terminationDatePeriod)
    );
  }
}
