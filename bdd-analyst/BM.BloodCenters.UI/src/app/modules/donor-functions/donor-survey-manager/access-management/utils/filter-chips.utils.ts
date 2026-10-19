import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AccessManagementFilterValue } from '../models/access-management.model';

export class AccessManagementFilterChipsUtils {

  /**
   * Convert filter values to filter chips
   */
  static convertFiltersToChips(filters: AccessManagementFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.chapterId) {
      chips.push({
        key: 'chapterId',
        label: `Chapter ID: ${filters.chapterId}`,
        value: filters.chapterId
      });
    }

    if (filters.alertRequired) {
      chips.push({
        key: 'alertRequired',
        label: `Alert Required: ${filters.alertRequired}`,
        value: filters.alertRequired
      });
    }

    // Effective date chip: "Effective Date ≥ date" or "Effective Date ≤ date"
    if (filters.effectiveDateFrom) {
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ≥ ${this.formatDateForChip(filters.effectiveDateFrom)}`,
        value: filters.effectiveDateFrom,
        removable: true
      });
    } else if (filters.effectiveDateTo) {
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ≤ ${this.formatDateForChip(filters.effectiveDateTo)}`,
        value: filters.effectiveDateTo,
        removable: true
      });
    }

    // Termination date chip: same pattern
    if (filters.terminationDateFrom) {
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ≥ ${this.formatDateForChip(filters.terminationDateFrom)}`,
        value: filters.terminationDateFrom,
        removable: true
      });
    } else if (filters.terminationDateTo) {
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ≤ ${this.formatDateForChip(filters.terminationDateTo)}`,
        value: filters.terminationDateTo,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: AccessManagementFilterValue | null,
    chipKey: string
  ): AccessManagementFilterValue | null {
    if (!filters) return null;

    const newFilters: AccessManagementFilterValue = { ...filters };

    switch (chipKey) {
      case 'chapterId':
        newFilters.chapterId = null;
        break;

      case 'alertRequired':
        newFilters.alertRequired = null;
        break;

      case 'effectiveDate':
        newFilters.effectiveDateFrom = null;
        newFilters.effectiveDateTo = null;
        break;

      case 'terminationDate':
        newFilters.terminationDateFrom = null;
        newFilters.terminationDateTo = null;
        break;
    }

    // If all filters are cleared, return null
    return this.hasActiveFilters(newFilters) ? newFilters : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: AccessManagementFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.chapterId ||
      filters.alertRequired ||
      filters.effectiveDateFrom ||
      filters.effectiveDateTo ||
      filters.terminationDateFrom ||
      filters.terminationDateTo
    );
  }

  /**
   * Format date for display in chips (DD-MMM-YYYY)
   */
  private static formatDateForChip(dateStr: string): string {
    if (!dateStr) return '';
    try {
      // Parse as local date to avoid timezone issues
      // YYYY-MM-DD format
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const dayStr = String(date.getDate()).padStart(2, '0');
      const monthStr = months[date.getMonth()];
      const yearStr = date.getFullYear();
      return `${dayStr}-${monthStr}-${yearStr}`;
    } catch {
      return dateStr;
    }
  }
}