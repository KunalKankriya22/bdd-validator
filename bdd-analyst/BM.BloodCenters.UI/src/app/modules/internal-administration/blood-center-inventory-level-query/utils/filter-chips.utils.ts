import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InventoryLevelQueryDto } from '../interfaces/inventory-level.interface';

export class InventoryLevelFilterChipsUtils {
  static convertFiltersToChips(filters: Partial<InventoryLevelQueryDto> | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.productType) {
      chips.push({ key: 'productType', label: `Product Type: ${filters.productType}`, value: filters.productType });
    }
    if (filters.bloodType) {
      chips.push({ key: 'bloodType', label: `ABORh: ${filters.bloodType}`, value: filters.bloodType });
    }
    if (filters.attributeGroup) {
      chips.push({ key: 'attributeGroup', label: `Attribute Group: ${filters.attributeGroup}`, value: filters.attributeGroup });
    }
    if (filters.attributeCode) {
      chips.push({ key: 'attributeCode', label: `Attribute Code: ${filters.attributeCode}`, value: filters.attributeCode });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: Partial<InventoryLevelQueryDto> | null,
    chipKey: string
  ): Partial<InventoryLevelQueryDto> {
    const updated = { ...(filters ?? {}) } as Partial<InventoryLevelQueryDto>;

    switch (chipKey) {
      case 'productType':    updated.productType    = null; break;
      case 'bloodType':      updated.bloodType      = null; break;
      case 'attributeGroup': updated.attributeGroup = null; updated.attributeCode = null; break;
      case 'attributeCode':  updated.attributeCode  = null; break;
    }

    return updated;
  }

  static hasActiveFilters(filters: Partial<InventoryLevelQueryDto> | null): boolean {
    if (!filters) return false;
    return !!(filters.productType || filters.bloodType || filters.attributeGroup || filters.attributeCode);
  }
}
