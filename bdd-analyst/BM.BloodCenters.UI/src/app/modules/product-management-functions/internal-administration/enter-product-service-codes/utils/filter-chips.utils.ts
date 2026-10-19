import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FilterValue } from '../models/enter-product-service-codes.model';

export class EnterProductServiceCodesFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static createFilterChips(
    filters: FilterValue,
    productCodeOptions: { productCode: string; productDesc: string }[] = [],
    inventoryTypeOptions: { productType: string; productTypeDesc: string }[] = [],
    productionTypeOptions: { productType: string }[] = [],
    serviceCodeOptions: { serviceCode: string }[] = []
  ): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.productCode) {
      chips.push({
        label: `Product Code: ${filters.productCode}`,
        value: filters.productCode,
        key: 'productCode'
      });
    }

    if (filters.invProductType) {
      chips.push({
        label: `Inventory Product Type: ${filters.invProductType}`,
        value: filters.invProductType,
        key: 'invProductType'
      });
    }

    if (filters.productType) {
      chips.push({
        label: `Product Type: ${filters.productType}`,
        value: filters.productType,
        key: 'productType'
      });
    }

    if (filters.serviceCode) {
      chips.push({
        label: `Service Code: ${filters.serviceCode}`,
        value: filters.serviceCode,
        key: 'serviceCode'
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by key
   */
  static removeFilter(filters: FilterValue, key: string): FilterValue {
    const newFilters = { ...filters };

    switch (key) {
      case 'productCode':
        delete newFilters.productCode;
        break;
      case 'invProductType':
        delete newFilters.invProductType;
        break;
      case 'productType':
        delete newFilters.productType;
        break;
      case 'serviceCode':
        delete newFilters.serviceCode;
        break;
    }

    return newFilters;
  }

  /**
   * Clear all filters
   */
  static clearAllFilters(): FilterValue {
    return {};
  }
}
