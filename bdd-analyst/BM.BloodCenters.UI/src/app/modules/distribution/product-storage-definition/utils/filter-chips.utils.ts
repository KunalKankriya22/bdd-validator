import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ProductStorageFilterValue } from '../models/product-storage-definition.model';
import moment from 'moment';

export class ProductStorageFilterChipsUtils {
  static convertFiltersToChips(filters: ProductStorageFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}`,
        value: filters.productType
      });
    }

    if (filters.warehouseCode) {
      chips.push({
        key: 'warehouseCode',
        label: `Warehouse: ${filters.warehouseCode}`,
        value: filters.warehouseCode
      });
    }

    if (filters.deviceType) {
      chips.push({
        key: 'deviceType',
        label: `Device Type: ${filters.deviceType}`,
        value: filters.deviceType
      });
    }

    if (filters.effectiveDate && filters.effectivePeriod) {
      const formattedDate = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
      const symbol = filters.effectivePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationPeriod) {
      const formattedDate = moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase();
      const symbol = filters.terminationPeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ProductStorageFilterValue | null,
    chipKey: string
  ): ProductStorageFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'productType':
        updatedFilters.productType = null;
        break;
      case 'warehouseCode':
        updatedFilters.warehouseCode = null;
        break;
      case 'deviceType':
        updatedFilters.deviceType = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectivePeriod = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationPeriod = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ProductStorageFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.productType ||
      filters.warehouseCode ||
      filters.deviceType ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }
}
