import { RecoveredPlasmaTestFilterChipsUtils } from './filter-chips.utils';
import { RecoveredPlasmaTestFilterValue } from '../models/recovered-plasma-test.model';

describe('RecoveredPlasmaTestFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert effective date filter to chip with period', () => {
      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = RecoveredPlasmaTestFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('≥');
    });

    it('should convert termination date filter to chip with period', () => {
      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      };

      const result = RecoveredPlasmaTestFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('≤');
    });

    it('should convert multiple date filters to chips', () => {
      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      };

      const result = RecoveredPlasmaTestFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(2);
    });
  });
  describe('hasActiveFilters', () => {


    it('should return true when date filter is set', () => {
      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(),
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(RecoveredPlasmaTestFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
