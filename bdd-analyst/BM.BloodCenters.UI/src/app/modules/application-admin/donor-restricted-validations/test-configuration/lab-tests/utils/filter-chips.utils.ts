import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { LabTestFilterValue } from '../models/lab-tests.model';

export class LabTestsFilterChipsUtils {
  static convertFiltersToChips(filters: LabTestFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.initialRepeat) {
      const display = filters.initialRepeat === 'I' ? 'Initial' : 'Repeat';
      chips.push({
        key: 'initialRepeat',
        label: `Initial/Repeat: ${display}`,
        value: filters.initialRepeat,
        removable: true
      });
    }

    if (filters.interdictionCode) {
      chips.push({
        key: 'interdictionCode',
        label: `Interdiction Code: ${filters.interdictionCode}`,
        value: filters.interdictionCode,
        removable: true
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const periodSymbol = this.periodToSymbol(filters.effectiveDatePeriod);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${periodSymbol} ${formattedDate}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const periodSymbol = this.periodToSymbol(filters.terminationDatePeriod);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${periodSymbol} ${formattedDate}`,
        value: filters.terminationDate,
        removable: true
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: LabTestFilterValue | null,
    chipKey: string
  ): LabTestFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'initialRepeat':
        updatedFilters.initialRepeat = null;
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

  static hasActiveFilters(filters: LabTestFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.initialRepeat ||
      filters.interdictionCode ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }

  private static periodToSymbol(period: string): string {
    return period === 'After' ? '≥' : '≤';
  }

  private static formatDate(date: Date | string): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
