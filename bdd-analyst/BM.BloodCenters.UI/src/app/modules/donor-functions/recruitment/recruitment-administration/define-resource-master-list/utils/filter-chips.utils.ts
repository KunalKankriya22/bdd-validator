import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineResourceMasterListFilterValue } from '../models/define-resource-master-list.model';

export class DefineResourceMasterListFilterChipsUtils {
  /**
   * Format date to display string
   */
  private static formatDate(date: Date | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: DefineResourceMasterListFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.resourceCode) {
      chips.push({
        key: 'resourceCode',
        label: `Resource Code: ${filters.resourceCode}`,
        value: filters.resourceCode
      });
    }

    if (filters.type) {
      chips.push({
        key: 'type',
        label: `Type: ${filters.type}`,
        value: filters.type
      });
    }

    if (filters.sequence !== null && filters.sequence !== undefined) {
      chips.push({
        key: 'sequence',
        label: `Sequence: ${filters.sequence}`,
        value: filters.sequence
      });
    }

    if (filters.critical) {
      chips.push({
        key: 'critical',
        label: `Critical: ${filters.critical}`,
        value: filters.critical
      });
    }

    if (filters.showTermination) {
      chips.push({
        key: 'showTermination',
        label: `Show Termination: ${filters.showTermination}`,
        value: filters.showTermination
      });
    }

    if (filters.effectiveDate && filters.periodType1) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const symbol = (filters.periodType1 === 'After' || filters.periodType1 === 'On or After') ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.periodType2) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const symbol = (filters.periodType2 === 'After' || filters.periodType2 === 'On or After') ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: DefineResourceMasterListFilterValue | null,
    chipKey: string
  ): DefineResourceMasterListFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'resourceCode':
        updatedFilters.resourceCode = null;
        break;
      case 'type':
        updatedFilters.type = null;
        break;
      case 'sequence':
        updatedFilters.sequence = null;
        break;
      case 'critical':
        updatedFilters.critical = null;
        break;
      case 'showTermination':
        updatedFilters.showTermination = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.periodType1 = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.periodType2 = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: DefineResourceMasterListFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.resourceCode ||
      filters.type ||
      (filters.sequence !== null && filters.sequence !== undefined) ||
      filters.critical ||
      filters.showTermination ||
      (filters.effectiveDate && filters.periodType1) ||
      (filters.terminationDate && filters.periodType2)
    );
  }
}
