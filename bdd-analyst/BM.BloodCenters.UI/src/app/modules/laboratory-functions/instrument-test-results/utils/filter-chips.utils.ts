import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InstrumentResultFilter, ValidInstrumentTestScheduleFilter } from '../models/instrument-test-results.model';

export class InstrumentTestResultFilterChipsUtils {

  private static formatDate(date: Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }


  static convertFiltersToChips(filters: ValidInstrumentTestScheduleFilter | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const symbol = filters.effectiveDatePeriod === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${this.formatDate(filters.effectiveDate)}`,
        value: filters.effectiveDate,
        removable: true,
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const symbol = filters.terminationDatePeriod === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${this.formatDate(filters.terminationDate)}`,
        value: filters.terminationDate,
        removable: true,
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ValidInstrumentTestScheduleFilter | null,
    chipKey: string
  ): ValidInstrumentTestScheduleFilter {
    const updated: ValidInstrumentTestScheduleFilter = { ...(filters || {}) };

    switch (chipKey) {
      case 'effectiveDate':
        updated.effectiveDate       = null;
        updated.effectiveDatePeriod = null;
        break;
      case 'terminationDate':
        updated.terminationDate       = null;
        updated.terminationDatePeriod = null;
        break;
    }

    return updated;
  }

  static hasActiveFilters(filters: ValidInstrumentTestScheduleFilter | null): boolean {
    if (!filters) return false;
    return !!(
      (filters.effectiveDate && filters.effectiveDatePeriod) ||
      (filters.terminationDate && filters.terminationDatePeriod)
    );
  }

  static convertResultFiltersToChips(filters: InstrumentResultFilter | null): FilterChip[] {
    if (!filters) return [];
    const chips: FilterChip[] = [];

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const symbol = filters.effectiveDatePeriod === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${this.formatDate(filters.effectiveDate)}`,
        value: filters.effectiveDate,
        removable: true,
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const symbol = filters.terminationDatePeriod === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${this.formatDate(filters.terminationDate)}`,
        value: filters.terminationDate,
        removable: true,
      });
    }

    return chips;
  }

  static removeResultFilterByChipKey(
    filters: InstrumentResultFilter | null,
    chipKey: string
  ): InstrumentResultFilter {
    const updated: InstrumentResultFilter = { ...(filters || {}) };
    switch (chipKey) {
      case 'effectiveDate':
        updated.effectiveDate       = null;
        updated.effectiveDatePeriod = null;
        break;
      case 'terminationDate':
        updated.terminationDate       = null;
        updated.terminationDatePeriod = null;
        break;
    }
    return updated;
  }
}
