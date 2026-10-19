import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidFilterFilterValue } from '../models/valid-filters.model';

export class ValidFilterFilterChipsUtils {
  static convertFiltersToChips(filters: ValidFilterFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.catalogNumber) {
      chips.push({
        key: 'catalogNumber',
        label: `Catalog: ${filters.catalogNumber}`,
        value: filters.catalogNumber
      });
    }

    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}`,
        value: filters.productType
      });
    }

    if (filters.days !== undefined && filters.days !== null) {
      chips.push({
        key: 'days',
        label: `Days: ${filters.days}`,
        value: filters.days
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ValidFilterFilterValue | null,
    chipKey: string
  ): ValidFilterFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'catalogNumber':
        delete updatedFilters.catalogNumber;
        break;
      case 'productType':
        delete updatedFilters.productType;
        break;
      case 'days':
        delete updatedFilters.days;
        break;
    }

    const hasFilters = Object.values(updatedFilters).some(
      (value) => value !== undefined && value !== null
    );

    return hasFilters ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ValidFilterFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return Object.values(filters).some(
      (value) => value !== undefined && value !== null
    );
  }
}
