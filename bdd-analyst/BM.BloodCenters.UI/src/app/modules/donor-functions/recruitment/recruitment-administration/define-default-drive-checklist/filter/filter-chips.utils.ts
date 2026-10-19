import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DriveChecklistFilterValue } from '../models/define-default-drive-checklist.model';

export class DriveChecklistFilterChipsUtils {
  /**
   * Map Timeline value to display value
   * Comma-separated values like "BD,AD" need to be parsed and displayed
   */
  private static mapTimelineToDisplay(timeline: string): string {
    if (!timeline) return '';

    // Split by comma and map each value
    const values = timeline.split(',').map(val => val.trim());
    const displayValues = values.map(val => {
      if (val === 'AD') return 'After Drive';
      if (val === 'BD') return 'Before Drive';
      if (val === 'DD') return 'On Drive Date';
      if (val === 'CD') return 'After Creation';
      return val;
    });

    return displayValues.join(', ');
  }

  /**
   * Map condition to display symbol
   * GE = >=, LE = <=, EQ = =
   */
  private static mapConditionToSymbol(condition: string): string {
    if (condition === 'GE') return '≥';
    if (condition === 'LE') return '≤';
    if (condition === 'EQ') return '=';
    return condition;
  }

  static convertFiltersToChips(filters: DriveChecklistFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.condition && filters.noOfDays !== null && filters.noOfDays !== undefined) {
      const conditionSymbol = this.mapConditionToSymbol(filters.condition);
      chips.push({
        key: 'conditionAndDays',
        label: `No. of Days: ${conditionSymbol} ${filters.noOfDays}`,
        value: `${filters.condition}${filters.noOfDays}`
      });
    } else if (filters.noOfDays !== null && filters.noOfDays !== undefined) {
      chips.push({
        key: 'noOfDays',
        label: `No. of Days: ${filters.noOfDays}`,
        value: filters.noOfDays.toString()
      });
    }

    if (filters.timeline) {
      const displayValue = this.mapTimelineToDisplay(filters.timeline);
      chips.push({
        key: 'timeline',
        label: `Timeline: ${displayValue}`,
        value: filters.timeline
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: DriveChecklistFilterValue | null,
    chipKey: string
  ): DriveChecklistFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'conditionAndDays':
      case 'noOfDays':
        updatedFilters.condition = null;
        updatedFilters.noOfDays = null;
        break;
      case 'timeline':
        updatedFilters.timeline = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: DriveChecklistFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      (filters.noOfDays !== null && filters.noOfDays !== undefined) ||
      filters.timeline ||
      filters.condition
    );
  }
}
