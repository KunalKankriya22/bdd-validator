import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidAboFilterValue } from '../models/valid-abo.model';

/**
 * Utility class for managing filter chips in Valid ABO table
 * Date chip pattern from Labeling Interdiction Override: Tech1
 */
export class ValidAboFilterChipsUtils {
  static convertFiltersToChips(filters: ValidAboFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.intendedUse) {
      chips.push({
        key: 'intendedUse',
        label: `Intended Use: ${filters.intendedUse}`,
        value: filters.intendedUse,
        removable: true
      });
    }

    if (filters.unitScheme) {
      chips.push({
        key: 'unitScheme',
        label: `Unit Scheme: ${filters.unitScheme}`,
        value: filters.unitScheme,
        removable: true
      });
    }

    if (filters.transfusionStatus) {
      chips.push({
        key: 'transfusionStatus',
        label: `Transfusion Status: ${filters.transfusionStatus}`,
        value: filters.transfusionStatus,
        removable: true
      });
    }

    // Effective date chip: "Effective Date ≥ date" or "Effective Date ≤ date"
    if (filters.effectiveDateFrom) {
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ≥ ${this.formatDateForChip(filters.effectiveDateFrom)}`,
        value: filters.effectiveDateFrom,
        removable: true
      });
    } else if (filters.effectiveDateTo) {
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ≤ ${this.formatDateForChip(filters.effectiveDateTo)}`,
        value: filters.effectiveDateTo,
        removable: true
      });
    }

    // Termination date chip: same pattern
    if (filters.terminationDateFrom) {
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ≥ ${this.formatDateForChip(filters.terminationDateFrom)}`,
        value: filters.terminationDateFrom,
        removable: true
      });
    } else if (filters.terminationDateTo) {
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ≤ ${this.formatDateForChip(filters.terminationDateTo)}`,
        value: filters.terminationDateTo,
        removable: true
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ValidAboFilterValue | null,
    chipKey: string
  ): ValidAboFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'intendedUse':
        updatedFilters.intendedUse = null;
        break;
      case 'unitScheme':
        updatedFilters.unitScheme = null;
        break;
      case 'transfusionStatus':
        updatedFilters.transfusionStatus = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDateFrom = null;
        updatedFilters.effectiveDateTo = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDateFrom = null;
        updatedFilters.terminationDateTo = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ValidAboFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.intendedUse ||
      filters.unitScheme ||
      filters.transfusionStatus ||
      filters.effectiveDateFrom ||
      filters.effectiveDateTo ||
      filters.terminationDateFrom ||
      filters.terminationDateTo
    );
  }

  static getEmptyFilters(): ValidAboFilterValue {
    return {
      intendedUse: null,
      unitScheme: null,
      transfusionStatus: null,
      effectiveDateFrom: null,
      effectiveDateTo: null,
      terminationDateFrom: null,
      terminationDateTo: null
    };
  }

  private static formatDateForChip(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const day = String(date.getDate()).padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  }
}
