import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidLotFilterValue } from '../models/lot-details-for-bags.model';
import moment from 'moment';

export class LotFilterChipsUtils {
  /**
   * Map period text to symbol sign
   */
  private static getPeriodSign(period: string): string {
    switch (period) {
      case 'after': return '≥';
      case 'before': return '≤';
      default: return period;
    }
  }

  static convertFiltersToChips(filters: ValidLotFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.catalogNumber) {
      chips.push({
        key: 'catalogNumber',
        label: `Catalog: ${filters.catalogNumber}`,
        value: filters.catalogNumber,
      });
    }

    if (filters.showExpired !== undefined && filters.showExpired !== null) {
      chips.push({
        key: 'showExpired',
        label: `Show Expired: ${filters.showExpired ? 'Yes' : 'No'}`,
        value: filters.showExpired,
      });
    }

    if (filters.effDate && filters.effDatePeriod) {
      const formattedDate = moment(filters.effDate).format('DD-MMM-YYYY').toUpperCase();
      chips.push({
        key: 'effDate',
        label: `Effective Date ${this.getPeriodSign(filters.effDatePeriod)} ${formattedDate}`,
        value: filters.effDate,
      });
    }

    if (filters.termDate && filters.termDatePeriod) {
      const formattedDate = moment(filters.termDate).format('DD-MMM-YYYY').toUpperCase();
      chips.push({
        key: 'termDate',
        label: `Termination Date ${this.getPeriodSign(filters.termDatePeriod)} ${formattedDate}`,
        value: filters.termDate,
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ValidLotFilterValue | null,
    chipKey: string,
  ): ValidLotFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'catalogNumber':
        updatedFilters.catalogNumber = undefined;
        break;
      case 'showExpired':
        updatedFilters.showExpired = undefined;
        break;
      case 'effDate':
        updatedFilters.effDate = undefined;
        updatedFilters.effDatePeriod = undefined;
        break;
      case 'termDate':
        updatedFilters.termDate = undefined;
        updatedFilters.termDatePeriod = undefined;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ValidLotFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.catalogNumber ||
      (filters.showExpired !== undefined && filters.showExpired !== null) ||
      filters.effDate ||
      filters.termDate
    );
  }
}
