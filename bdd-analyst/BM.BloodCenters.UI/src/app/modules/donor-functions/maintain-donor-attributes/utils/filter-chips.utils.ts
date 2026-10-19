import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AttributeFilters } from '../models/maintain-donor-attributes.models';
import moment from 'moment';

export class AttributeFilterChipsUtils {
  private static getPeriodSign(period: string): string {
    switch (period) {
      case 'after': return '≥';
      case 'before': return '≤';
      default: return period;
    }
  }

  static convertFiltersToChips(filters: AttributeFilters | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.showTerminated) {
      chips.push({
        key: 'showTerminated',
        label: 'Show Terminated',
        value: true,
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
    filters: AttributeFilters | null,
    chipKey: string,
  ): AttributeFilters | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (chipKey) {
      case 'showTerminated':
        updated.showTerminated = undefined;
        break;
      case 'effDate':
        updated.effDate = undefined;
        updated.effDatePeriod = undefined;
        break;
      case 'termDate':
        updated.termDate = undefined;
        updated.termDatePeriod = undefined;
        break;
    }

    return this.hasActiveFilters(updated) ? updated : null;
  }

  static hasActiveFilters(filters: AttributeFilters | null): boolean {
    if (!filters) return false;
    return !!(
      filters.showTerminated ||
      filters.effDate ||
      filters.termDate
    );
  }
}
