import { ValidAttributesMatrixFilterChipsUtils } from './filter-chips.utils';
import { ValidAttributesMatrixFilterValue } from '../models/valid-attributes-matrix.model';

describe('ValidAttributesMatrixFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = ValidAttributesMatrixFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: ValidAttributesMatrixFilterValue = {};

      const chips = ValidAttributesMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert associatedAttribCode filter to chip', () => {
      const filters: ValidAttributesMatrixFilterValue = { associatedAttribCode: 'AAC01' };

      const chips = ValidAttributesMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('associatedAttribCode');
      expect(chips[0].label).toBe('Added Attribute Code: AAC01');
      expect(chips[0].value).toBe('AAC01');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert deleteModifierCode filter to chip', () => {
      const filters: ValidAttributesMatrixFilterValue = { deleteModifierCode: 'MOD01' };

      const chips = ValidAttributesMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('deleteModifierCode');
      expect(chips[0].label).toBe('Modifier Code: MOD01');
      expect(chips[0].value).toBe('MOD01');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert attribDeletedCode filter to chip', () => {
      const filters: ValidAttributesMatrixFilterValue = { attribDeletedCode: 'DEL01' };

      const chips = ValidAttributesMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('attribDeletedCode');
      expect(chips[0].label).toBe('Deleted Attribute Code: DEL01');
      expect(chips[0].value).toBe('DEL01');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: ValidAttributesMatrixFilterValue = {
        associatedAttribCode: 'AAC01',
        deleteModifierCode: 'MOD01',
        attribDeletedCode: 'DEL01'
      };

      const chips = ValidAttributesMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('associatedAttribCode');
      expect(chips[1].key).toBe('deleteModifierCode');
      expect(chips[2].key).toBe('attribDeletedCode');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = ValidAttributesMatrixFilterChipsUtils.removeFilterByChipKey(null, 'associatedAttribCode');
      expect(result).toBeNull();
    });

    it('should remove associatedAttribCode filter', () => {
      const filters: ValidAttributesMatrixFilterValue = {
        associatedAttribCode: 'AAC01',
        deleteModifierCode: 'MOD01'
      };

      const result = ValidAttributesMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'associatedAttribCode');
      expect(result).not.toBeNull();
      expect(result!.associatedAttribCode).toBeUndefined();
      expect(result!.deleteModifierCode).toBe('MOD01');
    });

    it('should remove deleteModifierCode filter', () => {
      const filters: ValidAttributesMatrixFilterValue = {
        associatedAttribCode: 'AAC01',
        deleteModifierCode: 'MOD01'
      };

      const result = ValidAttributesMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'deleteModifierCode');
      expect(result).not.toBeNull();
      expect(result!.deleteModifierCode).toBeUndefined();
      expect(result!.associatedAttribCode).toBe('AAC01');
    });

    it('should remove attribDeletedCode filter', () => {
      const filters: ValidAttributesMatrixFilterValue = {
        associatedAttribCode: 'AAC01',
        attribDeletedCode: 'DEL01'
      };

      const result = ValidAttributesMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'attribDeletedCode');
      expect(result).not.toBeNull();
      expect(result!.attribDeletedCode).toBeUndefined();
    });

    it('should return null when removing the last filter', () => {
      const filters: ValidAttributesMatrixFilterValue = { associatedAttribCode: 'AAC01' };

      const result = ValidAttributesMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'associatedAttribCode');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: ValidAttributesMatrixFilterValue = {
        associatedAttribCode: 'AAC01',
        deleteModifierCode: 'MOD01'
      };

      ValidAttributesMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'associatedAttribCode');
      expect(filters.associatedAttribCode).toBe('AAC01');
    });
  });
});
