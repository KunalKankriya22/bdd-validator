import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonationsFilterValue, DonorsFilterValue } from '../models/interdiction-query.model';

export class InterdictionQueryFilterChipsUtils {
  /**
   * Format date to display string
   */
  private static formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Map period text to symbol sign
   */
  private static getPeriodSign(period: string): string {
    switch (period) {
      case 'After':
      case 'On or After': return '≥';
      case 'Before':
      case 'On or Before': return '≤';
      default: return period;
    }
  }

  /**
   * Convert Donations filter values to display chips
   * @param filters - The filter values
   * @param optionType - The option type ('Interdiction' or 'Hold') to determine label text
   */
  static convertDonationsFiltersToChips(filters: DonationsFilterValue | null, optionType: 'Interdiction' | 'Hold' = 'Interdiction'): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.donationType) {
      chips.push({
        key: 'donationType',
        label: `Donation Type: ${filters.donationType}`,
        value: filters.donationType
      });
    }

    if (filters.showReleased !== null && filters.showReleased !== undefined) {
      // Use different label based on option type
      const label = optionType === 'Hold' ? 'Show Terminated' : 'Show Released';
      chips.push({
        key: 'showReleased',
        label: `${label}: ${filters.showReleased ? 'Yes' : 'No'}`,
        value: filters.showReleased
      });
    }

    if (filters.effectiveDate && filters.effectivePeriod) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${this.getPeriodSign(filters.effectivePeriod)} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationPeriod) {
      const formattedDate = this.formatDate(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${this.getPeriodSign(filters.terminationPeriod)} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    if (filters.unitId) {
      chips.push({
        key: 'unitId',
        label: `Unit ID: ${filters.unitId}`,
        value: filters.unitId
      });
    }

    return chips;
  }

  /**
   * Convert Donors filter values to display chips
   */
  static convertDonorsFiltersToChips(filters: DonorsFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.showTerminated === false) {
      chips.push({
        key: 'showTerminated',
        label: 'Show Terminated: No',
        value: false
      });
    }

    if (filters.sex === 'M') {
      chips.push({ key: 'sex', label: 'Sex: Male', value: 'M' });
    } else if (filters.sex === 'F') {
      chips.push({ key: 'sex', label: 'Sex: Female', value: 'F' });
    }

    return chips;
  }

  /**
   * Remove a specific Donations filter by chip key
   */
  static removeDonationsFilterByChipKey(
    filters: DonationsFilterValue | null,
    chipKey: string
  ): DonationsFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'donationType':
        updatedFilters.donationType = null;
        break;
      case 'showReleased':
        updatedFilters.showReleased = null; // Reset to default (empty)
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectivePeriod = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationPeriod = null;
        break;
      case 'unitId':
        updatedFilters.unitId = null;
        break;
    }

    return this.hasDonationsActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Remove a specific Donors filter by chip key
   */
  static removeDonorsFilterByChipKey(
    filters: DonorsFilterValue | null,
    chipKey: string
  ): DonorsFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'showTerminated':
        updatedFilters.showTerminated = true;
        break;
      case 'sex':
        updatedFilters.sex = '';
        break;
    }

    return this.hasDonorsActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any Donations filters are active
   */
  static hasDonationsActiveFilters(filters: DonationsFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.donationType ||
      (filters.showReleased !== null && filters.showReleased !== undefined) ||
      (filters.effectiveDate && filters.effectivePeriod) ||
      (filters.terminationDate && filters.terminationPeriod) ||
      filters.unitId
    );
  }

  /**
   * Check if any Donors filters are active
   */
  static hasDonorsActiveFilters(filters: DonorsFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return filters.showTerminated === false || !!filters.sex;
  }
}
