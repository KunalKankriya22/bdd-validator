import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InterdictionUpgradeMatrixFilterValue } from '../models/interdiction-upgrade-matrix.model';

export class InterdictionUpgradeMatrixFilterChipsUtils {
  /**
   * Map backend Action value to frontend display value
   * Backend: P or R
   * Frontend: Place or Release
   */
  private static mapActionToDisplay(action: string): string {
    if (action === 'P') return 'Place';
    if (action === 'R') return 'Release';
    return action; // Fallback to original value
  }

  static convertFiltersToChips(filters: InterdictionUpgradeMatrixFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.sourceInterdiction) {
      chips.push({
        key: 'sourceInterdiction',
        label: `Source Interdiction: ${filters.sourceInterdiction}`,
        value: filters.sourceInterdiction
      });
    }

    if (filters.existingInterdiction) {
      chips.push({
        key: 'existingInterdiction',
        label: `Existing Interdiction: ${filters.existingInterdiction}`,
        value: filters.existingInterdiction
      });
    }

    if (filters.actionInterdiction) {
      chips.push({
        key: 'actionInterdiction',
        label: `Action Interdiction: ${filters.actionInterdiction}`,
        value: filters.actionInterdiction
      });
    }

    if (filters.action) {
      // Display the action in user-friendly format (Place/Release) instead of backend format (P/R)
      const displayValue = this.mapActionToDisplay(filters.action);
      chips.push({
        key: 'action',
        label: `Action: ${displayValue}`,
        value: filters.action
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: InterdictionUpgradeMatrixFilterValue | null,
    chipKey: string
  ): InterdictionUpgradeMatrixFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'sourceInterdiction':
        updatedFilters.sourceInterdiction = null;
        break;
      case 'existingInterdiction':
        updatedFilters.existingInterdiction = null;
        break;
      case 'actionInterdiction':
        updatedFilters.actionInterdiction = null;
        break;
      case 'action':
        updatedFilters.action = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: InterdictionUpgradeMatrixFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.sourceInterdiction ||
      filters.existingInterdiction ||
      filters.actionInterdiction ||
      filters.action
    );
  }
}
