import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PhysicalFindingsTemplateFilterValue } from '../models/physical-findings-template.model';

/**
 * Utility class for managing filter chips in Physical Findings Template
 */
export class PhysicalFindingsTemplateFilterChipsUtils {
  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: PhysicalFindingsTemplateFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.showInactive) {
      chips.push({
        key: 'showInactive',
        label: 'Show inactive templates',
        value: 'Yes',
        removable: true
      });
    }

    if (filters.donationType) {
      chips.push({
        key: 'donationType',
        label: `Donation Type: ${filters.donationType}`,
        value: filters.donationType,
        removable: true
      });
    }

    if (filters.procedureCode) {
      chips.push({
        key: 'procedureCode',
        label: `Procedure Code: ${filters.procedureCode}`,
        value: filters.procedureCode,
        removable: true
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const dateValue = filters.effectiveDate instanceof Date
        ? filters.effectiveDate
        : new Date(filters.effectiveDate as string);
      const symbol = filters.effectiveDatePeriod === 'after' ? '≥' : '≤';
      const formattedDate = PhysicalFindingsTemplateFilterChipsUtils.formatDate(dateValue);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const dateValue = filters.terminationDate instanceof Date
        ? filters.terminationDate
        : new Date(filters.terminationDate as string);
      const symbol = filters.terminationDatePeriod === 'after' ? '≥' : '≤';
      const formattedDate = PhysicalFindingsTemplateFilterChipsUtils.formatDate(dateValue);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key and return updated filter values
   */
  static removeFilterByChipKey(
    currentFilters: PhysicalFindingsTemplateFilterValue | null,
    chipKey: string
  ): PhysicalFindingsTemplateFilterValue | null {
    if (!currentFilters) {
      return null;
    }

    const updatedFilters = { ...currentFilters };

    switch (chipKey) {
      case 'showInactive':
        updatedFilters.showInactive = false;
        break;
      case 'donationType':
        updatedFilters.donationType = null;
        updatedFilters.procedureCode = null;
        break;
      case 'procedureCode':
        updatedFilters.procedureCode = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectiveDatePeriod = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationDatePeriod = null;
        break;
    }

    // Check if all filters are cleared
    if (
      !updatedFilters.showInactive &&
      !updatedFilters.donationType &&
      !updatedFilters.procedureCode &&
      !updatedFilters.effectiveDate &&
      !updatedFilters.terminationDate
    ) {
      return null;
    }

    return updatedFilters;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: PhysicalFindingsTemplateFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.showInactive ||
      filters.donationType ||
      filters.procedureCode ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }

  /**
   * Format date to DD-MMM-YYYY format (e.g., 01-JAN-2025)
   */
  private static formatDate(date: Date): string {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

}
