import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { CityStateZipFilterValue } from '../models/city-state-zip-query.model';

/**
 * Utility functions for managing filter chips in City, State, and Zip Query
 */
export class CityStateZipFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: CityStateZipFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.city) {
      chips.push({
        key: 'city',
        label: `City: ${filters.city}`,
        value: filters.city
      });
    }

    if (filters.zip) {
      chips.push({
        key: 'zip',
        label: `Zip Code: ${filters.zip}`,
        value: filters.zip
      });
    }

    if (filters.county) {
      chips.push({
        key: 'county',
        label: `County: ${filters.county}`,
        value: filters.county
      });
    }

    if (filters.state) {
      chips.push({
        key: 'state',
        label: `State: ${filters.state}`,
        value: filters.state
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: CityStateZipFilterValue | null,
    chipKey: string
  ): CityStateZipFilterValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (chipKey) {
      case 'city':
        delete updated.city;
        break;
      case 'zip':
        delete updated.zip;
        break;
      case 'county':
        delete updated.county;
        break;
      case 'state':
        delete updated.state;
        break;
    }

    // Return null if no filters remain
    const hasFilters = Object.values(updated).some(val => val != null && val !== '');
    return hasFilters ? updated : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: CityStateZipFilterValue | null): boolean {
    if (!filters) return false;
    return Object.values(filters).some(val => val != null && val !== '');
  }
}
