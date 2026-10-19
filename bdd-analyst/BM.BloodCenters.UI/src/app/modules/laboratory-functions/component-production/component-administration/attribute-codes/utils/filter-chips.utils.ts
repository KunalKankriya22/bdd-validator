import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

export interface AttributeCodeFilterCriteria {
  labelling?: string;
  exclusivityFlag?: string;
  effectiveDatePeriod?: string;
  effectiveDate?: string;
  terminationDatePeriod?: string;
  terminationDate?: string;
}

export class AttributeCodeFilterChipsUtils {
  /**
   * Convert filter criteria to filter chips for display
   */
  static convertFiltersToChips(filters: AttributeCodeFilterCriteria | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.labelling) {
      chips.push({
        key: 'labelling',
        label: `Labelling: ${filters.labelling}`,
        value: filters.labelling,
        removable: true
      });
    }

    if (filters.exclusivityFlag) {
      chips.push({
        key: 'exclusivityFlag',
        label: `Exclusivity Flag: ${filters.exclusivityFlag}`,
        value: filters.exclusivityFlag,
        removable: true
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${filters.effectiveDatePeriod}: ${this.formatDate(filters.effectiveDate)}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${filters.terminationDatePeriod}: ${this.formatDate(filters.terminationDate)}`,
        value: filters.terminationDate,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    currentFilters: AttributeCodeFilterCriteria | null,
    chipKey: string
  ): AttributeCodeFilterCriteria | null {
    if (!currentFilters) return null;

    const updatedFilters = { ...currentFilters };

    switch (chipKey) {
      case 'labelling':
        delete updatedFilters.labelling;
        break;
      case 'exclusivityFlag':
        delete updatedFilters.exclusivityFlag;
        break;
      case 'effectiveDate':
        delete updatedFilters.effectiveDate;
        delete updatedFilters.effectiveDatePeriod;
        break;
      case 'terminationDate':
        delete updatedFilters.terminationDate;
        delete updatedFilters.terminationDatePeriod;
        break;
    }

    // Return null if no filters remain
    if (Object.keys(updatedFilters).length === 0) {
      return null;
    }

    return updatedFilters;
  }

  private static formatDate(dateString: string): string {
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }
}
