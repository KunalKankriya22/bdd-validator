import { ValidAdditionalTestFilterChipsUtils } from './filter-chips.utils';
import { ValidAdditionalTestFilterValue } from '../models/valid-additional-tests.model';
import moment from 'moment';

describe('ValidAdditionalTestFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert testId filter to chip', () => {
      const filters: ValidAdditionalTestFilterValue = {
        testId: 'TEST001'
      };

      const result = ValidAdditionalTestFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('testId');
      expect(result[0].label).toBe('Test ID: TEST001');
    });

    it('should convert effDateFrom filter to chip', () => {
      const filters: ValidAdditionalTestFilterValue = {
        effDateFrom: moment('2024-01-01')
      };

      const result = ValidAdditionalTestFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effDateFrom');
      expect(result[0].label).toBe('Eff. Date From: 01-JAN-2024');
    });

    it('should convert effDateTo filter to chip', () => {
      const filters: ValidAdditionalTestFilterValue = {
        effDateTo: moment('2024-12-31')
      };

      const result = ValidAdditionalTestFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effDateTo');
      expect(result[0].label).toBe('Eff. Date To: 31-DEC-2024');
    });

  });

  describe('removeFilterByChipKey', () => {

    it('should remove testId filter', () => {
      const filters: ValidAdditionalTestFilterValue = {
        testId: 'TEST001',
        effDateFrom: moment('2024-01-01')
      };

      const result = ValidAdditionalTestFilterChipsUtils.removeFilterByChipKey(filters, 'testId');

      expect(result).toBeDefined();
      expect(result?.testId).toBeUndefined();
      expect(result?.effDateFrom).toBeDefined();
    });

    it('should remove effDateFrom filter', () => {
      const filters: ValidAdditionalTestFilterValue = {
        testId: 'TEST001',
        effDateFrom: moment('2024-01-01')
      };

      const result = ValidAdditionalTestFilterChipsUtils.removeFilterByChipKey(filters, 'effDateFrom');

      expect(result).toBeDefined();
      expect(result?.testId).toBeDefined();
      expect(result?.effDateFrom).toBeUndefined();
    });

    it('should remove effDateTo filter', () => {
      const filters: ValidAdditionalTestFilterValue = {
        testId: 'TEST001',
        effDateTo: moment('2024-12-31')
      };

      const result = ValidAdditionalTestFilterChipsUtils.removeFilterByChipKey(filters, 'effDateTo');

      expect(result).toBeDefined();
      expect(result?.testId).toBeDefined();
      expect(result?.effDateTo).toBeUndefined();
    });

  });

  describe('hasActiveFilters', () => {

    it('should return false when filters is empty', () => {
      const filters: ValidAdditionalTestFilterValue = {};
      const result = ValidAdditionalTestFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when testId filter is set', () => {
      const filters: ValidAdditionalTestFilterValue = {
        testId: 'TEST001'
      };
      const result = ValidAdditionalTestFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when effDateFrom filter is set', () => {
      const filters: ValidAdditionalTestFilterValue = {
        effDateFrom: moment('2024-01-01')
      };
      const result = ValidAdditionalTestFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when effDateTo filter is set', () => {
      const filters: ValidAdditionalTestFilterValue = {
        effDateTo: moment('2024-12-31')
      };
      const result = ValidAdditionalTestFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

  });
});
