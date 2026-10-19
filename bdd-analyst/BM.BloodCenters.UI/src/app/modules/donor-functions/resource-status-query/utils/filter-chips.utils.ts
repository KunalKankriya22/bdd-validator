import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ResourceStatusQueryFilterValue } from '../models/resource-status-query.model';

export class ResourceStatusQueryFilterChipsUtils {

  static convertFiltersToChips(filters: ResourceStatusQueryFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.criticalInd) {
      const displayLabel = filters.criticalInd === 'Y' ? 'Yes' : 'No';
      chips.push({
        key: 'criticalInd',
        label: `Critical: ${displayLabel}`,
        value: filters.criticalInd
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ResourceStatusQueryFilterValue | null,
    chipKey: string
  ): ResourceStatusQueryFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'criticalInd':
        updatedFilters.criticalInd = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ResourceStatusQueryFilterValue | null): boolean {
    if (!filters) {
      return false;
    }
    return !!filters.criticalInd;
  }
}
