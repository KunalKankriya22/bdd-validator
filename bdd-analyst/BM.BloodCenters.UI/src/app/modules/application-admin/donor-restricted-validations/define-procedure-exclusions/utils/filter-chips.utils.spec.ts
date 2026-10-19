import { ProcedureExclusionsFilterChipsUtils } from './filter-chips.utils';
import { DefineProcedureExclusionsFilterValue } from '../models/define-procedure-exclusions.model';

describe('ProcedureExclusionsFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array for filters with all null values', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: null,
        procedureCode: null,
        interdictionCode: null
      };

      const result = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create chip for donationType', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: 'AL',
        procedureCode: null,
        interdictionCode: null
      };

      const result = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('donationType');
      expect(result[0].label).toBe('Donation Type: AL');
      expect(result[0].value).toBe('AL');
      expect(result[0].removable).toBe(true);
    });

    it('should create chip for procedureCode', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: null,
        procedureCode: 'BM',
        interdictionCode: null
      };

      const result = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('procedureCode');
      expect(result[0].label).toBe('Procedure: BM');
      expect(result[0].value).toBe('BM');
      expect(result[0].removable).toBe(true);
    });

    it('should create chip for interdictionCode', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: null,
        procedureCode: null,
        interdictionCode: 'CODE001'
      };

      const result = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('interdictionCode');
      expect(result[0].label).toBe('Interdiction: CODE001');
      expect(result[0].value).toBe('CODE001');
      expect(result[0].removable).toBe(true);
    });


    it('should create chips in correct order', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001'
      };

      const result = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].key).toBe('donationType');
      expect(result[1].key).toBe('procedureCode');
      expect(result[2].key).toBe('interdictionCode');
    });

  });

  describe('removeFilterByChipKey', () => {








    it('should return updated filters when some filters remain', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001'
      };

      const result = ProcedureExclusionsFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      expect(result).not.toBeNull();
      expect(result?.donationType).toBeNull();
      expect(result?.procedureCode).toBe('BM');
      expect(result?.interdictionCode).toBe('CODE001');
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false for filters with all null values', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: null,
        procedureCode: null,
        interdictionCode: null
      };

      const result = ProcedureExclusionsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when donationType has value', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: 'AL',
        procedureCode: null,
        interdictionCode: null
      };

      const result = ProcedureExclusionsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when procedureCode has value', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: null,
        procedureCode: 'BM',
        interdictionCode: null
      };

      const result = ProcedureExclusionsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when interdictionCode has value', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: null,
        procedureCode: null,
        interdictionCode: 'CODE001'
      };

      const result = ProcedureExclusionsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });


    it('should return true when some filters have values', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: 'AL',
        procedureCode: null,
        interdictionCode: 'CODE001'
      };

      const result = ProcedureExclusionsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

  });

  describe('Edge Cases', () => {
    it('should handle filters with undefined values gracefully', () => {
      const filters = {
        donationType: undefined as any,
        procedureCode: undefined as any,
        interdictionCode: undefined as any
      };

      const result = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });


  });

  describe('Integration Scenarios', () => {
    it('should work correctly in a typical filter -> chip -> remove flow', () => {
      // Apply filters
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001'
      };

      // Convert to chips
      const chips = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);

      // Remove one filter
      const updatedFilters = ProcedureExclusionsFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      // Convert updated filters to chips
      const updatedChips = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(updatedFilters);
      expect(updatedChips.length).toBe(2);
      expect(updatedChips.find(c => c.key === 'donationType')).toBeUndefined();
    });

    it('should correctly identify when all filters are cleared', () => {
      let filters: DefineProcedureExclusionsFilterValue | null = {
        donationType: 'AL',
        procedureCode: null,
        interdictionCode: null
      };

      expect(ProcedureExclusionsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      filters = ProcedureExclusionsFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      expect(filters).toBeNull();
      expect(ProcedureExclusionsFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });

  describe('Chip Structure Validation', () => {
    it('should create chips with all required properties', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: 'AL',
        procedureCode: null,
        interdictionCode: null
      };

      const result = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].key).toBeDefined();
      expect(result[0].label).toBeDefined();
      expect(result[0].value).toBeDefined();
      expect(result[0].removable).toBe(true);
    });

    it('should create chips with correct label format', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001'
      };

      const result = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toMatch(/^Donation Type: /);
      expect(result[1].label).toMatch(/^Procedure: /);
      expect(result[2].label).toMatch(/^Interdiction: /);
    });
  });

  describe('Filter Removal Scenarios', () => {
    it('should handle removing filters in different orders', () => {
      const filters: DefineProcedureExclusionsFilterValue = {
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001'
      };

      // Remove middle filter first
      let result = ProcedureExclusionsFilterChipsUtils.removeFilterByChipKey(filters, 'procedureCode');
      expect(result?.procedureCode).toBeNull();
      expect(result?.donationType).toBe('AL');
      expect(result?.interdictionCode).toBe('CODE001');

      // Remove first filter
      result = ProcedureExclusionsFilterChipsUtils.removeFilterByChipKey(result!, 'donationType');
      expect(result?.donationType).toBeNull();
      expect(result?.interdictionCode).toBe('CODE001');

      // Remove last filter
      result = ProcedureExclusionsFilterChipsUtils.removeFilterByChipKey(result!, 'interdictionCode');
      expect(result).toBeNull();
    });

  });
});
