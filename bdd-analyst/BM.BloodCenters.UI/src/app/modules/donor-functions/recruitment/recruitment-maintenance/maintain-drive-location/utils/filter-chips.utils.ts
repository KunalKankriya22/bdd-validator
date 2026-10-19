import { DriveLocationFilterFormValue, FilterChip } from '../models/maintain-drive-location.model';

export class MaintainDriveLocationFilterChipsUtils {
  static convertFiltersToChips(filters: DriveLocationFilterFormValue): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.effDate && filters.effDatePeriod) {
      chips.push({
        key: 'effDate',
        label: `Effective Date ${filters.effDatePeriod === 'AFTER' ? '≥' : '≤'} ${filters.effDate}`,
        value: `${filters.effDatePeriod}:${filters.effDate}`,
        removable: true
      });
    }

    if (filters.termDate && filters.termDatePeriod) {
      chips.push({
        key: 'termDate',
        label: `Termination Date ${filters.termDatePeriod === 'AFTER' ? '≥' : '≤'} ${filters.termDate}`,
        value: `${filters.termDatePeriod}:${filters.termDate}`,
        removable: true
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: DriveLocationFilterFormValue,
    key: string
  ): DriveLocationFilterFormValue {
    const updated = { ...filters };

    switch (key) {
      case 'effDate':
        updated.effDate = null;
        updated.effDatePeriod = null;
        break;
      case 'termDate':
        updated.termDate = null;
        updated.termDatePeriod = null;
        break;
    }

    return updated;
  }

  static hasActiveFilters(filters: DriveLocationFilterFormValue | null): boolean {
    if (!filters) return false;
    return !!(
      filters.effDate ||
      filters.termDate
    );
  }
}
