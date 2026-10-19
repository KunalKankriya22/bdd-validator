import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidCatalogFilterValue } from '../models/valid-catalog-numbers.model';
import moment from 'moment';

export class CatalogFilterChipsUtils {
  /**
   * Map period text to symbol sign
   */
  private static getPeriodSign(period: string): string {
    switch (period) {
      case 'after': return '≥';
      case 'before': return '≤';
      default: return period;
    }
  }

  static convertFiltersToChips(filters: ValidCatalogFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.catalogNumber) {
      chips.push({
        key: 'catalogNumber',
        label: `Catalog: ${filters.catalogNumber}`,
        value: filters.catalogNumber,
      });
    }

    if (filters.manufacturerCode) {
      chips.push({
        key: 'manufacturer',
        label: `Manufacturer: ${filters.manufacturerCode}`,
        value: filters.manufacturerCode,
      });
    } else if (filters.manufacturer) {
      chips.push({
        key: 'manufacturer',
        label: `Manufacturer: ${filters.manufacturer}`,
        value: filters.manufacturer,
      });
    }

    if (filters.showTerminated !== undefined && filters.showTerminated !== null) {
      chips.push({
        key: 'showTerminated',
        label: `Show Terminated: ${filters.showTerminated ? 'Yes' : 'No'}`,
        value: filters.showTerminated,
      });
    }

    if (filters.effDate && filters.effDatePeriod) {
      const formattedDate = moment(filters.effDate).format('DD-MMM-YYYY').toUpperCase();
      chips.push({
        key: 'effDate',
        label: `Effective Date ${this.getPeriodSign(filters.effDatePeriod)} ${formattedDate}`,
        value: filters.effDate,
      });
    }

    if (filters.termDate && filters.termDatePeriod) {
      const formattedDate = moment(filters.termDate).format('DD-MMM-YYYY').toUpperCase();
      chips.push({
        key: 'termDate',
        label: `Termination Date ${this.getPeriodSign(filters.termDatePeriod)} ${formattedDate}`,
        value: filters.termDate,
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ValidCatalogFilterValue | null,
    chipKey: string,
  ): ValidCatalogFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'catalogNumber':
        updatedFilters.catalogNumber = undefined;
        break;
      case 'manufacturer':
        updatedFilters.manufacturerCode = undefined;
        updatedFilters.manufacturer = undefined;
        break;
      case 'showTerminated':
        updatedFilters.showTerminated = undefined;
        break;
      case 'effDate':
        updatedFilters.effDate = undefined;
        updatedFilters.effDatePeriod = undefined;
        break;
      case 'termDate':
        updatedFilters.termDate = undefined;
        updatedFilters.termDatePeriod = undefined;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ValidCatalogFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.catalogNumber ||
      filters.manufacturerCode ||
      filters.manufacturer ||
      (filters.showTerminated !== undefined && filters.showTerminated !== null) ||
      filters.effDate ||
      filters.termDate
    );
  }
}
