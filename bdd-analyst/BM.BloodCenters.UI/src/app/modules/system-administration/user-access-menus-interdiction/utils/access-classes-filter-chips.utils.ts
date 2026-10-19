import { FilterChip } from '../../../../shared/components/filter-chips/filter-chips';
import { AccessClassesFilterValue } from '../models/user-access-filters.model';

export class AccessClassesFilterChipsUtils {
  static convertFiltersToChips(filters: AccessClassesFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.class) {
      chips.push({
        key: 'class',
        label: `Class: ${filters.class}`,
        value: filters.class
      });
    }

    if (filters.effectiveDate) {
      const period = filters.effectiveDatePeriod || 'After';
      const symbol = period === 'After' ? '≥' : '≤';
      const date = this.formatDate(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${date}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate) {
      const period = filters.terminationDatePeriod || 'Before';
      const symbol = period === 'After' ? '≥' : '≤';
      const date = this.formatDate(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${date}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: AccessClassesFilterValue | null,
    chipKey: string
  ): AccessClassesFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'class':
        updatedFilters.class = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectiveDatePeriod = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationDatePeriod = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: AccessClassesFilterValue | null): boolean {
    if (!filters) return false;
    return !!(filters.class || filters.effectiveDate || filters.terminationDate);
  }

  private static formatDate(date: string | Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
