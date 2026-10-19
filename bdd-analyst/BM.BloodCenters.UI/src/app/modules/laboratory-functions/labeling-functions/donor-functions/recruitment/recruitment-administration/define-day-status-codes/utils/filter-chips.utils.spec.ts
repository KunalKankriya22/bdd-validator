import { DayStatusFilterChipsUtils } from './filter-chips.utils';
import { DayStatusFilterValue } from '../models/day-status-codes.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('DayStatusFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array for filters with all empty values', () => {
      const filters: DayStatusFilterValue = {
        effectiveDate: null,
        terminationDate: null
      };

      const result = DayStatusFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create chip for resourceCode', () => {
      const filters: DayStatusFilterValue = {
        resourceCode: 'RES01'
      };

      const result = DayStatusFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('resourceCode');
      expect(result[0].label).toBe('Resource Code: RES01');
      expect(result[0].value).toBe('RES01');
    });

    it('should create chip for status', () => {
      const filters: DayStatusFilterValue = {
        status: 'AC'
      };

      const result = DayStatusFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('status');
      expect(result[0].label).toBe('Status: AC');
      expect(result[0].value).toBe('AC');
    });

    it('should create chip for effective date after', () => {
      const filters: DayStatusFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(2024, 0, 15)
      };

      const result = DayStatusFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe('Effective Date ≥ 15-JAN-2024');
    });

    it('should create chip for effective date before', () => {
      const filters: DayStatusFilterValue = {
        effectiveDatePeriod: 'before',
        effectiveDate: new Date(2024, 0, 15)
      };

      const result = DayStatusFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe('Effective Date ≤ 15-JAN-2024');
    });

    it('should create chip for termination date after', () => {
      const filters: DayStatusFilterValue = {
        terminationDatePeriod: 'after',
        terminationDate: new Date(2024, 11, 31)
      };

      const result = DayStatusFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toBe('Termination Date ≥ 31-DEC-2024');
    });

    it('should create chip for termination date before', () => {
      const filters: DayStatusFilterValue = {
        terminationDatePeriod: 'before',
        terminationDate: new Date(2024, 11, 31)
      };

      const result = DayStatusFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toBe('Termination Date ≤ 31-DEC-2024');
    });


    it('should not create chip for effectiveDate without period', () => {
      const filters: DayStatusFilterValue = {
        effectiveDate: new Date(2024, 0, 1)
      };

      const result = DayStatusFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

    it('should not create chip for terminationDate without period', () => {
      const filters: DayStatusFilterValue = {
        terminationDate: new Date(2024, 11, 31)
      };

      const result = DayStatusFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

  });

  describe('removeFilterByChipKey', () => {





    it('should remove effectiveDate but keep other filters', () => {
      const filters: DayStatusFilterValue = {
        resourceCode: 'RES01',
        status: 'AC',
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(2024, 0, 1), // January 1, 2024
        terminationDatePeriod: 'before',
        terminationDate: new Date(2024, 11, 31)
      };

      const result = DayStatusFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result?.resourceCode).toBe('RES01');
      expect(result?.status).toBe('AC');
      expect(result?.effectiveDatePeriod).toBeUndefined();
      expect(result?.effectiveDate).toBeUndefined();
      expect(result?.terminationDatePeriod).toBe('before');
      expect(result?.terminationDate).toEqual(new Date(2024, 11, 31));
    });




    it('should return updated filters when some filters remain', () => {
      const filters: DayStatusFilterValue = {
        resourceCode: 'RES01',
        status: 'AC',
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(2024, 0, 1), // January 1, 2024
        terminationDatePeriod: 'before',
        terminationDate: new Date(2024, 11, 31)
      };

      const result = DayStatusFilterChipsUtils.removeFilterByChipKey(filters, 'resourceCode');

      expect(result).not.toBeNull();
      expect(result?.resourceCode).toBeUndefined();
      expect(result?.status).toBe('AC');
      expect(result?.effectiveDatePeriod).toBe('after');
      expect(result?.effectiveDate).toEqual(new Date(2024, 0, 1));
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false for filters with all empty values', () => {
      const filters: DayStatusFilterValue = {};

      const result = DayStatusFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when resourceCode has value', () => {
      const filters: DayStatusFilterValue = {
        resourceCode: 'RES01'
      };

      const result = DayStatusFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when status has value', () => {
      const filters: DayStatusFilterValue = {
        status: 'AC'
      };

      const result = DayStatusFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when effectiveDate has both period and date', () => {
      const filters: DayStatusFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(2024, 0, 1)
      };

      const result = DayStatusFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return false when effectiveDate has period but no date', () => {
      const filters: DayStatusFilterValue = {
        effectiveDatePeriod: 'after'
      };

      const result = DayStatusFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when terminationDate has both period and date', () => {
      const filters: DayStatusFilterValue = {
        terminationDatePeriod: 'before',
        terminationDate: new Date(2024, 11, 31)
      };

      const result = DayStatusFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });


    it('should return true when some filters have values', () => {
      const filters: DayStatusFilterValue = {
        resourceCode: 'RES01',
        terminationDatePeriod: 'before',
        terminationDate: new Date(2024, 11, 31)
      };

      const result = DayStatusFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

  });

  describe('Integration Scenarios', () => {
    it('should work correctly in a typical filter -> chip -> remove flow', () => {
      // Apply filters
      const filters: DayStatusFilterValue = {
        resourceCode: 'RES01',
        status: 'AC',
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(2024, 0, 1), // January 1, 2024
        terminationDatePeriod: 'before',
        terminationDate: new Date(2024, 11, 31)
      };

      // Convert to chips
      const chips = DayStatusFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(4);

      // Remove one filter
      const updatedFilters = DayStatusFilterChipsUtils.removeFilterByChipKey(filters, 'resourceCode');

      // Convert updated filters to chips
      const updatedChips = DayStatusFilterChipsUtils.convertFiltersToChips(updatedFilters);
      expect(updatedChips.length).toBe(3);
      expect(updatedChips.find(c => c.key === 'resourceCode')).toBeUndefined();
    });

    it('should correctly identify when all filters are cleared', () => {
      let filters: DayStatusFilterValue | null = {
        resourceCode: 'RES01'
      };

      expect(DayStatusFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      filters = DayStatusFilterChipsUtils.removeFilterByChipKey(filters, 'resourceCode');

      expect(filters).toBeNull();
      expect(DayStatusFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
