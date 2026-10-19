import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DaylightSavingsFilterValue } from '../models/daylight-savings.model';

export class DaylightSavingsFilterChipsUtils {
  static convertFiltersToChips(filters: DaylightSavingsFilterValue | null): FilterChip[] {
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

    if (filters.chapterName) {
      chips.push({
        key: 'chapterName',
        label: `Chapter Name: ${filters.chapterName}`,
        value: filters.chapterName
      });
    }

    if (filters.timeZone) {
      chips.push({
        key: 'timeZone',
        label: `Time Zone: ${filters.timeZone}`,
        value: filters.timeZone
      });
    }

    if (filters.dstOffSet !== null && filters.dstOffSet !== undefined) {
      chips.push({
        key: 'dstOffSet',
        label: `DST Offset: ${filters.dstOffSet}`,
        value: filters.dstOffSet
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: DaylightSavingsFilterValue | null,
    chipKey: string
  ): DaylightSavingsFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'chapterId':
        updatedFilters.chapterId = null;
        break;
      case 'chapterName':
        updatedFilters.chapterName = null;
        break;
      case 'timeZone':
        updatedFilters.timeZone = null;
        break;
      case 'dstOffSet':
        updatedFilters.dstOffSet = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: DaylightSavingsFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.chapterId ||
      filters.chapterName ||
      filters.timeZone ||
      (filters.dstOffSet !== null && filters.dstOffSet !== undefined)
    );
  }
}
