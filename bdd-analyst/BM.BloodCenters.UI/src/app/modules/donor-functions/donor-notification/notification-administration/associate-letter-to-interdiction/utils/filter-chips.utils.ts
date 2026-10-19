import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AssociateLetterToInterdictionFilterValue } from '../models/associate-letter-to-interdiction.model';

export class AssociateLetterToInterdictionFilterChipsUtils {

  static convertFiltersToChips(filters: AssociateLetterToInterdictionFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.interCode) {
      chips.push({
        key: 'interCode',
        label: `Interdiction Code: ${filters.interCode}`,
        value: filters.interCode
      });
    }

    if (filters.donationType) {
      chips.push({
        key: 'donationType',
        label: `Donation Type: ${filters.donationType}`,
        value: filters.donationType
      });
    }

    if (filters.letterId) {
      chips.push({
        key: 'letterId',
        label: `Letter ID: ${filters.letterId}`,
        value: filters.letterId
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: AssociateLetterToInterdictionFilterValue | null,
    chipKey: string
  ): AssociateLetterToInterdictionFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'interCode':
        updatedFilters.interCode = null;
        break;
      case 'donationType':
        updatedFilters.donationType = null;
        break;
      case 'letterId':
        updatedFilters.letterId = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: AssociateLetterToInterdictionFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.interCode ||
      filters.donationType ||
      filters.letterId
    );
  }
}
