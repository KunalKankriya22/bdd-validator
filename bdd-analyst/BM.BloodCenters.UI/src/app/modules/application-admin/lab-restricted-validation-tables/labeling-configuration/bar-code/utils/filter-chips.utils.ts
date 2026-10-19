import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { BarCodeFilterValue } from '../models/bar-code.model';

export class BarCodeFilterChipsUtils {

  static convertFiltersToChips(filters: BarCodeFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.testId) {
      chips.push({
        key: 'testId',
        label: `Test ID: ${filters.testId}`,
        value: filters.testId
      });
    }

    if (filters.resultCode) {
      const display = filters.resultCode === 'N' ? 'Negative' : filters.resultCode === 'P' ? 'Positive' : filters.resultCode;
      chips.push({
        key: 'resultCode',
        label: `Result: ${display}`,
        value: filters.resultCode
      });
    }

    if (filters.effectiveDate) {
      const operator = this.periodToOperator(filters.effectiveDatePeriod);
      const dateStr = this.formatDateForChip(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${dateStr}`,
        value: dateStr
      });
    }

    if (filters.terminationDate) {
      const operator = this.periodToOperator(filters.terminationDatePeriod);
      const dateStr = this.formatDateForChip(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${dateStr}`,
        value: dateStr
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: BarCodeFilterValue | null,
    chipKey: string
  ): BarCodeFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'testId':
        updatedFilters.testId = null;
        break;
      case 'resultCode':
        updatedFilters.resultCode = null;
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

  static hasActiveFilters(filters: BarCodeFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.testId ||
      filters.resultCode ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }

  private static periodToOperator(period: string | null | undefined): string {
    const normalized = period?.toLowerCase();
    if (normalized === 'after') return '≥';
    if (normalized === 'before') return '≤';
    return '=';
  }

  private static formatDateForChip(date: any): string {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
