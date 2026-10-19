import { FilterChipsUtils } from './filter-chips.utils';
import { ProductAttributeFilterValue } from '../models/product-attribute.model';

describe('FilterChipsUtils (Product Type Attributes)', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = FilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: ProductAttributeFilterValue = {};

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert productType filter to chip', () => {
      const filters: ProductAttributeFilterValue = { productType: 'RBC' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('productType');
      expect(chips[0].label).toBe('Product Type: RBC');
      expect(chips[0].value).toBe('RBC');
    });

    it('should convert attribGroup filter to chip', () => {
      const filters: ProductAttributeFilterValue = { attribGroup: 'Blood Type' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('attribGroup');
      expect(chips[0].label).toBe('Attribute Group: Blood Type');
      expect(chips[0].value).toBe('Blood Type');
    });

    it('should convert attribCode filter to chip', () => {
      const filters: ProductAttributeFilterValue = { attribCode: 'AC01' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('attribCode');
      expect(chips[0].label).toBe('Attribute Code: AC01');
      expect(chips[0].value).toBe('AC01');
    });

    it('should convert labelFlag "Y" to chip with "Yes" display', () => {
      const filters: ProductAttributeFilterValue = { labelFlag: 'Y' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('labelFlag');
      expect(chips[0].label).toBe('Required for Labeling: Yes');
      expect(chips[0].value).toBe('Yes');
    });

    it('should convert labelFlag "N" to chip with "No" display', () => {
      const filters: ProductAttributeFilterValue = { labelFlag: 'N' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Required for Labeling: No');
      expect(chips[0].value).toBe('No');
    });

    it('should convert lifeSpanInd "H" to "Hours"', () => {
      const filters: ProductAttributeFilterValue = { lifeSpanInd: 'H' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('lifeSpanInd');
      expect(chips[0].label).toBe('Life Span Indicator: Hours');
      expect(chips[0].value).toBe('Hours');
    });

    it('should convert lifeSpanInd "D" to "Days"', () => {
      const filters: ProductAttributeFilterValue = { lifeSpanInd: 'D' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Life Span Indicator: Days');
      expect(chips[0].value).toBe('Days');
    });

    it('should convert lifeSpanInd "Y" to "Years"', () => {
      const filters: ProductAttributeFilterValue = { lifeSpanInd: 'Y' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Life Span Indicator: Years');
      expect(chips[0].value).toBe('Years');
    });

    it('should use raw lifeSpanInd code when not recognized', () => {
      const filters: ProductAttributeFilterValue = { lifeSpanInd: 'X' };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Life Span Indicator: X');
      expect(chips[0].value).toBe('X');
    });

    it('should convert effDate with "AFTER" period to chip using >= symbol', () => {
      const filters: ProductAttributeFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'AFTER'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert effDate with non-AFTER period to chip using <= symbol', () => {
      const filters: ProductAttributeFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'BEFORE'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should handle effDate as object with format method', () => {
      const mockMoment = { format: jest.fn().mockReturnValue('15-Jan-2025') };
      const filters: ProductAttributeFilterValue = {
        effDate: mockMoment as any,
        effDatePeriod: 'AFTER'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('15-Jan-2025');
      expect(mockMoment.format).toHaveBeenCalledWith('DD-MMM-YYYY');
    });

    it('should not create effDate chip when date is set but period is missing', () => {
      const filters: ProductAttributeFilterValue = {
        effDate: '2025-01-15'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create effDate chip when period is set but date is missing', () => {
      const filters: ProductAttributeFilterValue = {
        effDatePeriod: 'AFTER'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert termDate with "AFTER" period to chip using >= symbol', () => {
      const filters: ProductAttributeFilterValue = {
        termDate: '2025-12-31',
        termDatePeriod: 'AFTER'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].removable).toBe(true);
    });

    it('should handle termDate as object with format method', () => {
      const mockMoment = { format: jest.fn().mockReturnValue('31-Dec-2025') };
      const filters: ProductAttributeFilterValue = {
        termDate: mockMoment as any,
        termDatePeriod: 'BEFORE'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('31-Dec-2025');
    });

    it('should not create termDate chip when date is set but period is missing', () => {
      const filters: ProductAttributeFilterValue = {
        termDate: '2025-12-31'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: ProductAttributeFilterValue = {
        productType: 'RBC',
        attribGroup: 'Blood Type',
        attribCode: 'AC01',
        labelFlag: 'Y',
        lifeSpanInd: 'D',
        effDate: '2025-01-01',
        effDatePeriod: 'AFTER',
        termDate: '2025-12-31',
        termDatePeriod: 'BEFORE'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(7);
      expect(chips[0].key).toBe('productType');
      expect(chips[1].key).toBe('attribGroup');
      expect(chips[2].key).toBe('attribCode');
      expect(chips[3].key).toBe('labelFlag');
      expect(chips[4].key).toBe('lifeSpanInd');
      expect(chips[5].key).toBe('effDate');
      expect(chips[6].key).toBe('termDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = FilterChipsUtils.removeFilterByChipKey(null, 'productType');
      expect(result).toBeNull();
    });

    it('should remove productType filter', () => {
      const filters: ProductAttributeFilterValue = {
        productType: 'RBC',
        attribGroup: 'Blood Type'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'productType');
      expect(result).not.toBeNull();
      expect(result!.productType).toBeUndefined();
      expect(result!.attribGroup).toBe('Blood Type');
    });

    it('should remove attribGroup filter', () => {
      const filters: ProductAttributeFilterValue = {
        productType: 'RBC',
        attribGroup: 'Blood Type'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'attribGroup');
      expect(result).not.toBeNull();
      expect(result!.attribGroup).toBeUndefined();
    });

    it('should remove attribCode filter', () => {
      const filters: ProductAttributeFilterValue = {
        productType: 'RBC',
        attribCode: 'AC01'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'attribCode');
      expect(result).not.toBeNull();
      expect(result!.attribCode).toBeUndefined();
    });

    it('should remove labelFlag filter', () => {
      const filters: ProductAttributeFilterValue = {
        productType: 'RBC',
        labelFlag: 'Y'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'labelFlag');
      expect(result).not.toBeNull();
      expect(result!.labelFlag).toBeUndefined();
    });

    it('should remove lifeSpanInd filter', () => {
      const filters: ProductAttributeFilterValue = {
        productType: 'RBC',
        lifeSpanInd: 'D'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'lifeSpanInd');
      expect(result).not.toBeNull();
      expect(result!.lifeSpanInd).toBeUndefined();
    });

    it('should remove effDate and effDatePeriod', () => {
      const filters: ProductAttributeFilterValue = {
        productType: 'RBC',
        effDate: '2025-01-15',
        effDatePeriod: 'AFTER'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result).not.toBeNull();
      expect(result!.effDate).toBeUndefined();
      expect(result!.effDatePeriod).toBeUndefined();
    });

    it('should remove termDate and termDatePeriod', () => {
      const filters: ProductAttributeFilterValue = {
        productType: 'RBC',
        termDate: '2025-12-31',
        termDatePeriod: 'BEFORE'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'termDate');
      expect(result).not.toBeNull();
      expect(result!.termDate).toBeUndefined();
      expect(result!.termDatePeriod).toBeUndefined();
    });

    it('should return null when removing the last filter', () => {
      const filters: ProductAttributeFilterValue = { productType: 'RBC' };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'productType');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: ProductAttributeFilterValue = {
        productType: 'RBC',
        attribGroup: 'Blood Type'
      };

      FilterChipsUtils.removeFilterByChipKey(filters, 'productType');
      expect(filters.productType).toBe('RBC');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(FilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters: ProductAttributeFilterValue = {};
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when productType is set', () => {
      const filters: ProductAttributeFilterValue = { productType: 'RBC' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when attribGroup is set', () => {
      const filters: ProductAttributeFilterValue = { attribGroup: 'Blood Type' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when attribCode is set', () => {
      const filters: ProductAttributeFilterValue = { attribCode: 'AC01' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when labelFlag is set', () => {
      const filters: ProductAttributeFilterValue = { labelFlag: 'Y' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when lifeSpanInd is set', () => {
      const filters: ProductAttributeFilterValue = { lifeSpanInd: 'D' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effDate is set', () => {
      const filters: ProductAttributeFilterValue = { effDate: '2025-01-15' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termDate is set', () => {
      const filters: ProductAttributeFilterValue = { termDate: '2025-12-31' };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when multiple filters are active', () => {
      const filters: ProductAttributeFilterValue = {
        productType: 'RBC',
        attribGroup: 'Blood Type',
        labelFlag: 'Y'
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
