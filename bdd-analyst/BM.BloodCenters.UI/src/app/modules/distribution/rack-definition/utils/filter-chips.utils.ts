import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { RackDefinitionFilterValue } from '../models/rack-definition.model';
import moment from 'moment';

export class RackDefinitionFilterChipsUtils {
  static convertFiltersToChips(filters: RackDefinitionFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.rackNumber) {
      chips.push({
        key: 'rackNumber',
        label: `Rack Number: ${filters.rackNumber}`,
        value: filters.rackNumber
      });
    }

    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Type: ${filters.productType}`,
        value: filters.productType
      });
    }

    if (filters.effectiveDate && filters.effectivePeriod) {
      const formattedDate = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
      const symbol = filters.effectivePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationPeriod) {
      const formattedDate = moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase();
      const symbol = filters.terminationPeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: RackDefinitionFilterValue | null,
    chipKey: string
  ): RackDefinitionFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'rackNumber':
        updatedFilters.rackNumber = null;
        break;
      case 'productType':
        updatedFilters.productType = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectivePeriod = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationPeriod = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: RackDefinitionFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.rackNumber ||
      filters.productType ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }
}
