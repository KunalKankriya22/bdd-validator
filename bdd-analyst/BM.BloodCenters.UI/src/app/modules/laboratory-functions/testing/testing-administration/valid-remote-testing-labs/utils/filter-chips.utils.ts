import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidRemoteTestingLabFilterValue } from '../models/valid-remote-testing-labs.model';

export class ValidRemoteTestingLabsFilterChipsUtils {
  private static formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = d
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  static convertFiltersToChips(
    filters: ValidRemoteTestingLabFilterValue | null
  ): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      const symbol = filters.effectiveDatePeriod.toUpperCase() === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${this.formatDate(filters.effectiveDate)}`,
        value: {
          period: filters.effectiveDatePeriod,
          date: filters.effectiveDate,
        },
      });
    }

    if (filters.terminationDatePeriod && filters.terminationDate) {
      const symbol = filters.terminationDatePeriod.toUpperCase() === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${this.formatDate(filters.terminationDate)}`,
        value: {
          period: filters.terminationDatePeriod,
          date: filters.terminationDate,
        },
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ValidRemoteTestingLabFilterValue | null,
    chipKey: string
  ): ValidRemoteTestingLabFilterValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (chipKey) {
      case 'effectiveDate':
        updated.effectiveDatePeriod = null;
        updated.effectiveDate = null;
        break;
      case 'terminationDate':
        updated.terminationDatePeriod = null;
        updated.terminationDate = null;
        break;
    }

    return this.hasActiveFilters(updated) ? updated : null;
  }

  static hasActiveFilters(
    filters: ValidRemoteTestingLabFilterValue | null
  ): boolean {
    if (!filters) return false;
    return !!(
      (filters.effectiveDatePeriod && filters.effectiveDate) ||
      (filters.terminationDatePeriod && filters.terminationDate)
    );
  }
}
