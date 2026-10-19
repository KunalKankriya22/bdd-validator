import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ProductTypeFilterValue } from '../models/product-type.model';

export class FilterChipsUtils {
  static convertFiltersToChips(filters: ProductTypeFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.productClass) {
      chips.push({
        key: 'productClass',
        label: `Class: ${filters.productClass}`,
        value: filters.productClass
      });
    }

    if (filters.aboOnly) {
      chips.push({
        key: 'aboOnly',
        label: `ABO Only: ${filters.aboOnly === 'Y' ? 'Yes' : 'No'}`,
        value: filters.aboOnly === 'Y' ? 'Yes' : 'No'
      });
    }

    if (filters.attribFlag) {
      chips.push({
        key: 'attribFlag',
        label: `Accepted in Definition: ${filters.attribFlag === 'Y' ? 'Yes' : 'No'}`,
        value: filters.attribFlag === 'Y' ? 'Yes' : 'No'
      });
    }

    if (filters.weightRequired) {
      chips.push({
        key: 'weightRequired',
        label: `Weight Required: ${filters.weightRequired === 'Y' ? 'Yes' : 'No'}`,
        value: filters.weightRequired === 'Y' ? 'Yes' : 'No'
      });
    }

    if (filters.effDate && filters.effDatePeriod) {
      const effSymbol = filters.effDatePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effDate',
        label: `Effective Date ${effSymbol} ${this.formatDate(filters.effDate)}`,
        value: this.formatDate(filters.effDate)
      });
    }

    if (filters.termDate && filters.termDatePeriod) {
      const termSymbol = filters.termDatePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'termDate',
        label: `Termination Date ${termSymbol} ${this.formatDate(filters.termDate)}`,
        value: this.formatDate(filters.termDate)
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ProductTypeFilterValue | null,
    chipKey: string
  ): ProductTypeFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'productClass':
        delete updatedFilters.productClass;
        break;
      case 'aboOnly':
        delete updatedFilters.aboOnly;
        break;
      case 'attribFlag':
        delete updatedFilters.attribFlag;
        break;
      case 'weightRequired':
        delete updatedFilters.weightRequired;
        break;
      case 'effDate':
        delete updatedFilters.effDate;
        delete updatedFilters.effDatePeriod;
        break;
      case 'termDate':
        delete updatedFilters.termDate;
        delete updatedFilters.termDatePeriod;
        break;
    }

    return Object.keys(updatedFilters).length > 0 ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ProductTypeFilterValue | null): boolean {
    if (!filters) return false;
    return !!(
      filters.productClass ||
      filters.aboOnly ||
      filters.attribFlag ||
      filters.weightRequired ||
      filters.effDate ||
      filters.termDate
    );
  }

  private static formatDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date as string);
    if (isNaN(d.getTime())) return '';

    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();

    return `${day}-${month}-${year}`;
  }
}
