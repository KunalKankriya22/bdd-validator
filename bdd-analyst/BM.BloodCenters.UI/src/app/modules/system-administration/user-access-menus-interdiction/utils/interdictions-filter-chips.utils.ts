import { FilterChip } from '../../../../shared/components/filter-chips/filter-chips';
import { InterdictionsFilterValue } from '../models/user-access-filters.model';

export class InterdictionsFilterChipsUtils {
  static convertFiltersToChips(filters: InterdictionsFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.interdictionsType) {
      chips.push({
        key: 'interdictionsType',
        label: `Interdictions Type: ${filters.interdictionsType}`,
        value: filters.interdictionsType
      });
    }

    if (filters.interdictionsCode) {
      chips.push({
        key: 'interdictionsCode',
        label: `Interdictions Code: ${filters.interdictionsCode}`,
        value: filters.interdictionsCode
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: InterdictionsFilterValue | null,
    chipKey: string
  ): InterdictionsFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'interdictionsType':
        updatedFilters.interdictionsType = null;
        break;
      case 'interdictionsCode':
        updatedFilters.interdictionsCode = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: InterdictionsFilterValue | null): boolean {
    if (!filters) return false;
    return !!(filters.interdictionsType || filters.interdictionsCode);
  }
}
