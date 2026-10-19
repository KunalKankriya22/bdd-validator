import moment from 'moment';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HlaGradingFilterValue } from '../models/hla-grading.model';

export class HlaGradingFilterChipsUtils {
  static convertFiltersToChips(filters: HlaGradingFilterValue | null): FilterChip[] {
    if (!filters) return [];
    const chips: FilterChip[] = [];

    if (filters.effectiveDate && filters.effectivePeriod) {
      const formattedDate = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
      const symbol = filters.effectivePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationPeriod) {
      const formattedDate = moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase();
      const symbol = filters.terminationPeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: HlaGradingFilterValue | null,
    chipKey: string
  ): HlaGradingFilterValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    if (chipKey === 'effectiveDate') {
      delete updated.effectivePeriod;
      delete updated.effectiveDate;
    } else if (chipKey === 'terminationDate') {
      delete updated.terminationPeriod;
      delete updated.terminationDate;
    }

    if (!this.hasActiveFilters(updated)) return null;
    return updated;
  }

  static hasActiveFilters(filters: HlaGradingFilterValue | null | undefined): boolean {
    if (!filters) return false;
    return !!(filters.effectiveDate || filters.terminationDate);
  }
}
