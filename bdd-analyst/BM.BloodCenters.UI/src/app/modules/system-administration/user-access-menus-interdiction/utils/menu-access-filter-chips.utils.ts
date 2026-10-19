import { FilterChip } from '../../../../shared/components/filter-chips/filter-chips';
import { MenuAccessFilterValue } from '../models/user-access-filters.model';

export class MenuAccessFilterChipsUtils {
  static convertFiltersToChips(filters: MenuAccessFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.menuTitle) {
      chips.push({
        key: 'menuTitle',
        label: `Menu Title: ${filters.menuTitle}`,
        value: filters.menuTitle
      });
    }

    if (filters.program) {
      chips.push({
        key: 'program',
        label: `Program: ${filters.program}`,
        value: filters.program
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
    filters: MenuAccessFilterValue | null,
    chipKey: string
  ): MenuAccessFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'menuTitle':
        updatedFilters.menuTitle = null;
        break;
      case 'program':
        updatedFilters.program = null;
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

  static hasActiveFilters(filters: MenuAccessFilterValue | null): boolean {
    if (!filters) return false;
    return !!(filters.menuTitle || filters.program || filters.effectiveDate || filters.terminationDate);
  }

  private static formatDate(date: string | Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
