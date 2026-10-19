import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SpecialDriveFilterValue } from '../special-drive-filter-panel/special-drive-filter-panel';

export class SpecialDriveFilterChipsUtils {
  static convertFiltersToChips(filters: SpecialDriveFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.driveId) {
      chips.push({
        key: 'driveId',
        label: `Drive ID: ${filters.driveId}`,
        value: filters.driveId
      });
    }

    if (filters.sponsorId) {
      chips.push({
        key: 'sponsorId',
        label: `Sponsor ID: ${filters.sponsorId}`,
        value: filters.sponsorId
      });
    }

    if (filters.driveType) {
      const typeLabel = this.getDriveTypeLabel(filters.driveType);
      chips.push({
        key: 'driveType',
        label: `Drive Type: ${typeLabel}`,
        value: filters.driveType
      });
    }

    if (filters.category) {
      chips.push({
        key: 'category',
        label: `Category: ${filters.category}`,
        value: filters.category
      });
    }

    if (filters.driveDate) {
      const formattedDate = this.formatDate(filters.driveDate);
      chips.push({
        key: 'driveDate',
        label: `Drive Date: ${formattedDate}`,
        value: filters.driveDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    currentFilters: SpecialDriveFilterValue | null,
    chipKey: string
  ): SpecialDriveFilterValue | null {
    if (!currentFilters) {
      return null;
    }

    const updatedFilters = { ...currentFilters };

    switch (chipKey) {
      case 'driveId':
        updatedFilters.driveId = null;
        break;
      case 'sponsorId':
        updatedFilters.sponsorId = null;
        break;
      case 'driveType':
        updatedFilters.driveType = null;
        break;
      case 'category':
        updatedFilters.category = null;
        break;
      case 'driveDate':
        updatedFilters.driveDate = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: SpecialDriveFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.driveId ||
      filters.sponsorId ||
      filters.driveType ||
      filters.category ||
      filters.driveDate
    );
  }

  private static getDriveTypeLabel(value: string): string {
    const typeMap: { [key: string]: string } = {
      'F': 'Fixed',
      'I': 'Inside',
      'C': 'Coach'
    };
    return typeMap[value] || value;
  }

  private static formatDate(date: Date | string): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
