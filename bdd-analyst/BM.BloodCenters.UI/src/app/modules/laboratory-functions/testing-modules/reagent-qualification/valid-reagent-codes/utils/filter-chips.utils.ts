import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidReagentCodeFilterValue } from '../models/valid-reagent-code.model';

/**
 * Utility functions for converting ValidReagentCodeFilterValue to FilterChips
 */
export class ValidReagentCodeFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: ValidReagentCodeFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    // Test ID is selected in main form, not shown as filter chip

    // Show Terminated filter
    if (filters.showTerminated) {
      const label = filters.showTerminated === 'Y' ? 'Show Terminated: Yes' : 'Show Terminated: No';
      chips.push({
        key: 'showTerminated',
        label: label,
        value: filters.showTerminated,
        removable: true
      });
    }

    // R Type filter
    if (filters.reagentType) {
      const typeLabels: Record<string, string> = {
        'R': 'R-Reagent',
        'C': 'C-Control',
        'S': 'S-Substrate'
      };
      chips.push({
        key: 'reagentType',
        label: `R Type: ${typeLabels[filters.reagentType] || filters.reagentType}`,
        value: filters.reagentType,
        removable: true
      });
    }

    // Control Indicator filter
    if (filters.controlFlag) {
      const controlLabels: Record<string, string> = {
        'P': 'POS',
        'N': 'NEG'
      };
      chips.push({
        key: 'controlFlag',
        label: `Control: ${controlLabels[filters.controlFlag] || filters.controlFlag}`,
        value: filters.controlFlag,
        removable: true
      });
    }

    // Effective Date filter
    if (filters.effectiveDatePeriod && filters.effectiveDateAfter) {
      const formattedDate = this.formatDate(filters.effectiveDateAfter);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${this.getPeriodSign(filters.effectiveDatePeriod)} ${formattedDate}`,
        value: filters.effectiveDatePeriod,
        removable: true
      });
    }

    // Termination Date filter
    if (filters.terminationDatePeriod && filters.terminationDateAfter) {
      const formattedDate = this.formatDate(filters.terminationDateAfter);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${this.getPeriodSign(filters.terminationDatePeriod)} ${formattedDate}`,
        value: filters.terminationDatePeriod,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: ValidReagentCodeFilterValue | null,
    chipKey: string
  ): ValidReagentCodeFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'showTerminated':
        updatedFilters.showTerminated = null;
        break;
      case 'reagentType':
        updatedFilters.reagentType = null;
        updatedFilters.controlFlag = null; // Also clear control flag when R Type is removed
        break;
      case 'controlFlag':
        updatedFilters.controlFlag = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDatePeriod = null;
        updatedFilters.effectiveDateAfter = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDatePeriod = null;
        updatedFilters.terminationDateAfter = null;
        break;
      default:
        break;
    }

    return updatedFilters;
  }

  /**
   * Get period sign for filter chip display
   */
  private static getPeriodSign(period: string): string {
    switch (period) {
      case 'After':
      case 'On or After':
        return '≥';
      case 'Before':
      case 'On or Before':
        return '≤';
      default:
        return period;
    }
  }

  /**
   * Format date for chip display (DD-MON-YYYY)
   */
  private static formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }
}
