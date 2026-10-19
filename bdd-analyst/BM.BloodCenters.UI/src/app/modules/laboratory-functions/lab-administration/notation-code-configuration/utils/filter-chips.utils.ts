import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { NotationCodeFilterValue, NOTATION_TYPE_DISPLAY } from '../models/notation-code.model';

/**
 * Utility class for managing filter chips in the Notation Code Configuration component
 * Converts filter values to visual chips and handles chip removal
 */
export class NotationCodeFilterChipsUtils {
  /**
   * Convert filter values to FilterChip array for display
   * @param filters Current filter values from filter panel
   * @returns Array of FilterChip objects for rendering
   */
  static convertFiltersToChips(filters: NotationCodeFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Notation Code filter
    if (filters.notationCode) {
      chips.push({
        key: 'notationCode',
        label: `Notation Code: ${filters.notationCode}`,
        value: filters.notationCode
      });
    }

    // Notation Type filter
    if (filters.notationType) {
      const displayValue = NOTATION_TYPE_DISPLAY[filters.notationType] || filters.notationType;
      chips.push({
        key: 'notationType',
        label: `Type: ${displayValue}`,
        value: filters.notationType
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key and return updated filter object
   * @param currentFilters Current filter values
   * @param chipKey Key of the chip to remove
   * @returns Updated filter object with specified filter removed
   */
  static removeFilterByChipKey(
    currentFilters: NotationCodeFilterValue | null,
    chipKey: string
  ): NotationCodeFilterValue | null {
    if (!currentFilters) {
      return null;
    }

    const updatedFilters: NotationCodeFilterValue = { ...currentFilters };

    switch (chipKey) {
      case 'notationCode':
        delete updatedFilters.notationCode;
        break;

      case 'notationType':
        delete updatedFilters.notationType;
        break;
    }

    // Return null if no filters remain
    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   * @param filters Filter values to check
   * @returns True if at least one filter is active
   */
  static hasActiveFilters(filters: NotationCodeFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.notationCode ||
      filters.notationType
    );
  }
}
