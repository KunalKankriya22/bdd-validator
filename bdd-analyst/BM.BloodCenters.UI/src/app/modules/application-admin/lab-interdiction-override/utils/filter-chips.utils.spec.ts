import { FilterChipsUtils } from './filter-chips.utils';
import { LabInterdictionOverrideFilterValue } from '../models/lab-interdiction-override.model';

describe('FilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should convert donorDecisionCode to chip', () => {
      const filters: LabInterdictionOverrideFilterValue = {
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
      const filters: LabInterdictionOverrideFilterValue = {
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
      const filters: LabInterdictionOverrideFilterValue = {
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'after'
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
      const filters: LabInterdictionOverrideFilterValue = {
        effectiveDate: '2025-12-31',
        effectiveDatePeriod: 'before'
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
      const filters: LabInterdictionOverrideFilterValue = {
        terminationDate: '2025-01-01',
        terminationDatePeriod: 'after'
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
      const filters: LabInterdictionOverrideFilterValue = {
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'before'
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
      const filters: LabInterdictionOverrideFilterValue = {
        effectiveDate: '2025-01-01'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });

    it('should not create chip for terminationDate without period', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        terminationDate: '2025-12-31'
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });



    it('should return empty array for empty filters', () => {
      const filters: LabInterdictionOverrideFilterValue = {};

      const chips = FilterChipsUtils.convertFiltersToChips(filters);

      expect(chips).toEqual([]);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should remove donorDecisionCode and donorDecisionCodeDisplay filters', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        donorDecisionCode: 'ACC',
        donorDecisionCodeDisplay: 'ACC - Acceptable',
        interType: 'P'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'donorDecisionCode');

      expect(result.donorDecisionCode).toBeUndefined();
      expect(result.donorDecisionCodeDisplay).toBeUndefined();
      expect(result.interType).toBe('P');
    });

    it('should remove interType and interTypeDisplay filters', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        donorDecisionCode: 'ACC',
        interType: 'P',
        interTypeDisplay: 'Permanent'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'interType');

      expect(result.interType).toBeUndefined();
      expect(result.interTypeDisplay).toBeUndefined();
      expect(result.donorDecisionCode).toBe('ACC');
    });

    it('should remove effectiveDate and effectiveDatePeriod filters', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'after',
        interType: 'P'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result.effectiveDate).toBeUndefined();
      expect(result.effectiveDatePeriod).toBeUndefined();
      expect(result.interType).toBe('P');
    });

    it('should remove terminationDate and terminationDatePeriod filters', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'before',
        interType: 'P'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result.terminationDate).toBeUndefined();
      expect(result.terminationDatePeriod).toBeUndefined();
      expect(result.interType).toBe('P');
    });


  });

  describe('hasActiveFilters', () => {
    it('should return true when donorDecisionCode is set', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        donorDecisionCode: 'ACC'
      };

      expect(FilterChipsUtils.hasActiveFilters(filters)).toBeTruthy();
    });

    it('should return true when interType is set', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        interType: 'P'
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
