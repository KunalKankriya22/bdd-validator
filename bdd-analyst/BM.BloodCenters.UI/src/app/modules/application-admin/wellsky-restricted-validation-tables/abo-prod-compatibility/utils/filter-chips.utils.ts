import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ABOProdCompatibilityFilterValue } from '../models/abo-prod-compatibility.model';
import moment from 'moment';

export class ABOProdCompatibilityFilterChipsUtils {
  /**
   * Format date for display
   */
  private static formatDate(date: string | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  static convertFiltersToChips(filters: ABOProdCompatibilityFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.inventoryProductType) {
      chips.push({
        key: 'inventoryProductType',
        label: `Inventory Product Type: ${filters.inventoryProductType}`,
        value: filters.inventoryProductType
      });
    }

    if (filters.effectiveDateAfter) {
      chips.push({
        key: 'effectiveDateAfter',
        label: `Effective Date ≥ ${this.formatDate(filters.effectiveDateAfter)}`,
        value: filters.effectiveDateAfter
      });
    }

    if (filters.effectiveDateBefore) {
      chips.push({
        key: 'effectiveDateBefore',
        label: `Effective Date ≤ ${this.formatDate(filters.effectiveDateBefore)}`,
        value: filters.effectiveDateBefore
      });
    }

    if (filters.terminationDateAfter) {
      chips.push({
        key: 'terminationDateAfter',
        label: `Termination Date ≥ ${this.formatDate(filters.terminationDateAfter)}`,
        value: filters.terminationDateAfter
      });
    }

    if (filters.terminationDateBefore) {
      chips.push({
        key: 'terminationDateBefore',
        label: `Termination Date ≤ ${this.formatDate(filters.terminationDateBefore)}`,
        value: filters.terminationDateBefore
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ABOProdCompatibilityFilterValue | null,
    chipKey: string
  ): ABOProdCompatibilityFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'inventoryProductType':
        updatedFilters.inventoryProductType = null;
        break;
      case 'effectiveDateAfter':
        updatedFilters.effectiveDateAfter = null;
        break;
      case 'effectiveDateBefore':
        updatedFilters.effectiveDateBefore = null;
        break;
      case 'terminationDateAfter':
        updatedFilters.terminationDateAfter = null;
        break;
      case 'terminationDateBefore':
        updatedFilters.terminationDateBefore = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ABOProdCompatibilityFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.inventoryProductType ||
      filters.effectiveDateAfter ||
      filters.effectiveDateBefore ||
      filters.terminationDateAfter ||
      filters.terminationDateBefore
    );
  }
}
