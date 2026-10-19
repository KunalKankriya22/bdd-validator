import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SpecialProcessingFilterValue } from '../models/special-processing-master-codes.model';
import moment from 'moment';

export class SpecialProcessingFilterChipsUtils {
  static convertFiltersToChips(filters: SpecialProcessingFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.effDate) {
      chips.push({
        key: 'effDate',
        label: `Effective Date ${filters.effDatePeriod === 'after' ? '≥' : '≤'} ${moment(filters.effDate).format('DD-MMM-YYYY').toUpperCase()}`,
        value: filters.effDate,
      });
    }

    if (filters.termDate) {
      chips.push({
        key: 'termDate',
        label: `Termination Date ${filters.termDatePeriod === 'after' ? '≥' : '≤'} ${moment(filters.termDate).format('DD-MMM-YYYY').toUpperCase()}`,
        value: filters.termDate,
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: SpecialProcessingFilterValue | null,
    chipKey: string,
  ): SpecialProcessingFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
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

  static hasActiveFilters(filters: SpecialProcessingFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(filters.effDate || filters.termDate);
  }
}
