import { RbcAntigenProductTypeFilterChipsUtils } from './filter-chips.utils';
import { RbcAntigenProductTypeFilterValue } from '../models/rbc-antigen-product-type.model';

describe('RbcAntigenProductTypeFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert effective date filter to chip with period', () => {
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = RbcAntigenProductTypeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('≥');
    });

    it('should convert termination date filter to chip with period', () => {
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      };

      const result = RbcAntigenProductTypeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('≤');
    });

    it('should convert multiple date filters to chips', () => {
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      };

      const result = RbcAntigenProductTypeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(2);
    });
  });
  describe('hasActiveFilters', () => {


    it('should return true when date filter is set', () => {
      const filters: RbcAntigenProductTypeFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(),
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(RbcAntigenProductTypeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
