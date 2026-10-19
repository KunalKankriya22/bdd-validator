import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { GroupInterdictionFilterValue } from '../models/group-interdiction.model';

export class FilterChipsUtils {
  static convertFiltersToChips(
    filters: GroupInterdictionFilterValue | null
  ): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.interType) {
      chips.push({
        key: 'interType',
        label: `Type: ${filters.interType}`,
        value: filters.interType
      });
    }

    if (filters.interCode) {
      chips.push({
        key: 'interCode',
        label: `Code: ${filters.interCode}`,
        value: filters.interCode
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: GroupInterdictionFilterValue | null,
    chipKey: string
  ): GroupInterdictionFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'interType':
        delete updatedFilters.interType;
        break;
      case 'interCode':
        delete updatedFilters.interCode;
        break;
    }

    return Object.keys(updatedFilters).length > 0 ? updatedFilters : null;
  }

  static hasActiveFilters(filters: GroupInterdictionFilterValue | null): boolean {
    if (!filters) return false;
    return !!(filters.interType || filters.interCode);
  }
}
