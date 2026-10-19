import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SpecialDonationFilterValue } from '../register-special-donation-request.models';
import moment from 'moment';

export class SpecialDonationFilterChipsUtils {

  private static formatDateForChip(date: string | null): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  private static statusLabel(code: string): string {
    return code === 'A' ? 'Active' : code === 'I' ? 'Inactive' : code;
  }

  static convertFiltersToChips(filters: SpecialDonationFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.status) {
      chips.push({
        key: 'status',
        label: `Status: ${this.statusLabel(filters.status)}`,
        value: filters.status,
      });
    }

    if (filters.shipTo) {
      chips.push({
        key: 'shipTo',
        label: `Ship To: ${filters.shipTo}`,
        value: filters.shipTo,
      });
    }

    if (filters.surgeryDatePeriod && filters.surgeryDate) {
      const op = filters.surgeryDatePeriod === 'after' ? '≥' : '≤';
      chips.push({
        key: 'surgeryDate',
        label: `Surgery Date ${op} ${this.formatDateForChip(filters.surgeryDate)}`,
        value: filters.surgeryDate,
      });
    }

    if (filters.neededByPeriod && filters.neededBy) {
      const op = filters.neededByPeriod === 'after' ? '≥' : '≤';
      chips.push({
        key: 'neededBy',
        label: `Needed By ${op} ${this.formatDateForChip(filters.neededBy)}`,
        value: filters.neededBy,
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: SpecialDonationFilterValue | null,
    chipKey: string,
  ): SpecialDonationFilterValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (chipKey) {
      case 'status':
        updated.status = null;
        break;
      case 'shipTo':
        updated.shipTo = null;
        break;
      case 'surgeryDate':
        updated.surgeryDate = null;
        updated.surgeryDatePeriod = null;
        break;
      case 'neededBy':
        updated.neededBy = null;
        updated.neededByPeriod = null;
        break;
    }

    return this.hasActiveFilters(updated) ? updated : null;
  }

  static hasActiveFilters(filters: SpecialDonationFilterValue | null): boolean {
    if (!filters) return false;
    return !!(
      filters.status ||
      filters.shipTo ||
      (filters.surgeryDatePeriod && filters.surgeryDate) ||
      (filters.neededByPeriod && filters.neededBy)
    );
  }
}
