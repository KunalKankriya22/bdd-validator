import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidFacilityIdentifiersFilterValue } from '../models/valid-facility-identifiers.model';

export class ValidFacilityIdentifiersFilterChipsUtils {
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
  static convertFiltersToChips(filters: ValidFacilityIdentifiersFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.chapterId) {
      chips.push({
        key: 'chapterId',
        label: `Chapter ID: ${filters.chapterId}`,
        value: filters.chapterId
      });
    }

    if (filters.effectiveDate && filters.effectivePeriod) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${this.getPeriodSign(filters.effectivePeriod)} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationPeriod) {
      const formattedDate = this.formatDate(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${this.getPeriodSign(filters.terminationPeriod)} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: ValidFacilityIdentifiersFilterValue | null,
    chipKey: string
  ): ValidFacilityIdentifiersFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'chapterId':
        updatedFilters.chapterId = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectivePeriod = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationPeriod = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: ValidFacilityIdentifiersFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.chapterId ||
      (filters.effectiveDate && filters.effectivePeriod) ||
      (filters.terminationDate && filters.terminationPeriod)
    );
  }
}
