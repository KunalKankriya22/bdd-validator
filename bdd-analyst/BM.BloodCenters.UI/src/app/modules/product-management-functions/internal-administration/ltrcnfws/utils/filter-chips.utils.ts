import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AttributeServiceCodeFilterValue } from '../filter-dialog/attribute-service-code-filter-dialog';

export class AttributeServiceCodeFilterChipsUtils {
  static toFilterChips(filters: AttributeServiceCodeFilterValue): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.attributeGroup) {
      chips.push({
        key: 'attributeGroup',
        label: `Attribute Group: ${filters.attributeGroup}`,
        value: filters.attributeGroup
      });
    }

    if (filters.price) {
      chips.push({
        key: 'price',
        label: `Price: ${filters.price}`,
        value: filters.price
      });
    }

    if (filters.serviceCode) {
      chips.push({
        key: 'serviceCode',
        label: `Service Code: ${filters.serviceCode}`,
        value: filters.serviceCode
      });
    }

    return chips;
  }

  static removeFilter(
    currentFilters: AttributeServiceCodeFilterValue,
    chipKey: string
  ): AttributeServiceCodeFilterValue {
    const updated = { ...currentFilters };

    switch (chipKey) {
      case 'attributeGroup':
        updated.attributeGroup = null;
        break;
      case 'price':
        updated.price = null;
        break;
      case 'serviceCode':
        updated.serviceCode = null;
        break;
    }

    return updated;
  }

  static clearAll(): AttributeServiceCodeFilterValue {
    return {
      attributeGroup: null,
      price: null,
      serviceCode: null
    };
  }

  static hasActiveFilters(filters: AttributeServiceCodeFilterValue | null): boolean {
    if (!filters) return false;
    return !!(
      filters.attributeGroup ||
      filters.price ||
      filters.serviceCode
    );
  }
}
