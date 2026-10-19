import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FilterValue } from '../models/customer-consignee-product-details.model';

export class CustomerConsigneeProductDetailsFilterChipsUtils {

  static createFilterChips(filters: FilterValue): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.effectiveDate && filters.effectivePeriod) {
      const symbol = filters.effectivePeriod === 'After' ? '≥' : '≤';
      const formattedDate = CustomerConsigneeProductDetailsFilterChipsUtils.formatDateForDisplay(filters.effectiveDate);
      chips.push({
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate,
        key: 'effectiveDate'
      });
    }

    if (filters.terminationDate && filters.terminationPeriod) {
      const symbol = filters.terminationPeriod === 'After' ? '≥' : '≤';
      const formattedDate = CustomerConsigneeProductDetailsFilterChipsUtils.formatDateForDisplay(filters.terminationDate);
      chips.push({
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate,
        key: 'terminationDate'
      });
    }

    return chips;
  }

  static removeFilter(filters: FilterValue, key: string): FilterValue {
    const newFilters = { ...filters };

    switch (key) {
      case 'effectiveDate':
        delete newFilters.effectivePeriod;
        delete newFilters.effectiveDate;
        break;
      case 'terminationDate':
        delete newFilters.terminationPeriod;
        delete newFilters.terminationDate;
        break;
    }

    return newFilters;
  }

  static clearAllFilters(): FilterValue {
    return {};
  }

  private static formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
