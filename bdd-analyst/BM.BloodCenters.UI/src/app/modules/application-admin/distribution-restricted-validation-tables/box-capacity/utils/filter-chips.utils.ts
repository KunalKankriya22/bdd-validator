import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { BoxCapacityFilterValue } from '../models/box-capacity.model';
import moment from 'moment';

export class BoxCapacityFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: BoxCapacityFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Box Type filter
    if (filters.boxType) {
      chips.push({
        key: 'boxType',
        label: `Box Type: ${filters.boxType}`,
        value: filters.boxType
      });
    }

    // Inventory Product Type filter
    if (filters.inventoryProductType) {
      chips.push({
        key: 'inventoryProductType',
        label: `Inventory Product Type: ${filters.inventoryProductType}`,
        value: filters.inventoryProductType
      });
    }

    // Capacity Range filter
    if (filters.capacityRange && filters.capacity !== null) {
      const operator = filters.capacityRange === 'Over' ? '≥' : '≤';
      chips.push({
        key: 'capacity',
        label: `Capacity ${operator} ${filters.capacity}`,
        value: filters.capacity.toString()
      });
    }

    // Effective Date Period filter
    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      const formattedDate = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
      const operator = filters.effectiveDatePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${formattedDate}`,
        value: formattedDate
      });
    }

    // Termination Date Period filter
    if (filters.terminationDatePeriod && filters.terminationDate) {
      const formattedDate = moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase();
      const operator = filters.terminationDatePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${formattedDate}`,
        value: formattedDate
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: BoxCapacityFilterValue | null,
    chipKey: string
  ): BoxCapacityFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'boxType':
        updatedFilters.boxType = null;
        break;
      case 'inventoryProductType':
        updatedFilters.inventoryProductType = null;
        break;
      case 'capacity':
        updatedFilters.capacityRange = null;
        updatedFilters.capacity = null;
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

    // If all filters are null, return null
    const hasAnyFilter = Object.values(updatedFilters).some(value => value !== null);
    return hasAnyFilter ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: BoxCapacityFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return (
      !!filters.boxType ||
      !!filters.inventoryProductType ||
      !!(filters.capacityRange && filters.capacity !== null) ||
      !!(filters.effectiveDatePeriod && filters.effectiveDate) ||
      !!(filters.terminationDatePeriod && filters.terminationDate)
    );
  }
}
