import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { GroupSitesFilterValue } from '../models/group-sites.model';

export class GroupSitesFilterChipsUtils {
  static convertFiltersToChips(filters: GroupSitesFilterValue | null): FilterChip[] {
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

    return chips;
  }

  static removeFilterByChipKey(
    filters: GroupSitesFilterValue | null,
    chipKey: string
  ): GroupSitesFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'chapterId':
        updatedFilters.chapterId = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: GroupSitesFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(filters.chapterId);
  }
}
