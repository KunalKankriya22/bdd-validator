import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineClassFilter } from '../filter/define-class-filter';
import moment from 'moment';

export class DefineAccessClassFilterChipsUtils {
  static convertFiltersToChips(filters: DefineClassFilter | null): FilterChip[] {
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

    if (filters.code) {
      chips.push({
        key: 'code',
        label: `Code: ${filters.code}`,
        value: filters.code
      });
    }

    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      const formattedDate = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
      const operator = filters.effectiveDatePeriod === 'AFTER' ? '\u2265' : '\u2264';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${formattedDate}`,
        value: formattedDate
      });
    }

    if (filters.terminationDatePeriod && filters.terminationDate) {
      const formattedDate = moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase();
      const operator = filters.terminationDatePeriod === 'AFTER' ? '\u2265' : '\u2264';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${formattedDate}`,
        value: formattedDate
      });
    }

    if (filters.status) {
      chips.push({
        key: 'status',
        label: `Status: ${filters.status}`,
        value: filters.status
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: DefineClassFilter | null,
    chipKey: string
  ): DefineClassFilter | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'type':
        updatedFilters.type = null;
        break;
      case 'code':
        updatedFilters.code = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDatePeriod = null;
        updatedFilters.effectiveDate = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDatePeriod = null;
        updatedFilters.terminationDate = null;
        break;
      case 'status':
        updatedFilters.status = null;
        break;
    }

    const hasAnyFilter = Object.values(updatedFilters).some(value => value !== null);
    return hasAnyFilter ? updatedFilters : null;
  }

  static hasActiveFilters(filters: DefineClassFilter | null): boolean {
    if (!filters) {
      return false;
    }

    return (
      !!filters.type ||
      !!filters.code ||
      !!(filters.effectiveDatePeriod && filters.effectiveDate) ||
      !!(filters.terminationDatePeriod && filters.terminationDate) ||
      !!filters.status
    );
  }
}
