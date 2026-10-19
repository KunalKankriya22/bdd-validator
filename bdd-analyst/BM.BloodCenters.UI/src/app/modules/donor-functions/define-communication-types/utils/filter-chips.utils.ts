import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { CommTypeFilter } from '../services/communication-types.service';

export class CommTypesFilterChipsUtils {
  private static formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  static convertFiltersToChips(filters: CommTypeFilter | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const symbol = filters.effectiveDatePeriod === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate,
        removable: true,
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const symbol = filters.terminationDatePeriod === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate,
        removable: true,
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: CommTypeFilter | null,
    chipKey: string
  ): CommTypeFilter | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'effectiveDate':
        updatedFilters.effectiveDate = undefined;
        updatedFilters.effectiveDatePeriod = undefined;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = undefined;
        updatedFilters.terminationDatePeriod = undefined;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: CommTypeFilter | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      (filters.effectiveDate && filters.effectiveDatePeriod) ||
      (filters.terminationDate && filters.terminationDatePeriod)
    );
  }
}
