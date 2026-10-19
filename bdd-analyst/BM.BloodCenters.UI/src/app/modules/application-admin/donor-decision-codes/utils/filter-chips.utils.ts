import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonorDecisionCodeFilterValue } from '../models/donor-decision-codes.model';

/**
 * Utility class for converting filter values to filter chips
 */
export class FilterChipsUtils {

  /**
   * Convert DonorDecisionCodeFilterValue to FilterChip array
   * @param filters - The filter values from the filter panel
   * @param formatDate - Optional date formatter function
   * @returns Array of FilterChip objects
   */
  static convertFiltersToChips(
    filters: DonorDecisionCodeFilterValue | null,
    formatDate?: (date: Date | null) => string
  ): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Barcode
    if (filters.barcode) {
      chips.push({
        key: 'barcode',
        label: `Barcode: ${filters.barcode}`,
        value: filters.barcode,
        removable: true
      });
    }

    // Donor Decision Code
    if (filters.donorDecisionCode) {
      chips.push({
        key: 'donorDecisionCode',
        label: `Donor Decision Code: ${filters.donorDecisionCode}`,
        value: filters.donorDecisionCode,
        removable: true
      });
    }

    // Effective Date with Period
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const dateStr = formatDate ? formatDate(filters.effectiveDate) : this.defaultFormatDate(filters.effectiveDate);

      const operator = filters.effectiveDatePeriod === 'After' ? '≥' : '≤';

      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${dateStr}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    // Termination Date with Period
    if (filters.terminationDate && filters.terminationDatePeriod) {
      const dateStr = formatDate ? formatDate(filters.terminationDate) : this.defaultFormatDate(filters.terminationDate);

      const operator = filters.terminationDatePeriod === 'After' ? '≥' : '≤';

      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${dateStr}`,
        value: filters.terminationDate,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Default date formatter (DD-MMM-YYYY format)
   */
  private static defaultFormatDate(date: Date | null): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Remove a specific filter from filter values
   * @param filters - Current filter values
   * @param chipKey - The key of the chip to remove
   * @returns Updated filter values with the specified filter removed
   */
  static removeFilterByChipKey(
    filters: DonorDecisionCodeFilterValue | null,
    chipKey: string
  ): DonorDecisionCodeFilterValue {
    if (!filters) {
      return this.getEmptyFilters();
    }

    const updated = { ...filters };

    switch (chipKey) {
      case 'barcode':
        updated.barcode = null;
        break;
      case 'donorDecisionCode':
        updated.donorDecisionCode = null;
        break;
      case 'effectiveDate':
        updated.effectiveDate = null;
        updated.effectiveDatePeriod = null;
        break;
      case 'terminationDate':
        updated.terminationDate = null;
        updated.terminationDatePeriod = null;
        break;
    }

    return updated;
  }

  /**
   * Check if filters object has any active filters
   * @param filters - Filter values to check
   * @returns true if any filter is active
   */
  static hasActiveFilters(filters: DonorDecisionCodeFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    // Check each filter using the same logic as convertFiltersToChips
    const hasBarcode = !!filters.barcode;
    const hasDonorDecisionCode = !!filters.donorDecisionCode;
    const hasEffectiveDate = !!filters.effectiveDate && !!filters.effectiveDatePeriod;
    const hasTerminationDate = !!filters.terminationDate && !!filters.terminationDatePeriod;

    return hasBarcode || hasDonorDecisionCode || hasEffectiveDate || hasTerminationDate;
  }

  /**
   * Get empty filters object
   * @returns Empty DonorDecisionCodeFilterValue
   */
  static getEmptyFilters(): DonorDecisionCodeFilterValue {
    return {
      barcode: null,
      donorDecisionCode: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    };
  }
}
