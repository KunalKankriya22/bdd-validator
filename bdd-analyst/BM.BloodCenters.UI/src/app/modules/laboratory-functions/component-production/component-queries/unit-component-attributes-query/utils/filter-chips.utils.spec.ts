import {
  UnitAttributesFilterChipsUtils,
  ComponentAttributesFilterChipsUtils
} from './filter-chips.utils';
import {
  UnitAttributesFilterValue,
  ComponentAttributesFilterValue
} from '../models/unit-component-attributes-filter.model';

describe('UnitAttributesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = UnitAttributesFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: UnitAttributesFilterValue = {};

      const chips = UnitAttributesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert attribCode filter to chip', () => {
      const filters: UnitAttributesFilterValue = { attribCode: 'AC01' };

      const chips = UnitAttributesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('attribCode');
      expect(chips[0].label).toBe('Attribute Code: AC01');
      expect(chips[0].value).toBe('AC01');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert attribGroup filter to chip', () => {
      const filters: UnitAttributesFilterValue = { attribGroup: 'Blood Type' };

      const chips = UnitAttributesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('attribGroup');
      expect(chips[0].label).toBe('Attribute Type: Blood Type');
      expect(chips[0].value).toBe('Blood Type');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert insertUserId filter to chip', () => {
      const filters: UnitAttributesFilterValue = { insertUserId: 'jdoe' };

      const chips = UnitAttributesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('insertUserId');
      expect(chips[0].label).toBe('User: jdoe');
      expect(chips[0].value).toBe('jdoe');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: UnitAttributesFilterValue = {
        attribCode: 'AC01',
        attribGroup: 'Blood Type',
        insertUserId: 'jdoe'
      };

      const chips = UnitAttributesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('attribCode');
      expect(chips[1].key).toBe('attribGroup');
      expect(chips[2].key).toBe('insertUserId');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(UnitAttributesFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters: UnitAttributesFilterValue = {};
      expect(UnitAttributesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when attribCode is set', () => {
      const filters: UnitAttributesFilterValue = { attribCode: 'AC01' };
      expect(UnitAttributesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when attribGroup is set', () => {
      const filters: UnitAttributesFilterValue = { attribGroup: 'Blood Type' };
      expect(UnitAttributesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when insertUserId is set', () => {
      const filters: UnitAttributesFilterValue = { insertUserId: 'jdoe' };
      expect(UnitAttributesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when multiple filters are active', () => {
      const filters: UnitAttributesFilterValue = {
        attribCode: 'AC01',
        attribGroup: 'Blood Type'
      };
      expect(UnitAttributesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = UnitAttributesFilterChipsUtils.removeFilterByChipKey(null, 'attribCode');
      expect(result).toBeNull();
    });

    it('should remove attribCode filter', () => {
      const filters: UnitAttributesFilterValue = {
        attribCode: 'AC01',
        attribGroup: 'Blood Type'
      };

      const result = UnitAttributesFilterChipsUtils.removeFilterByChipKey(filters, 'attribCode');
      expect(result).not.toBeNull();
      expect(result!.attribCode).toBeUndefined();
      expect(result!.attribGroup).toBe('Blood Type');
    });

    it('should remove attribGroup filter', () => {
      const filters: UnitAttributesFilterValue = {
        attribCode: 'AC01',
        attribGroup: 'Blood Type'
      };

      const result = UnitAttributesFilterChipsUtils.removeFilterByChipKey(filters, 'attribGroup');
      expect(result).not.toBeNull();
      expect(result!.attribGroup).toBeUndefined();
      expect(result!.attribCode).toBe('AC01');
    });

    it('should remove insertUserId filter', () => {
      const filters: UnitAttributesFilterValue = {
        attribCode: 'AC01',
        insertUserId: 'jdoe'
      };

      const result = UnitAttributesFilterChipsUtils.removeFilterByChipKey(filters, 'insertUserId');
      expect(result).not.toBeNull();
      expect(result!.insertUserId).toBeUndefined();
    });

    it('should not mutate the original filters object', () => {
      const filters: UnitAttributesFilterValue = {
        attribCode: 'AC01',
        attribGroup: 'Blood Type'
      };

      UnitAttributesFilterChipsUtils.removeFilterByChipKey(filters, 'attribCode');
      expect(filters.attribCode).toBe('AC01');
    });
  });
});

describe('ComponentAttributesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = ComponentAttributesFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: ComponentAttributesFilterValue = {};

      const chips = ComponentAttributesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert productCode filter to chip', () => {
      const filters: ComponentAttributesFilterValue = { productCode: 'PC01' };

      const chips = ComponentAttributesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('productCode');
      expect(chips[0].label).toBe('Product Code: PC01');
      expect(chips[0].value).toBe('PC01');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert attribCode filter to chip', () => {
      const filters: ComponentAttributesFilterValue = { attribCode: 'AC01' };

      const chips = ComponentAttributesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('attribCode');
      expect(chips[0].label).toBe('Attribute Code: AC01');
      expect(chips[0].value).toBe('AC01');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert insertUserId filter to chip', () => {
      const filters: ComponentAttributesFilterValue = { insertUserId: 'jdoe' };

      const chips = ComponentAttributesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('insertUserId');
      expect(chips[0].label).toBe('User: jdoe');
      expect(chips[0].value).toBe('jdoe');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: ComponentAttributesFilterValue = {
        productCode: 'PC01',
        attribCode: 'AC01',
        insertUserId: 'jdoe'
      };

      const chips = ComponentAttributesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('productCode');
      expect(chips[1].key).toBe('attribCode');
      expect(chips[2].key).toBe('insertUserId');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(ComponentAttributesFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters: ComponentAttributesFilterValue = {};
      expect(ComponentAttributesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when productCode is set', () => {
      const filters: ComponentAttributesFilterValue = { productCode: 'PC01' };
      expect(ComponentAttributesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when attribCode is set', () => {
      const filters: ComponentAttributesFilterValue = { attribCode: 'AC01' };
      expect(ComponentAttributesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when insertUserId is set', () => {
      const filters: ComponentAttributesFilterValue = { insertUserId: 'jdoe' };
      expect(ComponentAttributesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = ComponentAttributesFilterChipsUtils.removeFilterByChipKey(null, 'productCode');
      expect(result).toBeNull();
    });

    it('should remove productCode filter', () => {
      const filters: ComponentAttributesFilterValue = {
        productCode: 'PC01',
        attribCode: 'AC01'
      };

      const result = ComponentAttributesFilterChipsUtils.removeFilterByChipKey(filters, 'productCode');
      expect(result).not.toBeNull();
      expect(result!.productCode).toBeUndefined();
      expect(result!.attribCode).toBe('AC01');
    });

    it('should remove attribCode filter', () => {
      const filters: ComponentAttributesFilterValue = {
        productCode: 'PC01',
        attribCode: 'AC01'
      };

      const result = ComponentAttributesFilterChipsUtils.removeFilterByChipKey(filters, 'attribCode');
      expect(result).not.toBeNull();
      expect(result!.attribCode).toBeUndefined();
    });

    it('should remove insertUserId filter', () => {
      const filters: ComponentAttributesFilterValue = {
        productCode: 'PC01',
        insertUserId: 'jdoe'
      };

      const result = ComponentAttributesFilterChipsUtils.removeFilterByChipKey(filters, 'insertUserId');
      expect(result).not.toBeNull();
      expect(result!.insertUserId).toBeUndefined();
    });

    it('should not mutate the original filters object', () => {
      const filters: ComponentAttributesFilterValue = {
        productCode: 'PC01',
        attribCode: 'AC01'
      };

      ComponentAttributesFilterChipsUtils.removeFilterByChipKey(filters, 'productCode');
      expect(filters.productCode).toBe('PC01');
    });
  });
});
