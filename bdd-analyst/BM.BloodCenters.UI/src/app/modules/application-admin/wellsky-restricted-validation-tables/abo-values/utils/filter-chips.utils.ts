import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AboValuesFilterValue } from '../models/abo-values.model';

export class AboValuesFilterChipsUtils {
  /**
   * Format date from YYYY-MM-DD to DD-MMM-YYYY
   */
  private static formatDate(dateStr: string): string {
    if (!dateStr) return dateStr;

    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Map period text to symbol sign
   */
  private static getPeriodSign(period: string): string {
    switch (period.toUpperCase()) {
      case 'AFTER':
      case 'ON OR AFTER':
        return '≥';
      case 'BEFORE':
      case 'ON OR BEFORE':
        return '≤';
      default:
        return period;
    }
  }

  static convertFiltersToChips(filters: AboValuesFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.intendedUse) {
      chips.push({
        key: 'intendedUse',
        label: `Intended Use: ${filters.intendedUse}`,
        value: filters.intendedUse,
        removable: true
      });
    }

    if (filters.unitScheme) {
      chips.push({
        key: 'unitScheme',
        label: `Unit Scheme: ${filters.unitScheme}`,
        value: filters.unitScheme,
        removable: true
      });
    }

    if (filters.transfusionStatus) {
      chips.push({
        key: 'transfusionStatus',
        label: `Transfusion Status: ${filters.transfusionStatus}`,
        value: filters.transfusionStatus,
        removable: true
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${this.getPeriodSign(filters.effectiveDatePeriod)} ${this.formatDate(filters.effectiveDate)}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${this.getPeriodSign(filters.terminationDatePeriod)} ${this.formatDate(filters.terminationDate)}`,
        value: filters.terminationDate,
        removable: true
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: AboValuesFilterValue | null,
    chipKey: string
  ): AboValuesFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'intendedUse':
        updatedFilters.intendedUse = null;
        break;
      case 'unitScheme':
        updatedFilters.unitScheme = null;
        break;
      case 'transfusionStatus':
        updatedFilters.transfusionStatus = null;
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

  static hasActiveFilters(filters: AboValuesFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.intendedUse ||
      filters.unitScheme ||
      filters.transfusionStatus ||
      (filters.effectiveDate && filters.effectiveDatePeriod) ||
      (filters.terminationDate && filters.terminationDatePeriod)
    );
  }
}
