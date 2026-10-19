import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { TierPricingFilterValue } from '../models/customer-product-tier-pricing.model';

export class TierPricingFilterChipsUtils {
  static convertFiltersToChips(filters: TierPricingFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.customerId) {
      chips.push({
        key: 'customerId',
        label: `Customer ID: ${filters.customerId}`,
        value: filters.customerId,
      });
    }

    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}`,
        value: filters.productType,
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: TierPricingFilterValue | null,
    chipKey: string
  ): TierPricingFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'customerId':
        updatedFilters.customerId = null;
        break;
      case 'productType':
        updatedFilters.productType = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: TierPricingFilterValue | null): boolean {
    if (!filters) return false;
    return !!(filters.customerId || filters.productType);
  }
}
