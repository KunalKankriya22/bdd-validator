import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HlaCrossReactiveGroupFilterValue } from '../models/hla-cross-reactive-groups.model';
import moment from 'moment';

/**
 * Utility class for converting HLA Cross-Reactive Groups filters to filter chips
 * and vice versa. Follows the pattern from Daylight Savings filter chips utility.
 */
export class HlaCrossReactiveGroupsFilterChipsUtils {

  /**
   * Map period text to symbol sign
   * @param period Period value (AFTER/BEFORE)
   * @returns Symbol representation
   */
  private static getPeriodSign(period: string): string {
    switch (period) {
      case 'AFTER':
      case 'After':
      case 'On or After': return '≥';
      case 'BEFORE':
      case 'Before':
      case 'On or Before': return '≤';
      default: return period;
    }
  }

  /**
   * Convert filter values to filter chips for display
   * @param filters Current filter values
   * @returns Array of filter chips
   */
  static convertFiltersToChips(filters: HlaCrossReactiveGroupFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Reference filter
    if (filters.hlaStandard) {
      chips.push({
        key: 'hlaStandard',
        label: `Reference: ${filters.hlaStandard}`,
        value: filters.hlaStandard
      });
    }

    // Effective Date filter (Period + Date)
    if (filters.effectivePeriod && filters.effectiveDate) {
      const formattedDate = this.formatDateForChip(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${this.getPeriodSign(filters.effectivePeriod)} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    // Termination Date filter (Period + Date)
    if (filters.terminationPeriod && filters.terminationDate) {
      const formattedDate = this.formatDateForChip(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${this.getPeriodSign(filters.terminationPeriod)} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   * @param filters Current filter values
   * @param chipKey Key of the chip to remove
   * @returns Updated filter values (null if no filters remain)
   */
  static removeFilterByChipKey(
    filters: HlaCrossReactiveGroupFilterValue | null,
    chipKey: string
  ): HlaCrossReactiveGroupFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'hlaStandard':
        delete updatedFilters.hlaStandard;
        break;
      case 'effectiveDate':
        delete updatedFilters.effectiveDate;
        delete updatedFilters.effectivePeriod;
        break;
      case 'terminationDate':
        delete updatedFilters.terminationDate;
        delete updatedFilters.terminationPeriod;
        break;
      default:
        break;
    }

    // Return null if no filters remain
    const hasFilters = Object.keys(updatedFilters).some(
      key => updatedFilters[key as keyof HlaCrossReactiveGroupFilterValue] !== undefined
    );

    return hasFilters ? updatedFilters : null;
  }

  /**
   * Check if there are active filters
   * @param filters Current filter values
   * @returns True if there are active filters
   */
  static hasActiveFilters(filters: HlaCrossReactiveGroupFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.hlaStandard ||
      (filters.effectivePeriod && filters.effectiveDate) ||
      (filters.terminationPeriod && filters.terminationDate)
    );
  }

  /**
   * Format date for chip display (DD-MON-YYYY format)
   * @param date Date string to format
   * @returns Formatted date string
   */
  private static formatDateForChip(date: string): string {
    const momentDate = moment(date);
    if (!momentDate.isValid()) {
      return date;
    }
    return momentDate.format('DD-MMM-YYYY').toUpperCase();
  }
}
