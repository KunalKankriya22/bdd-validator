import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ResourceFilter } from '../filter/resource-filter';
import moment from 'moment';

export class ResourceFilterChipsUtils {
  static convertFiltersToChips(filters: ResourceFilter | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      const formattedDate = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
      const operator = filters.effectiveDatePeriod === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${formattedDate}`,
        value: formattedDate
      });
    }

    if (filters.terminationDatePeriod && filters.terminationDate) {
      const formattedDate = moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase();
      const operator = filters.terminationDatePeriod === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${formattedDate}`,
        value: formattedDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ResourceFilter | null,
    chipKey: string
  ): ResourceFilter | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'effectiveDate':
        updatedFilters.effectiveDatePeriod = null;
        updatedFilters.effectiveDate = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDatePeriod = null;
        updatedFilters.terminationDate = null;
        break;
    }

    const hasAnyFilter = Object.values(updatedFilters).some(value => value !== null);
    return hasAnyFilter ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ResourceFilter | null): boolean {
    if (!filters) {
      return false;
    }

    return (
      !!(filters.effectiveDatePeriod && filters.effectiveDate) ||
      !!(filters.terminationDatePeriod && filters.terminationDate)
    );
  }
}
