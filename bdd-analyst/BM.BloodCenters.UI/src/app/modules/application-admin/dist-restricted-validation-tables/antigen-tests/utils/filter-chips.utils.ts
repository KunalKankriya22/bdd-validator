import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AntigenTestFilterValue } from '../models/antigen-test.model';
import moment from 'moment';

export class AntigenTestFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: AntigenTestFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Price Range and Price
    if (filters.priceRange && filters.price !== null && filters.price !== undefined) {
      chips.push({
        key: 'price',
        label: `Price ${filters.priceRange} $${filters.price.toFixed(2)}`,
        value: `${filters.priceRange}|${filters.price}`
      });
    }

    // Effective Date Period and Date
    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      const dateStr = moment(filters.effectiveDate).format('DD-MMM-YYYY');
      const operator = filters.effectiveDatePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${dateStr}`,
        value: `${filters.effectiveDatePeriod}|${dateStr}`
      });
    }

    // Termination Date Period and Date
    if (filters.terminationDatePeriod && filters.terminationDate) {
      const dateStr = moment(filters.terminationDate).format('DD-MMM-YYYY');
      const operator = filters.terminationDatePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${dateStr}`,
        value: `${filters.terminationDatePeriod}|${dateStr}`
      });
    }

    return chips;
  }

  /**
   * Remove a filter by its chip key
   */
  static removeFilterByChipKey(
    filters: AntigenTestFilterValue | null,
    chipKey: string
  ): AntigenTestFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'price':
        updatedFilters.priceRange = null;
        updatedFilters.price = null;
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

    // Check if all filters are null
    if (
      !updatedFilters.priceRange &&
      !updatedFilters.price &&
      !updatedFilters.effectiveDatePeriod &&
      !updatedFilters.effectiveDate &&
      !updatedFilters.terminationDatePeriod &&
      !updatedFilters.terminationDate
    ) {
      return null;
    }

    return updatedFilters;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: AntigenTestFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      (filters.priceRange && filters.price !== null && filters.price !== undefined) ||
      (filters.effectiveDatePeriod && filters.effectiveDate) ||
      (filters.terminationDatePeriod && filters.terminationDate)
    );
  }
}
