import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { TemporaryDriveFilterValue } from '../models/temporary-drive-filter.model';

export class TemporaryDriveFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(
    filters: TemporaryDriveFilterValue | null,
    sponsorName?: string  // Need sponsor name for display
  ): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.driveDate) {
      chips.push({
        key: 'driveDate',
        label: 'Drive Date',
        value: this.formatDate(filters.driveDate),
        removable: true
      });
    }

    if (filters.sponsorId && sponsorName) {
      chips.push({
        key: 'sponsorId',
        label: 'Sponsor',
        value: sponsorName,
        removable: true
      });
    }

    if (filters.driveType) {
      chips.push({
        key: 'driveType',
        label: 'Drive Type',
        value: filters.driveType,
        removable: true
      });
    }

    if (filters.driveCategory) {
      chips.push({
        key: 'driveCategory',
        label: 'Category',
        value: filters.driveCategory,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: TemporaryDriveFilterValue | null,
    chipKey: string
  ): TemporaryDriveFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'driveDate':
        updatedFilters.driveDate = null;
        break;
      case 'sponsorId':
        updatedFilters.sponsorId = null;
        break;
      case 'driveType':
        updatedFilters.driveType = null;
        break;
      case 'driveCategory':
        updatedFilters.driveCategory = null;
        break;
    }

    // Return null if all filters are cleared
    const hasActiveFilters = !!(
      updatedFilters.driveDate ||
      updatedFilters.sponsorId ||
      updatedFilters.driveType ||
      updatedFilters.driveCategory
    );

    return hasActiveFilters ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: TemporaryDriveFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.driveDate ||
      filters.sponsorId ||
      filters.driveType ||
      filters.driveCategory
    );
  }

  /**
   * Format date for display in chip
   */
  private static formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
