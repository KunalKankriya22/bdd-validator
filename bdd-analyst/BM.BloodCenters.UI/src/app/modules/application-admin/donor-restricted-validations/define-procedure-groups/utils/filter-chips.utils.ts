import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineProcedureGroupsFilterValue } from '../models/define-procedure-groups.model';

export class ProcedureGroupsFilterChipsUtils {
  /**
   * Convert period type to operator symbol
   */
  private static getPeriodOperator(periodType: string | null): string {
    if (periodType === 'After') return '≥';
    if (periodType === 'Before') return '≤';
    return periodType || '';
  }

  static convertFiltersToChips(filters: DefineProcedureGroupsFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.procedureGroupCode) {
      chips.push({
        key: 'procedureGroupCode',
        label: `Procedure Group: ${filters.procedureGroupCode}`,
        value: filters.procedureGroupCode
      });
    }

    if (filters.donationCredits !== null && filters.donationCredits !== undefined) {
      chips.push({
        key: 'donationCredits',
        label: `Donation Credits: ${filters.donationCredits}`,
        value: filters.donationCredits.toString()
      });
    }

    if (filters.procedureCode) {
      chips.push({
        key: 'procedureCode',
        label: `Procedure Code: ${filters.procedureCode}`,
        value: filters.procedureCode
      });
    }

    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      const dateStr = this.formatDate(filters.effectiveDate);
      const operator = this.getPeriodOperator(filters.effectiveDatePeriod);
      const label = `Effective Date ${operator} ${dateStr}`;

      chips.push({
        key: 'effectiveDate',
        label,
        value: filters.effectiveDatePeriod
      });
    }

    if (filters.terminationDatePeriod && filters.terminationDate) {
      const dateStr = this.formatDate(filters.terminationDate);
      const operator = this.getPeriodOperator(filters.terminationDatePeriod);
      const label = `Termination Date ${operator} ${dateStr}`;

      chips.push({
        key: 'terminationDate',
        label,
        value: filters.terminationDatePeriod
      });
    }

    return chips;
  }

  private static formatDate(date: Date | string): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  static removeFilterByChipKey(
    filters: DefineProcedureGroupsFilterValue | null,
    chipKey: string
  ): DefineProcedureGroupsFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'procedureGroupCode':
        updatedFilters.procedureGroupCode = null;
        break;
      case 'procedureCode':
        updatedFilters.procedureCode = null;
        break;
      case 'donationCredits':
        updatedFilters.donationCredits = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDatePeriod = null;
        updatedFilters.effectiveDate = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDatePeriod = null;
        updatedFilters.terminationDate = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: DefineProcedureGroupsFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.procedureGroupCode ||
      filters.procedureCode ||
      filters.donationCredits !== null && filters.donationCredits !== undefined ||
      filters.effectiveDatePeriod ||
      filters.effectiveDate ||
      filters.terminationDatePeriod ||
      filters.terminationDate
    );
  }
}
