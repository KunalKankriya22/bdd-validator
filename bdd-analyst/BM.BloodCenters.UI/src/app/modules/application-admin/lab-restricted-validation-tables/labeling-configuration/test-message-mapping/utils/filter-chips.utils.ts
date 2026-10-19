import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { TestMessageMappingFilterValue } from '../models/test-message-mapping.model';

export class TestMessageMappingFilterChipsUtils {

  static convertFiltersToChips(filters: TestMessageMappingFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.resultCode) {
      chips.push({
        key: 'resultCode',
        label: `Result: ${filters.resultCode}`,
        value: filters.resultCode
      });
    }

    if (filters.antibodyFlag) {
      const display = filters.antibodyFlag === 'Y' ? 'Yes' : 'No';
      chips.push({
        key: 'antibodyFlag',
        label: `Antibody Flag: ${display}`,
        value: filters.antibodyFlag
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
    filters: TestMessageMappingFilterValue | null,
    chipKey: string
  ): TestMessageMappingFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'resultCode':
        updatedFilters.resultCode = null;
        break;
      case 'antibodyFlag':
        updatedFilters.antibodyFlag = null;
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

  static hasActiveFilters(filters: TestMessageMappingFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.resultCode ||
      filters.antibodyFlag ||
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
