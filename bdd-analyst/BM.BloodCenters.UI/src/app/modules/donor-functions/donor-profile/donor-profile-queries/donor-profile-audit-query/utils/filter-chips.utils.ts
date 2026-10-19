import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AuditFilterCriteria } from '../models/donor-profile-audit-query.model';
import moment from 'moment';

export class DonorProfileAuditQueryFilterChipsUtils {
  /**
   * Convert filter criteria to filter chips for display
   */
  static convertFiltersToChips(filters: AuditFilterCriteria | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.fromDate) {
      chips.push({
        key: 'fromDate',
        label: `From: ${this.formatDate(filters.fromDate)}`,
        value: filters.fromDate,
        removable: true
      });
    }

    if (filters.toDate) {
      chips.push({
        key: 'toDate',
        label: `To: ${this.formatDate(filters.toDate)}`,
        value: filters.toDate,
        removable: true
      });
    }

    if (filters.insertedUser) {
      chips.push({
        key: 'insertedUser',
        label: `User: ${filters.insertedUser}`,
        value: filters.insertedUser,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    currentFilters: AuditFilterCriteria | null,
    chipKey: string
  ): AuditFilterCriteria | null {
    if (!currentFilters) return null;

    const updatedFilters = { ...currentFilters };

    switch (chipKey) {
      case 'fromDate':
        delete updatedFilters.fromDate;
        break;
      case 'toDate':
        delete updatedFilters.toDate;
        break;
      case 'insertedUser':
        delete updatedFilters.insertedUser;
        break;
    }

    // Return null if no filters remain
    if (Object.keys(updatedFilters).length === 0) {
      return null;
    }

    return updatedFilters;
  }

  private static formatDate(dateString: string): string {
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }
}
