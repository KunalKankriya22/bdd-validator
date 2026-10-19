import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ProductTypeAttributeFilterValue } from '../models/product-type-attribute.model';

export class FilterChipsUtils {
  static convertFiltersToChips(filters: ProductTypeAttributeFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.anticoagulantCode) {
      chips.push({
        key: 'anticoagulantCode',
        label: `Anticoagulant Code: ${filters.anticoagulantCode}`,
        value: filters.anticoagulantCode
      });
    }

    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}`,
        value: filters.productType
      });
    }

    if (filters.attribute) {
      chips.push({
        key: 'attribute',
        label: `Attribute: ${filters.attribute}`,
        value: filters.attribute
      });
    }

    if (filters.effectiveDateFrom) {
      chips.push({
        key: 'effectiveDateFrom',
        label: `Effective Date ≥ ${this.formatDateDisplay(filters.effectiveDateFrom)}`,
        value: filters.effectiveDateFrom
      });
    }

    if (filters.effectiveDateTo) {
      chips.push({
        key: 'effectiveDateTo',
        label: `Effective Date ≤ ${this.formatDateDisplay(filters.effectiveDateTo)}`,
        value: filters.effectiveDateTo
      });
    }

    if (filters.terminationDateFrom) {
      chips.push({
        key: 'terminationDateFrom',
        label: `Termination Date ≥ ${this.formatDateDisplay(filters.terminationDateFrom)}`,
        value: filters.terminationDateFrom
      });
    }

    if (filters.terminationDateTo) {
      chips.push({
        key: 'terminationDateTo',
        label: `Termination Date ≤ ${this.formatDateDisplay(filters.terminationDateTo)}`,
        value: filters.terminationDateTo
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ProductTypeAttributeFilterValue | null,
    chipKey: string
  ): ProductTypeAttributeFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'anticoagulantCode':
        updatedFilters.anticoagulantCode = null;
        break;
      case 'productType':
        updatedFilters.productType = null;
        break;
      case 'attribute':
        updatedFilters.attribute = null;
        break;
      case 'effectiveDateFrom':
        updatedFilters.effectiveDateFrom = null;
        break;
      case 'effectiveDateTo':
        updatedFilters.effectiveDateTo = null;
        break;
      case 'terminationDateFrom':
        updatedFilters.terminationDateFrom = null;
        break;
      case 'terminationDateTo':
        updatedFilters.terminationDateTo = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ProductTypeAttributeFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.anticoagulantCode ||
      filters.productType ||
      filters.attribute ||
      filters.effectiveDateFrom ||
      filters.effectiveDateTo ||
      filters.terminationDateFrom ||
      filters.terminationDateTo
    );
  }

  private static formatDateDisplay(dateString: string): string {
    try {
      const date = new Date(dateString);
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = String(date.getDate()).padStart(2, '0');
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  }
}
