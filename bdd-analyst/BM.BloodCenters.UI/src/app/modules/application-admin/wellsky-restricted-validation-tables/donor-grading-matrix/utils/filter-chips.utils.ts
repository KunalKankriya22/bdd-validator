import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonorGradingMatrixFilterValue, MATCH_LABELS, GENDER_LABELS } from '../models/donor-grading-matrix.model';

export class DonorGradingMatrixFilterChipsUtils {

  static convertFiltersToChips(filters: DonorGradingMatrixFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.firstnameMatch) {
      const displayLabel = MATCH_LABELS[filters.firstnameMatch] || filters.firstnameMatch;
      chips.push({
        key: 'firstnameMatch',
        label: `First Name: ${displayLabel}`,
        value: filters.firstnameMatch
      });
    }

    if (filters.lastnameMatch) {
      const displayLabel = MATCH_LABELS[filters.lastnameMatch] || filters.lastnameMatch;
      chips.push({
        key: 'lastnameMatch',
        label: `Last Name: ${displayLabel}`,
        value: filters.lastnameMatch
      });
    }

    if (filters.dobMatch) {
      const displayLabel = MATCH_LABELS[filters.dobMatch] || filters.dobMatch;
      chips.push({
        key: 'dobMatch',
        label: `DOB: ${displayLabel}`,
        value: filters.dobMatch
      });
    }

    if (filters.genderMatch) {
      const displayLabel = GENDER_LABELS[filters.genderMatch] || filters.genderMatch;
      chips.push({
        key: 'genderMatch',
        label: `Gender: ${displayLabel}`,
        value: filters.genderMatch
      });
    }

    if (filters.grade != null) {
      chips.push({
        key: 'grade',
        label: `Grade: ${filters.grade}`,
        value: filters.grade.toString()
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: DonorGradingMatrixFilterValue | null,
    chipKey: string
  ): DonorGradingMatrixFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'firstnameMatch':
        updatedFilters.firstnameMatch = null;
        break;
      case 'lastnameMatch':
        updatedFilters.lastnameMatch = null;
        break;
      case 'dobMatch':
        updatedFilters.dobMatch = null;
        break;
      case 'genderMatch':
        updatedFilters.genderMatch = null;
        break;
      case 'grade':
        updatedFilters.grade = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: DonorGradingMatrixFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.firstnameMatch ||
      filters.lastnameMatch ||
      filters.dobMatch ||
      filters.genderMatch ||
      filters.grade != null
    );
  }
}
