import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { MormFilterValue } from '../models/morm.model';

export class MormFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: MormFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.testId) {
      chips.push({
        key: 'testId',
        label: 'Test ID',
        value: filters.testId
      });
    }

    if (filters.testType) {
      chips.push({
        key: 'testType',
        label: 'Test Type',
        value: filters.testType
      });
    }

    if (filters.testIntp) {
      chips.push({
        key: 'testIntp',
        label: 'Test Interpretation',
        value: filters.testIntp
      });
    }

    if (filters.includeInactive) {
      chips.push({
        key: 'includeInactive',
        label: 'Include Inactive',
        value: 'Yes'
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: MormFilterValue | null,
    chipKey: string
  ): MormFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'testId':
        delete updatedFilters.testId;
        break;
      case 'testType':
        delete updatedFilters.testType;
        break;
      case 'testIntp':
        delete updatedFilters.testIntp;
        break;
      case 'includeInactive':
        updatedFilters.includeInactive = false;
        break;
    }

    // Return null if no filters remain
    return MormFilterChipsUtils.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are currently applied
   */
  static hasActiveFilters(filters: MormFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.testId ||
      filters.testType ||
      filters.testIntp ||
      filters.includeInactive
    );
  }
}
