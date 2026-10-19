import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PrePrintedProductLabelFilterValue } from '../models/pre-printed-product-labels.model';
import { formatTableDate } from 'src/app/modules/system-administration/application-sequence-numbers/utils/table-display.util';

export class PrePrintedProductLabelFilterChipsUtils {

  static convertFiltersToChips(filters: PrePrintedProductLabelFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.catalogNumber) {
      chips.push({
        key: 'catalogNumber',
        label: `Catalog Number: ${filters.catalogNumber}`,
        value: filters.catalogNumber
      });
    }

    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}`,
        value: filters.productType
      });
    }

    if (filters.bagCode) {
      chips.push({
        key: 'bagCode',
        label: `Bag Code: ${filters.bagCode}`,
        value: filters.bagCode
      });
    }

    if (filters.faceLabel) {
      chips.push({
        key: 'faceLabel',
        label: `Face Label: ${filters.faceLabel}`,
        value: filters.faceLabel
      });
    }

    if (filters.effDate && filters.effDatePeriod) {
      const formattedDate = formatTableDate(filters.effDate);
      const period = filters.effDatePeriod.toUpperCase();
      const symbol = period === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'effDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effDate
      });
    }

    if (filters.termDate && filters.termDatePeriod) {
      const formattedDate = formatTableDate(filters.termDate);
      const period = filters.termDatePeriod.toUpperCase();
      const symbol = period === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'termDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.termDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: PrePrintedProductLabelFilterValue | null,
    chipKey: string
  ): PrePrintedProductLabelFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'catalogNumber':
        updatedFilters.catalogNumber = null;
        break;
      case 'productType':
        updatedFilters.productType = null;
        break;
      case 'bagCode':
        updatedFilters.bagCode = null;
        break;
      case 'faceLabel':
        updatedFilters.faceLabel = null;
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

  static hasActiveFilters(filters: PrePrintedProductLabelFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.catalogNumber ||
      filters.productType ||
      filters.bagCode ||
      filters.faceLabel ||
      (filters.effDate && filters.effDatePeriod) ||
      (filters.termDate && filters.termDatePeriod)
    );
  }
}
