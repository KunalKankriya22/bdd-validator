import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DriveCategoryRuleFilterValue } from '../models/drive-category-rules.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import moment from 'moment';

export class DriveCategoryRuleFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: DriveCategoryRuleFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Show Terminated chip
    if (filters.showTerminated) {
      chips.push({
        key: 'showTerminated',
        label: 'Show Terminated: Yes',
        value: true
      });
    }

    // Effective Date chip
    if (filters.effectiveDatePeriod && filters.effectiveDateValue) {
      const formattedDate = DateFieldValidationUtility.formatDateForUI(moment(filters.effectiveDateValue));
      const periodLabel = filters.effectiveDatePeriod === 'Before' ? 'Before' : 'After';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${periodLabel}: ${formattedDate}`,
        value: filters.effectiveDateValue
      });
    }

    // Termination Date chip
    if (filters.terminationDatePeriod && filters.terminationDateValue) {
      const formattedDate = DateFieldValidationUtility.formatDateForUI(moment(filters.terminationDateValue));
      const periodLabel = filters.terminationDatePeriod === 'Before' ? 'Before' : 'After';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${periodLabel}: ${formattedDate}`,
        value: filters.terminationDateValue
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key and return updated filters
   */
  static removeFilterByChipKey(
    filters: DriveCategoryRuleFilterValue | null,
    chipKey: string
  ): DriveCategoryRuleFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'showTerminated':
        updatedFilters.showTerminated = false;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDatePeriod = null;
        updatedFilters.effectiveDateValue = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDatePeriod = null;
        updatedFilters.terminationDateValue = null;
        break;
    }

    // If no active filters remain, return null
    if (!this.hasActiveFilters(updatedFilters)) {
      return null;
    }

    return updatedFilters;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: DriveCategoryRuleFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return filters.showTerminated ||
           (filters.effectiveDatePeriod !== null && filters.effectiveDateValue !== null) ||
           (filters.terminationDatePeriod !== null && filters.terminationDateValue !== null);
  }
}
