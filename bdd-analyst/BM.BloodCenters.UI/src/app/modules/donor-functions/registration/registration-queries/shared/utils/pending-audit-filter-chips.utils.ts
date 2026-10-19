import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonationTypeOption, ProcedureCodeOption, PendingAuditFilterValue } from '../models/pending-audit-query.model';

/**
 * Shared utility for pending audit filter chips (donations and deferrals)
 */
export class PendingAuditFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static toFilterChips(
    filters: PendingAuditFilterValue,
    donationTypeOptions: DonationTypeOption[],
    procedureCodeOptions: ProcedureCodeOption[]
  ): FilterChip[] {
    const chips: FilterChip[] = [];

    // Donation Type filter
    if (filters.donationType) {
      const option = donationTypeOptions?.find(o => o?.value === filters.donationType);
      const label = option?.label || filters.donationType;
      chips.push({
        key: 'donationType',
        label: `Donation Type: ${label}`,
        value: filters.donationType
      });
    }

    // Procedure Code filter
    if (filters.procedureCode) {
      const option = procedureCodeOptions?.find(o => o?.value === filters.procedureCode);
      const label = option?.label || filters.procedureCode;
      chips.push({
        key: 'procedureCode',
        label: `Procedure Code: ${label}`,
        value: filters.procedureCode
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilter(
    currentFilters: PendingAuditFilterValue,
    chipKey: string
  ): PendingAuditFilterValue {
    const updated = { ...currentFilters };

    switch (chipKey) {
      case 'donationType':
        updated.donationType = null;
        break;
      case 'procedureCode':
        updated.procedureCode = null;
        break;
    }

    return updated;
  }

  /**
   * Clear all filters
   */
  static clearAll(): PendingAuditFilterValue {
    return {
      donationType: null,
      procedureCode: null
    };
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: PendingAuditFilterValue): boolean {
    return !!(
      filters.donationType ||
      filters.procedureCode
    );
  }
}
