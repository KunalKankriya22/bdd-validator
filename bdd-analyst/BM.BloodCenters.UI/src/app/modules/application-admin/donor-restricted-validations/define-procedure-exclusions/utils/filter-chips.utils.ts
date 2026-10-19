import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineProcedureExclusionsFilterValue } from '../models/define-procedure-exclusions.model';

export class ProcedureExclusionsFilterChipsUtils {
  static convertFiltersToChips(filters: DefineProcedureExclusionsFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.donationType) {
      chips.push({
        key: 'donationType',
        label: `Donation Type: ${filters.donationType}`,
        value: filters.donationType,
        removable: true
      });
    }

    if (filters.procedureCode) {
      chips.push({
        key: 'procedureCode',
        label: `Procedure: ${filters.procedureCode}`,
        value: filters.procedureCode,
        removable: true
      });
    }

    if (filters.interdictionCode) {
      chips.push({
        key: 'interdictionCode',
        label: `Interdiction: ${filters.interdictionCode}`,
        value: filters.interdictionCode,
        removable: true
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: DefineProcedureExclusionsFilterValue | null,
    chipKey: string
  ): DefineProcedureExclusionsFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'donationType':
        updatedFilters.donationType = null;
        break;
      case 'procedureCode':
        updatedFilters.procedureCode = null;
        break;
      case 'interdictionCode':
        updatedFilters.interdictionCode = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: DefineProcedureExclusionsFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.donationType ||
      filters.procedureCode ||
      filters.interdictionCode
    );
  }
}
