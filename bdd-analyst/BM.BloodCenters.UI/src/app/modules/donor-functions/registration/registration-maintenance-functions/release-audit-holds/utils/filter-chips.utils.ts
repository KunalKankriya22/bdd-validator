import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AuditHoldFilterValue } from '../models/release-audit-holds.model';

/**
 * Utility class for converting audit hold filters to filter chips
 */
export class AuditHoldFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: AuditHoldFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.donationType) {
      chips.push({
        key: 'donationType',
        label: `Donation Type: ${filters.donationType}`,
        value: filters.donationType,
        removable: true
      });
    }

    if (filters.donationProcedure) {
      chips.push({
        key: 'donationProcedure',
        label: `Donation Procedure: ${filters.donationProcedure}`,
        value: filters.donationProcedure,
        removable: true
      });
    }

    if (filters.auditHoldType) {
      chips.push({
        key: 'auditHoldType',
        label: `Audit Hold Type: ${filters.auditHoldType}`,
        value: filters.auditHoldType,
        removable: true
      });
    }

    if (filters.collectionDate) {
      chips.push({
        key: 'collectionDate',
        label: `Collection Date: ${filters.collectionDate}`,
        value: filters.collectionDate,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: AuditHoldFilterValue | null,
    chipKey: string
  ): AuditHoldFilterValue | null {
    if (!filters) return null;

    const updated: AuditHoldFilterValue = { ...filters };

    switch (chipKey) {
      case 'donationType':
        delete updated.donationType;
        break;
      case 'donationProcedure':
        delete updated.donationProcedure;
        break;
      case 'auditHoldType':
        delete updated.auditHoldType;
        break;
      case 'collectionDate':
        delete updated.collectionDate;
        break;
    }

    // Return null if no filters remain
    if (Object.keys(updated).length === 0) {
      return null;
    }

    return updated;
  }
}
