import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { OverrideRuleFilterValue } from '../models/override-rules.model';
import moment from 'moment';

export class OverrideRulesFilterChipsUtils {
  static convertFiltersToChips(filters: OverrideRuleFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.overrideFlag) {
      const displayValue = filters.overrideFlag === 'Y' ? 'Yes' : 'No';
      chips.push({
        key: 'overrideFlag',
        label: `Override Flag: ${displayValue}`,
        value: filters.overrideFlag,
        removable: true
      });
    }

    if (filters.interdictionCode) {
      chips.push({
        key: 'interdictionCode',
        label: `Interdiction: ${filters.interdictionCode}`,
        value: filters.interdictionCode,
        removable: true
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const operator = filters.effectiveDatePeriod.toUpperCase() === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${formattedDate}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const operator = filters.terminationDatePeriod.toUpperCase() === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${formattedDate}`,
        value: filters.terminationDate,
        removable: true
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: OverrideRuleFilterValue | null,
    chipKey: string
  ): OverrideRuleFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'overrideFlag':
        updatedFilters.overrideFlag = null;
        break;
      case 'interdictionCode':
        updatedFilters.interdictionCode = null;
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

  static hasActiveFilters(filters: OverrideRuleFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.overrideFlag ||
      filters.interdictionCode ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }

  private static formatDate(date: Date | string | any): string {
    const m = moment.isMoment(date) ? date : moment(date);
    return m.format('DD-MMM-YYYY').toUpperCase();
  }
}
