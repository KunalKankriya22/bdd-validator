import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonorInterdictionOverrideFilterValue, getInterTypeDisplay } from '../models/donor-interdiction-override.model';
import moment from 'moment';

export class DonorInterdictionOverrideFilterChipsUtils {

  private static readonly PERIOD_DISPLAY_MAP: Record<string, string> = {
    'after': '≥',
    'before': '≤'
  };

  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: DonorInterdictionOverrideFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.donorDecisionCode) {
      const displayValue = filters.donorDecisionCodeDisplay || filters.donorDecisionCode;
      chips.push({
        key: 'donorDecisionCode',
        label: `Cue: ${displayValue}`,
        value: displayValue
      });
    }

    if (filters.interType) {
      const displayValue = filters.interTypeDisplay || getInterTypeDisplay(filters.interType);
      chips.push({
        key: 'interType',
        label: `Type: ${displayValue}`,
        value: displayValue
      });
    }

    if (filters.effectiveDate) {
      const periodDisplay = filters.effectiveDatePeriod
        ? this.PERIOD_DISPLAY_MAP[filters.effectiveDatePeriod] || filters.effectiveDatePeriod
        : '=';
      const dateDisplay = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
      const displayValue = `${periodDisplay} ${dateDisplay}`;
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${displayValue}`,
        value: displayValue
      });
    }

    if (filters.terminationDate) {
      const periodDisplay = filters.terminationDatePeriod
        ? this.PERIOD_DISPLAY_MAP[filters.terminationDatePeriod] || filters.terminationDatePeriod
        : '=';
      const dateDisplay = moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase();
      const displayValue = `${periodDisplay} ${dateDisplay}`;
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${displayValue}`,
        value: displayValue
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key and return updated filters
   */
  static removeFilterByChipKey(
    filters: DonorInterdictionOverrideFilterValue | null,
    chipKey: string
  ): DonorInterdictionOverrideFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'donorDecisionCode':
        updatedFilters.donorDecisionCode = null;
        updatedFilters.donorDecisionCodeDisplay = null;
        break;
      case 'interType':
        updatedFilters.interType = null;
        updatedFilters.interTypeDisplay = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDatePeriod = null;
        updatedFilters.effectiveDate = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDatePeriod = null;
        updatedFilters.terminationDate = null;
        break;
    }

    // Check if all filters are cleared
    const hasActiveFilters = this.hasActiveFilters(updatedFilters);
    return hasActiveFilters ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: DonorInterdictionOverrideFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.donorDecisionCode ||
      filters.interType ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }
}
