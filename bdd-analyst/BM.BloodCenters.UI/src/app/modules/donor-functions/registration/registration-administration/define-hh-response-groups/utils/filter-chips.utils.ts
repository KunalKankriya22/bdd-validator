import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HHResponseFilterValue } from '../models/hh-response-groups.model';

/**
 * Utility class for managing filter chips in HH Response Groups
 * Converts filter values to chips and handles chip removal
 */
export class HHResponseFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   * @param filters - Current filter values
   * @returns Array of filter chips
   */
  static convertFiltersToChips(filters: HHResponseFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Question Code filter chip
    if (filters.questionCode) {
      chips.push({
        key: 'questionCode',
        label: 'Question Code',
        value: filters.questionCode
      });
    }

    // Response Code filter chip
    if (filters.responseCode) {
      chips.push({
        key: 'responseCode',
        label: 'Response Code',
        value: filters.responseCode
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   * @param filters - Current filter values
   * @param chipKey - Key of the chip to remove
   * @returns Updated filter values with the specified filter removed
   */
  static removeFilterByChipKey(
    filters: HHResponseFilterValue | null,
    chipKey: string
  ): HHResponseFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'questionCode':
        delete updatedFilters.questionCode;
        break;
      case 'responseCode':
        delete updatedFilters.responseCode;
        break;
    }

    // Return null if no filters remain
    const hasFilters = Object.keys(updatedFilters).some(
      key => updatedFilters[key as keyof HHResponseFilterValue] !== undefined
    );

    return hasFilters ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   * @param filters - Current filter values
   * @returns True if any filters are active
   */
  static hasActiveFilters(filters: HHResponseFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(filters.questionCode || filters.responseCode);
  }

  /**
   * Clear all filters
   * @returns Null (no active filters)
   */
  static clearAllFilters(): null {
    return null;
  }
}
