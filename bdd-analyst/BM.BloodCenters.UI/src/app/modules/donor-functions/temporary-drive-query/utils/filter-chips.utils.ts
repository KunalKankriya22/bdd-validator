import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { TemporaryDriveFilterValue } from '../models/temporary-drive-query.model';

export class TemporaryDriveQueryFilterChipsUtils {

  static convertFiltersToChips(filters: TemporaryDriveFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.status) {
      const statusLabels: Record<string, string> = { 'U': 'Used', 'D': 'Deleted' };
      chips.push({
        key: 'status',
        label: `Status: ${statusLabels[filters.status] || filters.status}`,
        value: filters.status
      });
    }

    if (filters.recruiterName) {
      chips.push({
        key: 'recruiterName',
        label: `Recruiter: ${filters.recruiterName}`,
        value: filters.recruiterName
      });
    }

    if (filters.sponsorName) {
      chips.push({
        key: 'sponsorName',
        label: `Sponsor: ${filters.sponsorName}`,
        value: filters.sponsorName
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: TemporaryDriveFilterValue | null,
    chipKey: string
  ): TemporaryDriveFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'status':
        updatedFilters.status = null;
        break;
      case 'recruiterName':
        updatedFilters.recruiterName = null;
        break;
      case 'sponsorName':
        updatedFilters.sponsorName = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: TemporaryDriveFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.status ||
      filters.recruiterName ||
      filters.sponsorName
    );
  }
}
