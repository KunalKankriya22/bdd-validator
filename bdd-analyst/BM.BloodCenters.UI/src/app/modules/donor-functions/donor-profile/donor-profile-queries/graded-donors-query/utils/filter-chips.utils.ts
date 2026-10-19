import { FilterChip } from '@shared/components/filter-chips/filter-chips';

/**
 * Filter value interface for Graded Donors Query
 */
export interface GradedDonorsFilterValue {
  sex?: string | null;
  status?: string | null;
}

/**
 * Utility class for converting filter values to filter chips
 * and managing chip removal for Graded Donors Query
 */
export class GradedDonorsFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   *
   * @param filters Current filter values
   * @param tabType Type of tab ('donations' or 'donors')
   * @returns Array of filter chips
   */
  static convertFiltersToChips(
    filters: GradedDonorsFilterValue | null,
    tabType: 'donations' | 'donors'
  ): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Sex filter
    if (filters.sex && filters.sex !== 'All' && filters.sex.trim() !== '') {
      chips.push({
        key: 'sex',
        label: `Sex: ${this.formatSexForDisplay(filters.sex)}`,
        value: filters.sex
      });
    }

    // Status filter (different field for donations vs donors)
    if (filters.status && filters.status !== 'All' && filters.status.trim() !== '') {
      const statusLabel = tabType === 'donations' ? 'Status' : 'Merge Status';
      chips.push({
        key: 'status',
        label: `${statusLabel}: ${filters.status}`,
        value: filters.status
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key and return updated filter values
   *
   * @param filters Current filter values
   * @param chipKey Key of the chip to remove
   * @returns Updated filter values with the specified filter removed
   */
  static removeFilterByChipKey(
    filters: GradedDonorsFilterValue | null,
    chipKey: string
  ): GradedDonorsFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'sex':
        updatedFilters.sex = 'All';
        break;

      case 'status':
        updatedFilters.status = 'All';
        break;
    }

    // Return null if all filters are now 'All'
    if (this.isEmptyFilter(updatedFilters)) {
      return null;
    }

    return updatedFilters;
  }

  /**
   * Check if any filters are currently active
   *
   * @param filters Current filter values
   * @returns True if at least one filter is active
   */
  static hasActiveFilters(filters: GradedDonorsFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      (filters.sex && filters.sex !== 'All' && filters.sex.trim() !== '') ||
      (filters.status && filters.status !== 'All' && filters.status.trim() !== '')
    );
  }

  /**
   * Check if filter object has all default/empty values
   *
   * @param filters Filter values to check
   * @returns True if all filters are empty or 'All'
   */
  private static isEmptyFilter(filters: GradedDonorsFilterValue): boolean {
    return (
      (!filters.sex || filters.sex === 'All') &&
      (!filters.status || filters.status === 'All')
    );
  }

  /**
   * Format sex code (M/F) to full word (Male/Female) for display
   *
   * @param sex Sex code
   * @returns Formatted sex display value
   */
  private static formatSexForDisplay(sex: string): string {
    if (sex === 'M') return 'Male';
    if (sex === 'F') return 'Female';
    return sex;
  }
}
