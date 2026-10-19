import { SpecialProcessingFilterChipsUtils } from './filter-chips.utils';
import { SpecialProcessingFilterValue } from '../models/special-processing-master-codes.model';

describe('SpecialProcessingFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: SpecialProcessingFilterValue = {};

      const chips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert effDate with "after" period to chip using >= symbol', () => {
      const filters: SpecialProcessingFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'after'
      };

      const chips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].value).toBe('2025-01-15');
    });

    it('should convert effDate with "before" period to chip using <= symbol', () => {
      const filters: SpecialProcessingFilterValue = {
        effDate: '2025-03-20',
        effDatePeriod: 'before'
      };

      const chips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should convert effDate without period set to chip using <= symbol by default', () => {
      const filters: SpecialProcessingFilterValue = {
        effDate: '2025-01-15'
      };

      const chips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should convert termDate with "after" period to chip using >= symbol', () => {
      const filters: SpecialProcessingFilterValue = {
        termDate: '2025-12-31',
        termDatePeriod: 'after'
      };

      const chips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].value).toBe('2025-12-31');
    });

    it('should convert termDate with "before" period to chip using <= symbol', () => {
      const filters: SpecialProcessingFilterValue = {
        termDate: '2025-06-30',
        termDatePeriod: 'before'
      };

      const chips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: SpecialProcessingFilterValue = {
        effDate: '2025-01-01',
        effDatePeriod: 'after',
        termDate: '2025-12-31',
        termDatePeriod: 'before'
      };

      const chips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('effDate');
      expect(chips[1].key).toBe('termDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = SpecialProcessingFilterChipsUtils.removeFilterByChipKey(null, 'effDate');
      expect(result).toBeNull();
    });

    it('should remove effDate and effDatePeriod', () => {
      const filters: SpecialProcessingFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'after',
        termDate: '2025-12-31',
        termDatePeriod: 'before'
      };

      const result = SpecialProcessingFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result).not.toBeNull();
      expect(result!.effDate).toBeUndefined();
      expect(result!.effDatePeriod).toBeUndefined();
      expect(result!.termDate).toBe('2025-12-31');
      expect(result!.termDatePeriod).toBe('before');
    });

    it('should remove termDate and termDatePeriod', () => {
      const filters: SpecialProcessingFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'after',
        termDate: '2025-12-31',
        termDatePeriod: 'before'
      };

      const result = SpecialProcessingFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');
      expect(result).not.toBeNull();
      expect(result!.termDate).toBeUndefined();
      expect(result!.termDatePeriod).toBeUndefined();
      expect(result!.effDate).toBe('2025-01-15');
    });

    it('should return null when removing the last active filter', () => {
      const filters: SpecialProcessingFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'after'
      };

      const result = SpecialProcessingFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: SpecialProcessingFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'after',
        termDate: '2025-12-31',
        termDatePeriod: 'before'
      };

      SpecialProcessingFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(filters.effDate).toBe('2025-01-15');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(SpecialProcessingFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters: SpecialProcessingFilterValue = {};
      expect(SpecialProcessingFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effDate is set', () => {
      const filters: SpecialProcessingFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'after'
      };
      expect(SpecialProcessingFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termDate is set', () => {
      const filters: SpecialProcessingFilterValue = {
        termDate: '2025-12-31',
        termDatePeriod: 'before'
      };
      expect(SpecialProcessingFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when both date filters are set', () => {
      const filters: SpecialProcessingFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'after',
        termDate: '2025-12-31',
        termDatePeriod: 'before'
      };
      expect(SpecialProcessingFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
