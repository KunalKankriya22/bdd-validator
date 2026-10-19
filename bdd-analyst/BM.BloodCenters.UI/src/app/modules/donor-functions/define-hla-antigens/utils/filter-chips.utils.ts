import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HlaAntigenFilterValue } from '../models/hla-antigens.model';
import moment, { Moment } from 'moment';

export class HlaAntigenFilterChipsUtils {
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
  static convertFiltersToChips(filters: HlaAntigenFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Antigen filter chip
    if (filters.antigen) {
      chips.push({
        key: 'antigen',
        label: `Antigen: ${filters.antigen}`,
        value: filters.antigen
      });
    }

    // Associated Antigen filter chip
    if (filters.associatedAntigen) {
      chips.push({
        key: 'associatedAntigen',
        label: `Associated Antigen: ${filters.associatedAntigen}`,
        value: filters.associatedAntigen
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
    filters: HlaAntigenFilterValue | null,
    chipKey: string
  ): HlaAntigenFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'antigen':
        updatedFilters.antigen = null;
        break;
      case 'associatedAntigen':
        updatedFilters.associatedAntigen = null;
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
  static hasActiveFilters(filters: HlaAntigenFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.antigen ||
      filters.associatedAntigen ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }
}
