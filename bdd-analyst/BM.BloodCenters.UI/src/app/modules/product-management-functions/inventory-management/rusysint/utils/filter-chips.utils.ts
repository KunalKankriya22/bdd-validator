import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FilterValue, ProductCodeLOV, BloodTypeLOV, WarehouseLOV } from '../models/release-product-quarantine.model';
import moment from 'moment';

/**
 * Utility functions for managing filter chips in Release Product Quarantine
 */
export class ReleaseProductQuarantineFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static createFilterChips(
    filters: FilterValue,
    productCodeOptions: ProductCodeLOV[] = [],
    bloodTypeOptions: BloodTypeLOV[] = [],
    warehouseOptions: WarehouseLOV[] = []
  ): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.productCode) {
      const option = productCodeOptions.find(o => o.productCode === filters.productCode);
      chips.push({
        label: 'Product Code',
        value: option ? `${option.productCode}${option.productDesc ? ' - ' + option.productDesc : ''}` : filters.productCode,
        key: 'productCode'
      });
    }

    if (filters.bloodType) {
      const option = bloodTypeOptions.find(o => o.bloodType === filters.bloodType);
      chips.push({
        label: 'Blood Type',
        value: option ? `${option.bloodType}${option.aboDesc ? ' - ' + option.aboDesc : ''}` : filters.bloodType,
        key: 'bloodType'
      });
    }

    if (filters.warehouseId) {
      const option = warehouseOptions.find(o => o.warehouseId === filters.warehouseId);
      chips.push({
        label: 'Warehouse',
        value: option ? `${option.warehouseId}${option.warehouseDesc ? ' - ' + option.warehouseDesc : ''}` : filters.warehouseId,
        key: 'warehouseId'
      });
    }

    if (filters.fromDate) {
      const formattedDate = moment(filters.fromDate).format('DD-MMM-YYYY').toUpperCase();
      chips.push({
        label: 'From Date',
        value: formattedDate,
        key: 'fromDate'
      });
    }

    if (filters.toDate) {
      const formattedDate = moment(filters.toDate).format('DD-MMM-YYYY').toUpperCase();
      chips.push({
        label: 'To Date',
        value: formattedDate,
        key: 'toDate'
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
      case 'bloodType':
        delete newFilters.bloodType;
        break;
      case 'warehouseId':
        delete newFilters.warehouseId;
        break;
      case 'fromDate':
        delete newFilters.fromDate;
        break;
      case 'toDate':
        delete newFilters.toDate;
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
