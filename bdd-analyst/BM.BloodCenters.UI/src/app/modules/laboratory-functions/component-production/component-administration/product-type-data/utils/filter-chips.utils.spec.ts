import { FilterChipsUtils } from './filter-chips.utils';
import { ProductTypeFilterValue } from '../models/product-type.model';

describe('FilterChipsUtils (Product Type Data)', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = FilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: ProductTypeFilterValue = {};

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert productClass filter to chip', () => {
      const filters: ProductTypeFilterValue = { productClass: 'RED CELLS' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('productClass');
      expect(chips[0].label).toBe('Class: RED CELLS');
      expect(chips[0].value).toBe('RED CELLS');
    });

    it('should convert aboOnly "Y" to chip with "Yes" display', () => {
      const filters: ProductTypeFilterValue = { aboOnly: 'Y' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('aboOnly');
      expect(chips[0].label).toBe('ABO Only: Yes');
      expect(chips[0].value).toBe('Yes');
    });

    it('should convert aboOnly "N" to chip with "No" display', () => {
      const filters: ProductTypeFilterValue = { aboOnly: 'N' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('ABO Only: No');
      expect(chips[0].value).toBe('No');
    });

    it('should convert attribFlag "Y" to chip with "Yes" display', () => {
      const filters: ProductTypeFilterValue = { attribFlag: 'Y' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('attribFlag');
      expect(chips[0].label).toBe('Accepted in Definition: Yes');
      expect(chips[0].value).toBe('Yes');
    });

    it('should convert attribFlag "N" to chip with "No" display', () => {
      const filters: ProductTypeFilterValue = { attribFlag: 'N' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Accepted in Definition: No');
      expect(chips[0].value).toBe('No');
    });

    it('should convert weightRequired "Y" to chip with "Yes" display', () => {
      const filters: ProductTypeFilterValue = { weightRequired: 'Y' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('weightRequired');
      expect(chips[0].label).toBe('Weight Required: Yes');
      expect(chips[0].value).toBe('Yes');
    });

    it('should convert weightRequired "N" to chip with "No" display', () => {
      const filters: ProductTypeFilterValue = { weightRequired: 'N' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Weight Required: No');
      expect(chips[0].value).toBe('No');
    });

    it('should convert effective date with "After" period to chip using >= symbol', () => {
      const filters: ProductTypeFilterValue = {
        effDate: '2025-01-15T00:00:00.000Z',
        effDatePeriod: 'After'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('≥');
    });

    it('should convert effective date with "Before" period to chip using <= symbol', () => {
      const filters: ProductTypeFilterValue = {
        effDate: '2025-03-20T00:00:00.000Z',
        effDatePeriod: 'Before'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should not create effective date chip when date is set but period is missing', () => {
      const filters: ProductTypeFilterValue = {
        effDate: '2025-01-15T00:00:00.000Z'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create effective date chip when period is set but date is missing', () => {
      const filters: ProductTypeFilterValue = {
        effDatePeriod: 'After'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert termination date with "After" period to chip using >= symbol', () => {
      const filters: ProductTypeFilterValue = {
        termDate: '2025-12-31T00:00:00.000Z',
        termDatePeriod: 'After'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≥');
    });

    it('should convert termination date with "Before" period to chip using <= symbol', () => {
      const filters: ProductTypeFilterValue = {
        termDate: '2025-06-30T00:00:00.000Z',
        termDatePeriod: 'Before'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should not create termination date chip when date is set but period is missing', () => {
      const filters: ProductTypeFilterValue = {
        termDate: '2025-12-31T00:00:00.000Z'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: ProductTypeFilterValue = {
        productClass: 'RED CELLS',
        aboOnly: 'Y',
        attribFlag: 'N',
        weightRequired: 'Y',
        effDate: '2025-01-01T00:00:00.000Z',
        effDatePeriod: 'After',
        termDate: '2025-12-31T00:00:00.000Z',
        termDatePeriod: 'Before'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(6);
      expect(chips[0].key).toBe('productClass');
      expect(chips[1].key).toBe('aboOnly');
      expect(chips[2].key).toBe('attribFlag');
      expect(chips[3].key).toBe('weightRequired');
      expect(chips[4].key).toBe('effDate');
      expect(chips[5].key).toBe('termDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = FilterChipsUtils.removeFilterByChipKey(null, 'productClass');
      expect(result).toBeNull();
    });

    it('should remove productClass filter', () => {
      const filters: ProductTypeFilterValue = {
        productClass: 'RED CELLS',
        aboOnly: 'Y'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'productClass');
      expect(result).not.toBeNull();
      expect(result!.productClass).toBeUndefined();
      expect(result!.aboOnly).toBe('Y');
    });

    it('should remove aboOnly filter', () => {
      const filters: ProductTypeFilterValue = {
        productClass: 'RED CELLS',
        aboOnly: 'Y'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'aboOnly');
      expect(result).not.toBeNull();
      expect(result!.aboOnly).toBeUndefined();
    });

    it('should remove attribFlag filter', () => {
      const filters: ProductTypeFilterValue = {
        productClass: 'RED CELLS',
        attribFlag: 'Y'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'attribFlag');
      expect(result).not.toBeNull();
      expect(result!.attribFlag).toBeUndefined();
    });

    it('should remove weightRequired filter', () => {
      const filters: ProductTypeFilterValue = {
        productClass: 'RED CELLS',
        weightRequired: 'Y'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'weightRequired');
      expect(result).not.toBeNull();
      expect(result!.weightRequired).toBeUndefined();
    });

    it('should remove effDate and effDatePeriod', () => {
      const filters: ProductTypeFilterValue = {
        productClass: 'RED CELLS',
        effDate: '2025-01-15T00:00:00.000Z',
        effDatePeriod: 'After'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result).not.toBeNull();
      expect(result!.effDate).toBeUndefined();
      expect(result!.effDatePeriod).toBeUndefined();
    });

    it('should remove termDate and termDatePeriod', () => {
      const filters: ProductTypeFilterValue = {
        productClass: 'RED CELLS',
        termDate: '2025-12-31T00:00:00.000Z',
        termDatePeriod: 'Before'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'termDate');
      expect(result).not.toBeNull();
      expect(result!.termDate).toBeUndefined();
      expect(result!.termDatePeriod).toBeUndefined();
    });

    it('should return null when removing the last filter', () => {
      const filters: ProductTypeFilterValue = { productClass: 'RED CELLS' };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'productClass');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: ProductTypeFilterValue = {
        productClass: 'RED CELLS',
        aboOnly: 'Y'
      };

      FilterChipsUtils.removeFilterByChipKey(filters, 'productClass');
      expect(filters.productClass).toBe('RED CELLS');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(FilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters: ProductTypeFilterValue = {};
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when productClass is set', () => {
      const filters: ProductTypeFilterValue = { productClass: 'RED CELLS' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when aboOnly is set', () => {
      const filters: ProductTypeFilterValue = { aboOnly: 'Y' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when attribFlag is set', () => {
      const filters: ProductTypeFilterValue = { attribFlag: 'Y' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when weightRequired is set', () => {
      const filters: ProductTypeFilterValue = { weightRequired: 'Y' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effDate is set', () => {
      const filters: ProductTypeFilterValue = { effDate: '2025-01-15' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termDate is set', () => {
      const filters: ProductTypeFilterValue = { termDate: '2025-12-31' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when multiple filters are active', () => {
      const filters: ProductTypeFilterValue = {
        productClass: 'RED CELLS',
        aboOnly: 'Y',
        weightRequired: 'N'
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
