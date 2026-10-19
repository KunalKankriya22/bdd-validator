import { FilterChipsUtils } from './filter-chips.utils';
import { DonorInterdictionOverrideFilterValue } from '../models/donor-interdiction-override.model';

describe('FilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should convert donorDecisionCode to chip', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'ACC'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'donorDecisionCode',
        label: 'Cue: ACC',
        value: 'ACC'
      });
    });

    it('should convert interType to chip', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        interType: 'P'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'interType',
        label: 'Type: P',
        value: 'P'
      });
    });

    it('should convert effectiveDate with "after" period to chip with >= symbol', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        effectiveDate: '2025-01-01',
        periodEffDate: 'after'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'effectiveDate',
        label: 'Effective Date ≥ 2025-01-01',
        value: '2025-01-01'
      });
    });

    it('should convert effectiveDate with "before" period to chip with <= symbol', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        effectiveDate: '2025-12-31',
        periodEffDate: 'before'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'effectiveDate',
        label: 'Effective Date ≤ 2025-12-31',
        value: '2025-12-31'
      });
    });

    it('should convert terminationDate with "after" period to chip with >= symbol', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        terminationDate: '2025-01-01',
        periodTermDate: 'after'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'terminationDate',
        label: 'Termination Date ≥ 2025-01-01',
        value: '2025-01-01'
      });
    });

    it('should convert terminationDate with "before" period to chip with <= symbol', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        terminationDate: '2025-12-31',
        periodTermDate: 'before'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'terminationDate',
        label: 'Termination Date ≤ 2025-12-31',
        value: '2025-12-31'
      });
    });

    it('should not create chip for effectiveDate without period', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        effectiveDate: '2025-01-01'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });

    it('should not create chip for terminationDate without period', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        terminationDate: '2025-12-31'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });



    it('should return empty array for empty filters', () => {
      const filters: DonorInterdictionOverrideFilterValue = {};

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips).toEqual([]);
    });
  });

  describe('removeFilterByChipKey', () => {


    it('should remove effectiveDate and periodEffDate filters', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        effectiveDate: '2025-01-01',
        periodEffDate: 'after',
        interType: 'P'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result.effectiveDate).toBeUndefined();
      expect(result.periodEffDate).toBeUndefined();
      expect(result.interType).toBe('P');
    });

    it('should remove terminationDate and periodTermDate filters', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        terminationDate: '2025-12-31',
        periodTermDate: 'before',
        interType: 'P'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result.terminationDate).toBeUndefined();
      expect(result.periodTermDate).toBeUndefined();
      expect(result.interType).toBe('P');
    });


  });

  describe('hasActiveFilters', () => {
    it('should return true when donorDecisionCode is set', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'ACC'
      };

      expect(FilterChipsUtils.hasActiveFilters(filters)).toBeTruthy();
    });

    it('should return true when interType is set', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        interType: 'P'
      };

      expect(FilterChipsUtils.hasActiveFilters(filters)).toBeTruthy();
    });


    it('should return true when periodEffDate is set', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        periodEffDate: 'after'
      };

      expect(FilterChipsUtils.hasActiveFilters(filters)).toBeTruthy();
    });


    it('should return true when periodTermDate is set', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        periodTermDate: 'before'
      };

      expect(FilterChipsUtils.hasActiveFilters(filters)).toBeTruthy();
    });



  });

  describe('getEmptyFilters', () => {
    it('should return empty filters object', () => {
      const result = FilterChipsUtils.getEmptyFilters();

      expect(result).toEqual({});
    });

    it('should return a new object each time', () => {
      const result1 = FilterChipsUtils.getEmptyFilters();
      const result2 = FilterChipsUtils.getEmptyFilters();

      expect(result1).not.toBe(result2);
    });
  });
});
