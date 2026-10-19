import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { UserAccountFilter } from '../filter/user-account-filter/user-account-filter';
import moment from 'moment';

export class UserAccountFilterChipsUtils {
  /**
   * Format date for display in filter chips
   */
  private static formatDateForChip(date: Date | null): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  static convertFiltersToChips(filters: UserAccountFilter | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.effectiveDate) {
      const dateDisplay = this.formatDateForChip(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${filters.effectiveDatePeriod === 'AFTER' ? '≥' : '≤'} ${dateDisplay}`,
        value: `${filters.effectiveDatePeriod}:${dateDisplay}`
      });
    }

    if (filters.terminationDate) {
      const dateDisplay = this.formatDateForChip(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${filters.terminationDatePeriod === 'AFTER' ? '≥' : '≤'} ${dateDisplay}`,
        value: `${filters.terminationDatePeriod}:${dateDisplay}`
      });
    }

    if (filters.accountStatus) {
      const statusLabel = filters.accountStatus === 'ACTIVE' ? 'Unlocked' : 'Locked';
      chips.push({
        key: 'accountStatus',
        label: `Account Status: ${statusLabel}`,
        value: filters.accountStatus
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: UserAccountFilter | null,
    chipKey: string
  ): UserAccountFilter | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectiveDatePeriod = 'AFTER';
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationDatePeriod = 'BEFORE';
        break;
      case 'accountStatus':
        updatedFilters.accountStatus = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: UserAccountFilter | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(filters.effectiveDate || filters.terminationDate || filters.accountStatus);
  }
}
