import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineMaxDonationsFilterFormValue } from '../define-max-donations-filter-panel/define-max-donations-filter-panel';

export class DefineMaxDonationsFilterChipsUtils {
  /**
   * Format date to display string (DD-MMM-YYYY format)
   */
  private static formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Convert period type to operator symbol
   */
  private static getPeriodOperator(periodType: string | null): string {
    if (periodType === 'After') return '≥';
    if (periodType === 'Before') return '≤';
    return periodType || '';
  }

  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: DefineMaxDonationsFilterFormValue | null): FilterChip[] {
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

    if (filters.effectiveDate && filters.periodType1) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const operator = this.getPeriodOperator(filters.periodType1);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.periodType2) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const operator = this.getPeriodOperator(filters.periodType2);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: DefineMaxDonationsFilterFormValue | null,
    chipKey: string
  ): DefineMaxDonationsFilterFormValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'donationType':
        updatedFilters.donationType = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.periodType1 = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.periodType2 = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: DefineMaxDonationsFilterFormValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.donationType ||
      (filters.effectiveDate && filters.periodType1) ||
      (filters.terminationDate && filters.periodType2)
    );
  }
}
