import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ResourceAvailabilityFilterValue } from '../models/resource-availability-rules.model';

/**
 * Utility class for converting filter values to filter chips
 */
export class ResourceAvailabilityFilterChipsUtils {

  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: ResourceAvailabilityFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.day) {
      const dayLabel = filters.day === 'ALL' ? 'All' : filters.day;
      chips.push({
        key: 'day',
        label: `Day: ${dayLabel}`,
        value: filters.day
      });
    }

    if (filters.effectiveDateFrom) {
      chips.push({
        key: 'effectiveDateFrom',
        label: `Effective Date ≥ ${this.formatDate(filters.effectiveDateFrom)}`,
        value: filters.effectiveDateFrom
      });
    }

    if (filters.effectiveDateTo) {
      chips.push({
        key: 'effectiveDateTo',
        label: `Effective Date ≤ ${this.formatDate(filters.effectiveDateTo)}`,
        value: filters.effectiveDateTo
      });
    }

    if (filters.terminationDateFrom) {
      chips.push({
        key: 'terminationDateFrom',
        label: `Termination Date ≥ ${this.formatDate(filters.terminationDateFrom)}`,
        value: filters.terminationDateFrom
      });
    }

    if (filters.terminationDateTo) {
      chips.push({
        key: 'terminationDateTo',
        label: `Termination Date ≤ ${this.formatDate(filters.terminationDateTo)}`,
        value: filters.terminationDateTo
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: ResourceAvailabilityFilterValue | null,
    chipKey: string
  ): ResourceAvailabilityFilterValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (chipKey) {
      case 'day':
        updated.day = null;
        break;
      case 'effectiveDateFrom':
        updated.effectiveDateFrom = null;
        break;
      case 'effectiveDateTo':
        updated.effectiveDateTo = null;
        break;
      case 'terminationDateFrom':
        updated.terminationDateFrom = null;
        break;
      case 'terminationDateTo':
        updated.terminationDateTo = null;
        break;
    }

    // If all filters are null, return null
    if (
      !updated.day &&
      !updated.effectiveDateFrom &&
      !updated.effectiveDateTo &&
      !updated.terminationDateFrom &&
      !updated.terminationDateTo
    ) {
      return null;
    }

    return updated;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: ResourceAvailabilityFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.day ||
      filters.effectiveDateFrom ||
      filters.effectiveDateTo ||
      filters.terminationDateFrom ||
      filters.terminationDateTo
    );
  }

  /**
   * Format date for display (YYYY-MM-DD -> DD-MMM-YYYY)
   */
  private static formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
