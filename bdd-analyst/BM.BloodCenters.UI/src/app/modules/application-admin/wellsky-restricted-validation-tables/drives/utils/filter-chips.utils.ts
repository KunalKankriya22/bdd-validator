import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DrivesFilterValue } from '../models/drives.model';
import moment from 'moment';

export class DrivesFilterChipsUtils {
  /**
   * Format date for display in filter chips
   */
  private static formatDateForChip(date: Date | null): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  /**
   * Map period value to display text
   */
  private static mapPeriodToDisplay(period: string): string {
    switch (period) {
      case 'After':
        return 'After';
      case 'Before':
        return 'Before';
      case 'On':
        return 'On';
      default:
        return period;
    }
  }

  static convertFiltersToChips(filters: DrivesFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.type) {
      chips.push({
        key: 'type',
        label: `Type: ${filters.type}`,
        value: filters.type
      });
    }

    if (filters.drive) {
      chips.push({
        key: 'drive',
        label: `Drive: ${filters.drive}`,
        value: filters.drive
      });
    }

    if (filters.siteId) {
      chips.push({
        key: 'siteId',
        label: `Site ID: ${filters.siteId}`,
        value: filters.siteId
      });
    }

    if (filters.period && filters.scheduledDate) {
      const periodDisplay = this.mapPeriodToDisplay(filters.period);
      const dateDisplay = this.formatDateForChip(filters.scheduledDate);
      chips.push({
        key: 'scheduledDate',
        label: `Scheduled Date ${periodDisplay === 'After' ? '≥' : periodDisplay === 'Before' ? '≤' : '='} ${dateDisplay}`,
        value: `${filters.period}:${dateDisplay}`
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: DrivesFilterValue | null,
    chipKey: string
  ): DrivesFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'type':
        updatedFilters.type = null;
        break;
      case 'drive':
        updatedFilters.drive = null;
        break;
      case 'siteId':
        updatedFilters.siteId = null;
        break;
      case 'scheduledDate':
        updatedFilters.period = null;
        updatedFilters.scheduledDate = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: DrivesFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.type ||
      filters.drive ||
      filters.siteId ||
      (filters.period && filters.scheduledDate)
    );
  }
}
