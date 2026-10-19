import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SurveyTemplateFilterValue } from '../models/survey-template.model';
import moment from 'moment';

/**
 * SurveyTemplateFilterChipsUtils
 * Utility functions for converting filters to filter chips and managing filter state
 */
export class SurveyTemplateFilterChipsUtils {

  /**
   * Convert filter values to filter chips for display
   * @param filters Current filter values
   * @returns Array of filter chips
   */
  static convertFiltersToChips(filters: SurveyTemplateFilterValue): FilterChip[] {
    const chips: FilterChip[] = [];

    // Effective Date filter chip
    if (filters.effDate && filters.effDatePeriod) {
      const operator = this.periodToOperator(filters.effDatePeriod);
      const dateStr = moment(filters.effDate).format('DD-MMM-YYYY').toUpperCase();
      chips.push({
        key: 'effDate',
        label: `Effective Date ${operator} ${dateStr}`,
        value: filters.effDate,
        removable: true
      });
    }

    // Status filter chip
    if (filters.status) {
      chips.push({
        key: 'status',
        label: `Status: ${filters.status}`,
        value: filters.status,
        removable: true
      });
    }

    // Termination Date filter chip
    if (filters.termDate && filters.termDatePeriod) {
      const operator = this.periodToOperator(filters.termDatePeriod);
      const dateStr = moment(filters.termDate).format('DD-MMM-YYYY').toUpperCase();
      chips.push({
        key: 'termDate',
        label: `Termination Date ${operator} ${dateStr}`,
        value: filters.termDate,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   * @param filters Current filter values
   * @param chipKey Key of the filter chip to remove
   * @returns Updated filter values
   */
  static removeFilterByChipKey(
    filters: SurveyTemplateFilterValue,
    chipKey: string
  ): SurveyTemplateFilterValue {
    const updated = { ...filters };

    if (chipKey === 'effDate') {
      updated.effDate = null;
      updated.effDatePeriod = null;
    } else if (chipKey === 'termDate') {
      updated.termDate = null;
      updated.termDatePeriod = null;
    } else if (chipKey === 'status') {
      updated.status = null;
    }

    return updated;
  }

  /**
   * Check if any filters are active
   * @param filters Current filter values
   * @returns True if any filters are active
   */
  static hasActiveFilters(filters: SurveyTemplateFilterValue | null): boolean {
    if (!filters) return false;
    return this.convertFiltersToChips(filters).length > 0;
  }

  /**
   * Convert period value to operator symbol
   * @param period Period value ('after' or 'before')
   * @returns Operator symbol ('≥' or '≤')
   */
  private static periodToOperator(period: string): string {
    return period === 'after' ? '≥' : '≤';
  }
}
