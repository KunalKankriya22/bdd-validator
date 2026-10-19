import { FilterChip } from "@shared/components/filter-chips/filter-chips";

/**
 * Filter value interface for Add Functions
 */
export interface AddFunctionsFilterValue {
  functionType: string | null;
  scope: string | null;
}

/**
 * Utility class for converting Add Functions filter values to filter chips
 */
export class AddFunctionsFilterChipsUtils {

  /**
   * Convert AddFunctionsFilterValue to FilterChip array
   * @param filters - The filter values from the filter panel
   * @returns Array of FilterChip objects
   */
  static convertFiltersToChips(
    filters: AddFunctionsFilterValue | null
  ): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Function Type filter
    if (filters.functionType) {
      chips.push({
        key: 'functionType',
        label: `Function Type: ${filters.functionType}`,
        value: filters.functionType,
        removable: true
      });
    }

    // Scope filter
    if (filters.scope) {
      chips.push({
        key: 'scope',
        label: `Scope: ${filters.scope}`,
        value: filters.scope,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter from filter values
   * @param filters - Current filter values
   * @param chipKey - The key of the chip to remove
   * @returns Updated filter values with the specified filter removed
   */
  static removeFilterByChipKey(
    filters: AddFunctionsFilterValue | null,
    chipKey: string
  ): AddFunctionsFilterValue {
    if (!filters) {
      return this.getEmptyFilters();
    }

    const updated = { ...filters };

    switch (chipKey) {
      case 'functionType':
        updated.functionType = null;
        break;
      case 'scope':
        updated.scope = null;
        break;
    }

    return updated;
  }

  /**
   * Check if filters object has any active filters
   * @param filters - Filter values to check
   * @returns true if any filter is active
   */
  static hasActiveFilters(filters: AddFunctionsFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return Object.values(filters).some(value => value !== null && value !== undefined);
  }

  /**
   * Get empty filters object
   * @returns Empty AddFunctionsFilterValue
   */
  static getEmptyFilters(): AddFunctionsFilterValue {
    return {
      functionType: null,
      scope: null
    };
  }
}
