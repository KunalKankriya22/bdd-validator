import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AttributeExpirationDateOverrideFilterValue } from '../models/attribute-expiration-date-override.model';
import { formatTableDate } from 'src/app/modules/system-administration/application-sequence-numbers/utils/table-display.util';

export class AttributeExpirationDateOverrideFilterChipsUtils {

  static convertFiltersToChips(filters: AttributeExpirationDateOverrideFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.overrideAttribute) {
      chips.push({
        key: 'overrideAttribute',
        label: `Override Attribute: ${filters.overrideAttribute}`,
        value: filters.overrideAttribute
      });
    }

    if (filters.effDate && filters.effDatePeriod) {
      const formattedDate = formatTableDate(filters.effDate);
      const symbol = filters.effDatePeriod === 'before' ? '≤' : '≥';
      chips.push({
        key: 'effDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effDate
      });
    }

    if (filters.termDate && filters.termDatePeriod) {
      const formattedDate = formatTableDate(filters.termDate);
      const symbol = filters.termDatePeriod === 'before' ? '≤' : '≥';
      chips.push({
        key: 'termDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.termDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: AttributeExpirationDateOverrideFilterValue | null,
    chipKey: string
  ): AttributeExpirationDateOverrideFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'overrideAttribute':
        updatedFilters.overrideAttribute = null;
        break;
      case 'effDate':
        updatedFilters.effDate = null;
        updatedFilters.effDatePeriod = null;
        break;
      case 'termDate':
        updatedFilters.termDate = null;
        updatedFilters.termDatePeriod = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: AttributeExpirationDateOverrideFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.overrideAttribute ||
      (filters.effDate && filters.effDatePeriod) ||
      (filters.termDate && filters.termDatePeriod)
    );
  }
}
