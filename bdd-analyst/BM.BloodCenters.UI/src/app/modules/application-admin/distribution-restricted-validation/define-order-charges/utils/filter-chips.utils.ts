import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { OrderChargesFilterFormValue } from '../models/define-order-charges.model';

/**
 * Utility class for converting filter form values to display chips
 * and handling chip removal
 */
export class DefineOrderChargesFilterChipsUtils {
  /**
   * Convert filter form values to FilterChip array for display
   */
  static convertFiltersToChips(filters: OrderChargesFilterFormValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    // Service Code filter
    if (filters.serviceCode) {
      chips.push({
        key: 'serviceCode',
        label: `Service Code: ${filters.serviceCode}`,
        value: filters.serviceCode
      });
    }

    // Effective Date filter
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = this.formatDateForDisplay(filters.effectiveDate);
      const periodLabel = filters.effectiveDatePeriod === 'AFTER' ? 'After' : 'Before';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${periodLabel}: ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    // Termination Date filter
    if (filters.terminationDate && filters.terminationDatePeriod) {
      const formattedDate = this.formatDateForDisplay(filters.terminationDate);
      const periodLabel = filters.terminationDatePeriod === 'AFTER' ? 'After' : 'Before';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${periodLabel}: ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Format date from YYYY-MM-DD to DD-MMM-YYYY for display
   */
  private static formatDateForDisplay(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Remove a specific filter by chip key and return updated filters
   */
  static removeFilterByChipKey(
    filters: OrderChargesFilterFormValue | null,
    chipKey: string
  ): OrderChargesFilterFormValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    if (chipKey === 'serviceCode') {
      delete updated.serviceCode;
    } else if (chipKey === 'effectiveDate') {
      delete updated.effectiveDate;
      delete updated.effectiveDatePeriod;
    } else if (chipKey === 'terminationDate') {
      delete updated.terminationDate;
      delete updated.terminationDatePeriod;
    }

    // Return null if no filters remain
    return Object.keys(updated).length > 0 ? updated : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: OrderChargesFilterFormValue | null): boolean {
    if (!filters) return false;

    return !!filters.serviceCode || !!filters.effectiveDate || !!filters.terminationDate;
  }
}
