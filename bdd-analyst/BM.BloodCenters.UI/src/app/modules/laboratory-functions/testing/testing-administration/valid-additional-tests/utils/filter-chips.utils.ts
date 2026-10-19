import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidAdditionalTestFilterValue } from '../models/valid-additional-tests.model';
import moment from 'moment';

/**
 * Utility class for converting filter values to filter chips and vice versa
 */
export class ValidAdditionalTestFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: ValidAdditionalTestFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.testId) {
      chips.push({
        key: 'testId',
        label: `Test ID: ${filters.testId}`,
        value: filters.testId,
      });
    }

    if (filters.effDateFrom) {
      const formattedDate = this.formatDate(filters.effDateFrom);
      chips.push({
        key: 'effDateFrom',
        label: `Eff. Date From: ${formattedDate}`,
        value: filters.effDateFrom,
      });
    }

    if (filters.effDateTo) {
      const formattedDate = this.formatDate(filters.effDateTo);
      chips.push({
        key: 'effDateTo',
        label: `Eff. Date To: ${formattedDate}`,
        value: filters.effDateTo,
      });
    }

    return chips;
  }

  /**
   * Format date for chip display
   */
  private static formatDate(date: moment.Moment | string | null | undefined): string {
    if (!date) return '–';
    const m = moment.isMoment(date) ? date : moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '–';
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: ValidAdditionalTestFilterValue | null,
    chipKey: string
  ): ValidAdditionalTestFilterValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (chipKey) {
      case 'testId':
        delete updated.testId;
        break;
      case 'effDateFrom':
        delete updated.effDateFrom;
        break;
      case 'effDateTo':
        delete updated.effDateTo;
        break;
    }

    // Return null if no filters remain
    return Object.keys(updated).length === 0 ? null : updated;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: ValidAdditionalTestFilterValue | null): boolean {
    if (!filters) return false;
    return !!(filters.testId || filters.effDateFrom || filters.effDateTo);
  }
}
