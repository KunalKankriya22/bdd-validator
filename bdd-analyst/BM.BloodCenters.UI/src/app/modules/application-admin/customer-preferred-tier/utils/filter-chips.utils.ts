import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import {
  CustomerPreferredTierFilterValue,
  ProductTypeDropdownDto
} from '../models/customer-preferred-tier.model';
import moment from 'moment';

export class CustomerPreferredTierFilterChipsUtils {
  static generateFilterChips(
    filters: CustomerPreferredTierFilterValue | null,
    productTypeOptions: ProductTypeDropdownDto[]
  ): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.productType) {
      const pt = productTypeOptions.find(p => p.productType === filters.productType);
      const label = pt ? `${pt.productType} - ${pt.productTypeDesc}` : filters.productType;
      chips.push({ label: `Product: ${label}`, value: filters.productType, key: 'productType', removable: true });
    }

    if (filters.effDateFilter) {
      const date = moment(filters.effDateFilter).format('DD-MMM-YYYY').toUpperCase();
      const symbol = filters.effDatePeriod === 'After' ? '≥' : '≤';
      chips.push({ label: `Effective Date ${symbol} ${date}`, value: filters.effDateFilter, key: 'effDate', removable: true });
    }

    if (filters.termDateFilter) {
      const date = moment(filters.termDateFilter).format('DD-MMM-YYYY').toUpperCase();
      const symbol = filters.termDatePeriod === 'After' ? '≥' : '≤';
      chips.push({ label: `Termination Date ${symbol} ${date}`, value: filters.termDateFilter, key: 'termDate', removable: true });
    }

    return chips;
  }

  static removeFilter(
    filters: CustomerPreferredTierFilterValue | null,
    key: string
  ): CustomerPreferredTierFilterValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (key) {
      case 'productType':
        updated.productType = null;
        break;
      case 'effDate':
        updated.effDatePeriod = null;
        updated.effDateFilter = null;
        break;
      case 'termDate':
        updated.termDatePeriod = null;
        updated.termDateFilter = null;
        break;
    }

    if (!updated.productType && !updated.effDateFilter && !updated.termDateFilter) {
      return null;
    }

    return updated;
  }

  static clearAllFilters(): null {
    return null;
  }
}
