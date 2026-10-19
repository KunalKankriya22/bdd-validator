import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ChapterFilterValue } from '../chapter-filter-panel/chapter-filter-panel';
import moment from 'moment';

export class ChapterFilterChipsUtils {
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
      case 'AFTER':
        return 'After';
      case 'BEFORE':
        return 'Before';
      default:
        return period;
    }
  }

  static convertFiltersToChips(filters: ChapterFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.effectivePeriod && filters.effectiveDate) {
      const periodDisplay = this.mapPeriodToDisplay(filters.effectivePeriod);
      const dateDisplay = this.formatDateForChip(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${periodDisplay === 'After' ? '≥' : '≤'} ${dateDisplay}`,
        value: `${filters.effectivePeriod}:${dateDisplay}`
      });
    }

    if (filters.terminationPeriod && filters.terminationDate) {
      const periodDisplay = this.mapPeriodToDisplay(filters.terminationPeriod);
      const dateDisplay = this.formatDateForChip(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${periodDisplay === 'After' ? '≥' : '≤'} ${dateDisplay}`,
        value: `${filters.terminationPeriod}:${dateDisplay}`
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ChapterFilterValue | null,
    chipKey: string
  ): ChapterFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'effectiveDate':
        updatedFilters.effectivePeriod = null;
        updatedFilters.effectiveDate = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationPeriod = null;
        updatedFilters.terminationDate = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ChapterFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      (filters.effectivePeriod && filters.effectiveDate) ||
      (filters.terminationPeriod && filters.terminationDate)
    );
  }
}
