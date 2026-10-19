import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { UnitInterdictionFilterValue } from '../models/unit-interdiction.model';

export class UnitInterdictionFilterChipsUtils {
  static generateFilterChips(filters: UnitInterdictionFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Code filters
    if (filters.codes && filters.codes.length > 0) {
      chips.push({
        label: `Code: ${filters.codes.join(', ')}`,
        value: filters.codes,
        key: 'codes'
      });
    }

    // Type filters
    if (filters.types && filters.types.length > 0) {
      chips.push({
        label: `Type: ${filters.types.join(', ')}`,
        value: filters.types,
        key: 'types'
      });
    }

    // Effective Date range
    if (filters.effectiveDateFrom || filters.effectiveDateTo) {
      const from = filters.effectiveDateFrom || 'Start';
      const to = filters.effectiveDateTo || 'End';
      chips.push({
        label: `Effective Date: ${from} - ${to}`,
        value: { from: filters.effectiveDateFrom, to: filters.effectiveDateTo },
        key: 'effectiveDate'
      });
    }

    // Termination Date range
    if (filters.terminationDateFrom || filters.terminationDateTo) {
      const from = filters.terminationDateFrom || 'Start';
      const to = filters.terminationDateTo || 'End';
      chips.push({
        label: `Termination Date: ${from} - ${to}`,
        value: { from: filters.terminationDateFrom, to: filters.terminationDateTo },
        key: 'terminationDate'
      });
    }

    // User ID filters
    if (filters.userIds && filters.userIds.length > 0) {
      chips.push({
        label: `User ID: ${filters.userIds.join(', ')}`,
        value: filters.userIds,
        key: 'userIds'
      });
    }

    // Originated filters
    if (filters.originated && filters.originated.length > 0) {
      chips.push({
        label: `Originated: ${filters.originated.join(', ')}`,
        value: filters.originated,
        key: 'originated'
      });
    }

    // Reason filters
    if (filters.reasons && filters.reasons.length > 0) {
      chips.push({
        label: `Reason: ${filters.reasons.join(', ')}`,
        value: filters.reasons,
        key: 'reasons'
      });
    }

    return chips;
  }

  static removeFilterChip(
    filters: UnitInterdictionFilterValue,
    chip: FilterChip
  ): UnitInterdictionFilterValue {
    const updatedFilters = { ...filters };

    switch (chip.key) {
      case 'codes':
        delete updatedFilters.codes;
        break;
      case 'types':
        delete updatedFilters.types;
        break;
      case 'effectiveDate':
        delete updatedFilters.effectiveDateFrom;
        delete updatedFilters.effectiveDateTo;
        break;
      case 'terminationDate':
        delete updatedFilters.terminationDateFrom;
        delete updatedFilters.terminationDateTo;
        break;
      case 'userIds':
        delete updatedFilters.userIds;
        break;
      case 'originated':
        delete updatedFilters.originated;
        break;
      case 'reasons':
        delete updatedFilters.reasons;
        break;
    }

    return updatedFilters;
  }
}
