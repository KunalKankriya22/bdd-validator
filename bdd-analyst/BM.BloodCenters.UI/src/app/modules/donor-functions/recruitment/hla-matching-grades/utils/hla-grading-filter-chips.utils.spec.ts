import { HlaGradingFilterChipsUtils } from './hla-grading-filter-chips.utils';
import { HlaGradingFilterValue } from '../models/hla-grading.model';

describe('HlaGradingFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert effective date filter with After period to chip', () => {
      const filters: HlaGradingFilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15'
      };

      const chips = HlaGradingFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toMatch(/Effective Date ≥ 15-[Jj][Aa][Nn]-2024/);
      expect(chips[0].value).toBe('2024-01-15');
    });

    it('should convert effective date filter with Before period to chip', () => {
      const filters: HlaGradingFilterValue = {
        effectivePeriod: 'Before',
        effectiveDate: '2024-06-30'
      };

      const chips = HlaGradingFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should convert termination date filter with After period to chip', () => {
      const filters: HlaGradingFilterValue = {
        terminationPeriod: 'After',
        terminationDate: '2024-12-31'
      };

      const chips = HlaGradingFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toMatch(/Termination Date ≥ 31-[Dd][Ee][Cc]-2024/);
    });

    it('should convert termination date filter with Before period to chip', () => {
      const filters: HlaGradingFilterValue = {
        terminationPeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      const chips = HlaGradingFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should not create chip for effective date without period', () => {
      const filters: HlaGradingFilterValue = {
        effectiveDate: '2024-01-15'
      };

      const chips = HlaGradingFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip for termination date without period', () => {
      const filters: HlaGradingFilterValue = {
        terminationDate: '2024-12-31'
      };

      const chips = HlaGradingFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip for period without date', () => {
      const filters: HlaGradingFilterValue = {
        effectivePeriod: 'After'
      };

      const chips = HlaGradingFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert both date filters to chips', () => {
      const filters: HlaGradingFilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15',
        terminationPeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      const chips = HlaGradingFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(2);
      expect(chips.some(c => c.key === 'effectiveDate')).toBeTrue();
      expect(chips.some(c => c.key === 'terminationDate')).toBeTrue();
    });

    it('should return empty array for empty filters object', () => {
      const chips = HlaGradingFilterChipsUtils.convertFiltersToChips({});
      expect(chips).toEqual([]);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove effective date and period', () => {
      const filters: HlaGradingFilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15',
        terminationPeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      const result = HlaGradingFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).toBeDefined();
      expect(result?.effectiveDate).toBeUndefined();
      expect(result?.effectivePeriod).toBeUndefined();
      expect(result?.terminationDate).toBe('2024-12-31');
      expect(result?.terminationPeriod).toBe('Before');
    });

    it('should remove termination date and period', () => {
      const filters: HlaGradingFilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15',
        terminationPeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      const result = HlaGradingFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).toBeDefined();
      expect(result?.terminationDate).toBeUndefined();
      expect(result?.terminationPeriod).toBeUndefined();
      expect(result?.effectiveDate).toBe('2024-01-15');
    });


  });

  describe('hasActiveFilters', () => {

    it('should return false for undefined', () => {
      expect(HlaGradingFilterChipsUtils.hasActiveFilters(undefined)).toBeFalse();
    });


    it('should return true when effective date is set', () => {
      const filters: HlaGradingFilterValue = { effectiveDate: '2024-01-15' };
      expect(HlaGradingFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when termination date is set', () => {
      const filters: HlaGradingFilterValue = { terminationDate: '2024-12-31' };
      expect(HlaGradingFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when both dates are set', () => {
      const filters: HlaGradingFilterValue = {
        effectiveDate: '2024-01-15',
        terminationDate: '2024-12-31'
      };
      expect(HlaGradingFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();
    });

    it('should return false when only period is set without date', () => {
      const filters: HlaGradingFilterValue = { effectivePeriod: 'After' };
      expect(HlaGradingFilterChipsUtils.hasActiveFilters(filters)).toBeFalse();
    });
  });
});
