import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ProductTypePrioritizationFilterValue } from '../models/product-type-prioritization.model';

export class ProductTypePrioritizationFilterChipsUtils {

  static convertFiltersToChips(filters: ProductTypePrioritizationFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}`,
        value: filters.productType
      });
    }

    if (filters.effectiveDate) {
      const dateStr = this.formatDateForChip(filters.effectiveDate);
      const operator = this.periodToOperator(filters.effectiveDatePeriod);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${dateStr}`,
        value: dateStr
      });
    }

    if (filters.terminationDate) {
      const dateStr = this.formatDateForChip(filters.terminationDate);
      const operator = this.periodToOperator(filters.terminationDatePeriod);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${dateStr}`,
        value: dateStr
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ProductTypePrioritizationFilterValue | null,
    chipKey: string
  ): ProductTypePrioritizationFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'productType':
        updatedFilters.productType = null;
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

  static hasActiveFilters(filters: ProductTypePrioritizationFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.productType ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }

  private static periodToOperator(period: string | null): string {
    switch (period) {
      case 'after': return '≥';
      case 'before': return '≤';
      default: return '=';
    }
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
