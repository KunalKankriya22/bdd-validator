import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidProductSubstitutionFilterValue } from '../models/valid-product-substitution.model';
import moment from 'moment';

export class ValidProductSubstitutionFilterChipsUtils {
  /**
   * Format date for display
   */
  private static formatDate(date: Date | null): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  static convertFiltersToChips(filters: ValidProductSubstitutionFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.requestProductType) {
      chips.push({
        key: 'requestProductType',
        label: `Requested: ${filters.requestProductType}`,
        value: filters.requestProductType
      });
    }

    if (filters.compatibleProductType) {
      chips.push({
        key: 'compatibleProductType',
        label: `Compatible: ${filters.compatibleProductType}`,
        value: filters.compatibleProductType
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const operator = filters.effectiveDatePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${this.formatDate(filters.effectiveDate)}`,
        value: filters.effectiveDate.toString()
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const operator = filters.terminationDatePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${this.formatDate(filters.terminationDate)}`,
        value: filters.terminationDate.toString()
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ValidProductSubstitutionFilterValue | null,
    chipKey: string
  ): ValidProductSubstitutionFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'requestProductType':
        updatedFilters.requestProductType = null;
        break;
      case 'compatibleProductType':
        updatedFilters.compatibleProductType = null;
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

  static hasActiveFilters(filters: ValidProductSubstitutionFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.requestProductType ||
      filters.compatibleProductType ||
      filters.effectiveDatePeriod ||
      filters.effectiveDate ||
      filters.terminationDatePeriod ||
      filters.terminationDate
    );
  }
}
