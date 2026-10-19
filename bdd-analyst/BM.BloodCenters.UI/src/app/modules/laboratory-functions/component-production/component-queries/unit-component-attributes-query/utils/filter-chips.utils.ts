import { FilterChip } from '@shared/components/filter-chips/filter-chips';

import { UnitAttributesFilterValue, ComponentAttributesFilterValue } from '../models/unit-component-attributes-filter.model';

export class UnitAttributesFilterChipsUtils {
  static convertFiltersToChips(filters: UnitAttributesFilterValue | null): FilterChip[] {
    if (!filters) return [];
    const chips: FilterChip[] = [];

    if (filters.attribCode) {
      chips.push({
        key: 'attribCode',
        label: `Attribute Code: ${filters.attribCode}`,
        value: filters.attribCode,
        removable: true,
      });
    }

    if (filters.attribGroup) {
      chips.push({
        key: 'attribGroup',
        label: `Attribute Type: ${filters.attribGroup}`,
        value: filters.attribGroup,
        removable: true,
      });
    }

    if (filters.insertUserId) {
      chips.push({
        key: 'insertUserId',
        label: `User: ${filters.insertUserId}`,
        value: filters.insertUserId,
        removable: true,
      });
    }

    return chips;
  }

  static hasActiveFilters(filters: UnitAttributesFilterValue | null): boolean {
    if (!filters) return false;
    return !!(filters.attribCode || filters.attribGroup || filters.insertUserId);
  }

  static removeFilterByChipKey(
    filters: UnitAttributesFilterValue | null,
    chipKey: string
  ): UnitAttributesFilterValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (chipKey) {
      case 'attribCode':
        delete updated.attribCode;
        break;
      case 'attribGroup':
        delete updated.attribGroup;
        break;
      case 'insertUserId':
        delete updated.insertUserId;
        break;
    }

    return updated;
  }
}

export class ComponentAttributesFilterChipsUtils {
  static convertFiltersToChips(filters: ComponentAttributesFilterValue | null): FilterChip[] {
    if (!filters) return [];
    const chips: FilterChip[] = [];

    if (filters.productCode) {
      chips.push({
        key: 'productCode',
        label: `Product Code: ${filters.productCode}`,
        value: filters.productCode,
        removable: true,
      });
    }

    if (filters.attribCode) {
      chips.push({
        key: 'attribCode',
        label: `Attribute Code: ${filters.attribCode}`,
        value: filters.attribCode,
        removable: true,
      });
    }

    if (filters.insertUserId) {
      chips.push({
        key: 'insertUserId',
        label: `User: ${filters.insertUserId}`,
        value: filters.insertUserId,
        removable: true,
      });
    }

    return chips;
  }

  static hasActiveFilters(filters: ComponentAttributesFilterValue | null): boolean {
    if (!filters) return false;
    return !!(filters.productCode || filters.attribCode || filters.insertUserId);
  }

  static removeFilterByChipKey(
    filters: ComponentAttributesFilterValue | null,
    chipKey: string
  ): ComponentAttributesFilterValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (chipKey) {
      case 'productCode':
        delete updated.productCode;
        break;
      case 'attribCode':
        delete updated.attribCode;
        break;
      case 'insertUserId':
        delete updated.insertUserId;
        break;
    }

    return updated;
  }
}
