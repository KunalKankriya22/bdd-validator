import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AntigenPricingMatrixFilterValue } from '../models/antigen-pricing-matrix.model';
import { formatTableDate } from 'src/app/modules/system-administration/application-sequence-numbers/utils/table-display.util';

export class AntigenPricingMatrixFilterChipsUtils {

  static convertFiltersToChips(filters: AntigenPricingMatrixFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.serviceCode) {
      chips.push({
        key: 'serviceCode',
        label: `Service Code: ${filters.serviceCode}`,
        value: filters.serviceCode
      });
    }

    if (filters.antigenQty != null) {
      chips.push({
        key: 'antigenQty',
        label: `Quantity: ${filters.antigenQty}`,
        value: String(filters.antigenQty)
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
    filters: AntigenPricingMatrixFilterValue | null,
    chipKey: string
  ): AntigenPricingMatrixFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'serviceCode':
        updatedFilters.serviceCode = null;
        break;
      case 'antigenQty':
        updatedFilters.antigenQty = null;
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

  static hasActiveFilters(filters: AntigenPricingMatrixFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.serviceCode ||
      filters.antigenQty != null ||
      (filters.effDate && filters.effDatePeriod) ||
      (filters.termDate && filters.termDatePeriod)
    );
  }
}
