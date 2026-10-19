import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidAttributesMatrixFilterValue } from '../models/valid-attributes-matrix.model';

export class ValidAttributesMatrixFilterChipsUtils {

  static convertFiltersToChips(filters: ValidAttributesMatrixFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.associatedAttribCode) {
      chips.push({
        key: 'associatedAttribCode',
        label: `Added Attribute Code: ${filters.associatedAttribCode}`,
        value: filters.associatedAttribCode,
        removable: true
      });
    }

    if (filters.deleteModifierCode) {
      chips.push({
        key: 'deleteModifierCode',
        label: `Modifier Code: ${filters.deleteModifierCode}`,
        value: filters.deleteModifierCode,
        removable: true
      });
    }

    if (filters.attribDeletedCode) {
      chips.push({
        key: 'attribDeletedCode',
        label: `Deleted Attribute Code: ${filters.attribDeletedCode}`,
        value: filters.attribDeletedCode,
        removable: true
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ValidAttributesMatrixFilterValue | null,
    chipKey: string
  ): ValidAttributesMatrixFilterValue | null {
    if (!filters) return null;

    const updated: ValidAttributesMatrixFilterValue = { ...filters };

    switch (chipKey) {
      case 'associatedAttribCode':
        delete updated.associatedAttribCode;
        break;
      case 'deleteModifierCode':
        delete updated.deleteModifierCode;
        break;
      case 'attribDeletedCode':
        delete updated.attribDeletedCode;
        break;
    }

    if (Object.keys(updated).length === 0) {
      return null;
    }

    return updated;
  }
}
