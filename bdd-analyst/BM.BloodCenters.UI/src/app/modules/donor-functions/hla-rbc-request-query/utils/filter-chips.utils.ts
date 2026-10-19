import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FilterValue } from '../models/hla-rbc-request-query.model';

export class HlaRbcFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static createChipsFromFilters(filters: FilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.showGradeThrough) {
      chips.push({
        label: `Show Grade Through: ${filters.showGradeThrough}`,
        key: 'showGradeThrough',
        value: filters.showGradeThrough
      });
    }

    if (filters.grades && filters.grades.length > 0) {
      chips.push({
        label: `Grades: ${filters.grades.join(', ')}`,
        key: 'grades',
        value: filters.grades.join(',')
      });
    }

    if (filters.level) {
      chips.push({
        label: `Level: ${filters.level}`,
        key: 'level',
        value: filters.level.toString()
      });
    }

    if (filters.pattern) {
      chips.push({
        label: `Pattern: ${filters.pattern}`,
        key: 'pattern',
        value: filters.pattern
      });
    }

    if (filters.abo) {
      chips.push({
        label: `ABO: ${filters.abo}`,
        key: 'abo',
        value: filters.abo
      });
    }

    if (filters.antigens) {
      chips.push({
        label: `Antigens: ${filters.antigens}`,
        key: 'antigens',
        value: filters.antigens
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: FilterValue | null,
    chipKey: string
  ): FilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'showGradeThrough':
        delete updatedFilters.showGradeThrough;
        break;
      case 'grades':
        delete updatedFilters.grades;
        break;
      case 'level':
        delete updatedFilters.level;
        break;
      case 'pattern':
        delete updatedFilters.pattern;
        break;
      case 'abo':
        delete updatedFilters.abo;
        break;
      case 'antigens':
        delete updatedFilters.antigens;
        break;
    }

    // Return null if no filters are active
    if (!this.hasActiveFilters(updatedFilters)) {
      return null;
    }

    return updatedFilters;
  }

  /**
   * Remove a filter by chip (deprecated, use removeFilterByChipKey)
   */
  static removeFilter(filters: FilterValue, chip: FilterChip): FilterValue {
    const updatedFilters = { ...filters };

    switch (chip.key) {
      case 'showGradeThrough':
        delete updatedFilters.showGradeThrough;
        break;
      case 'grades':
        delete updatedFilters.grades;
        break;
      case 'level':
        delete updatedFilters.level;
        break;
      case 'pattern':
        delete updatedFilters.pattern;
        break;
      case 'abo':
        delete updatedFilters.abo;
        break;
      case 'antigens':
        delete updatedFilters.antigens;
        break;
    }

    return updatedFilters;
  }

  /**
   * Check if any filters are currently active
   */
  static hasActiveFilters(filters: FilterValue | null): boolean {
    if (!filters) return false;
    return !!(
      filters.showGradeThrough ||
      (filters.grades && filters.grades.length > 0) ||
      filters.level ||
      filters.pattern ||
      filters.abo ||
      filters.antigens
    );
  }
}
