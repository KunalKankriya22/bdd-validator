import { ReturnReasonsFilterChipsUtils } from './filter-chips.utils';
import { ReturnReasonsFilterValue } from '../models/return-reasons.model';

describe('ReturnReasonsFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert location type filter to chip', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: 'DI',
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ReturnReasonsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('locationType');
      expect(result[0].label).toBe('Location: DI');
    });

    it('should convert credit filter to chip', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: 'Yes',
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ReturnReasonsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('crNcr');
      expect(result[0].label).toBe('Credit: Yes');
    });

    it('should convert effective date filter to chip with period', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ReturnReasonsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date ≥');
      expect(result[0].label).toContain('15-JAN-2024');
    });

    it('should convert termination date filter to chip with period', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };

      const result = ReturnReasonsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date ≤');
      expect(result[0].label).toContain('31-DEC-2024');
    });


    it('should not create chip for date without period', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ReturnReasonsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove location type filter', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: 'DI',
        crNcr: 'Yes',
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ReturnReasonsFilterChipsUtils.removeFilterByChipKey(filters, 'locationType');
      expect(result).not.toBeNull();
      expect(result?.locationType).toBeNull();
      expect(result?.crNcr).toBe('Yes');
    });

    it('should remove credit filter', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: 'DI',
        crNcr: 'Yes',
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ReturnReasonsFilterChipsUtils.removeFilterByChipKey(filters, 'crNcr');
      expect(result).not.toBeNull();
      expect(result?.crNcr).toBeNull();
      expect(result?.locationType).toBe('DI');
    });



  });

  describe('hasActiveFilters', () => {


    it('should return true when at least one filter is set', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: 'DI',
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ReturnReasonsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when date filter is set', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date(),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ReturnReasonsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return false when only period is set without date', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ReturnReasonsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return false when only termination period is set without date', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: null
      };

      const result = ReturnReasonsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });
  });
});
