import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ExternalBcDataTranslateFilterFormValue } from '../filter-panel/filter-panel';

export class ExternalBcDataTranslateFilterChipsUtils {
  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: ExternalBcDataTranslateFilterFormValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.sourceId) {
      chips.push({
        key: 'sourceId',
        label: `Source Code Type: ${filters.sourceId}`,
        value: filters.sourceId
      });
    }

    if (filters.targetId) {
      chips.push({
        key: 'targetId',
        label: `Target Code Type: ${filters.targetId}`,
        value: filters.targetId
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: ExternalBcDataTranslateFilterFormValue | null,
    chipKey: string
  ): ExternalBcDataTranslateFilterFormValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'sourceId':
        updatedFilters.sourceId = null;
        break;
      case 'targetId':
        updatedFilters.targetId = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: ExternalBcDataTranslateFilterFormValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.sourceId ||
      filters.targetId
    );
  }
}
