import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ProductCodeFilterValue } from '../filter-panel/product-codes-filter-panel';
import moment from 'moment';

export class ProductCodeFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: ProductCodeFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    // Product Type
    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}`,
        value: filters.productType,
        removable: true
      });
    }

    // Effective Date with Period
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const symbol = filters.effectiveDatePeriod === 'After' ? '≥' : '≤';
      const dateStr = moment.isMoment(filters.effectiveDate)
        ? filters.effectiveDate.format('DD-MMM-YYYY').toUpperCase()
        : '';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${dateStr}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    // Termination Date with Period
    if (filters.terminationDate && filters.terminationDatePeriod) {
      const symbol = filters.terminationDatePeriod === 'After' ? '≥' : '≤';
      const dateStr = moment.isMoment(filters.terminationDate)
        ? filters.terminationDate.format('DD-MMM-YYYY').toUpperCase()
        : '';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${dateStr}`,
        value: filters.terminationDate,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: ProductCodeFilterValue | null,
    chipKey: string
  ): ProductCodeFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'productType':
        updatedFilters.productType = null;
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

    // Return null if all filters are cleared
    const hasAnyFilter = Object.values(updatedFilters).some(v => v !== null);
    return hasAnyFilter ? updatedFilters : null;
  }
}
