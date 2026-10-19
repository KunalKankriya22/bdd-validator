import { MormFilterChipsUtils } from './filter-chips.utils';
import { MormFilterValue } from '../models/morm.model';

describe('MormFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(MormFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when no filters are set', () => {
      const filters = {} as MormFilterValue;
      expect(MormFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for testId', () => {
      const filters = { testId: 'T001' } as MormFilterValue;
      const result = MormFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'testId',
        label: 'Test ID',
        value: 'T001',
      });
    });

    it('should create chip for testType', () => {
      const filters = { testType: 'ELISA' } as MormFilterValue;
      const result = MormFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'testType',
        label: 'Test Type',
        value: 'ELISA',
      });
    });

    it('should create chip for testIntp', () => {
      const filters = { testIntp: 'POS' } as MormFilterValue;
      const result = MormFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'testIntp',
        label: 'Test Interpretation',
        value: 'POS',
      });
    });

    it('should create chip for includeInactive when true', () => {
      const filters = { includeInactive: true } as MormFilterValue;
      const result = MormFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'includeInactive',
        label: 'Include Inactive',
        value: 'Yes',
      });
    });

    it('should not create chip for includeInactive when false', () => {
      const filters = { includeInactive: false } as MormFilterValue;
      const result = MormFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        testId: 'T001',
        testType: 'ELISA',
        testIntp: 'POS',
        includeInactive: true,
      } as MormFilterValue;
      const result = MormFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(4);
      expect(result.map(c => c.key)).toEqual(['testId', 'testType', 'testIntp', 'includeInactive']);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(MormFilterChipsUtils.removeFilterByChipKey(null, 'testId')).toBeNull();
    });

    it('should delete testId when removing testId chip', () => {
      const filters = {
        testId: 'T001',
        testType: 'ELISA',
      } as MormFilterValue;
      const result = MormFilterChipsUtils.removeFilterByChipKey(filters, 'testId');

      expect(result).not.toBeNull();
      expect(result!.testId).toBeUndefined();
      expect(result!.testType).toBe('ELISA');
    });

    it('should delete testType when removing testType chip', () => {
      const filters = {
        testId: 'T001',
        testType: 'ELISA',
      } as MormFilterValue;
      const result = MormFilterChipsUtils.removeFilterByChipKey(filters, 'testType');

      expect(result).not.toBeNull();
      expect(result!.testType).toBeUndefined();
    });

    it('should delete testIntp when removing testIntp chip', () => {
      const filters = {
        testId: 'T001',
        testIntp: 'POS',
      } as MormFilterValue;
      const result = MormFilterChipsUtils.removeFilterByChipKey(filters, 'testIntp');

      expect(result).not.toBeNull();
      expect(result!.testIntp).toBeUndefined();
    });

    it('should set includeInactive to false when removing includeInactive chip', () => {
      const filters = {
        testId: 'T001',
        includeInactive: true,
      } as MormFilterValue;
      const result = MormFilterChipsUtils.removeFilterByChipKey(filters, 'includeInactive');

      expect(result).not.toBeNull();
      expect(result!.includeInactive).toBe(false);
    });

    it('should return null when removing last active filter', () => {
      const filters = { testId: 'T001' } as MormFilterValue;
      const result = MormFilterChipsUtils.removeFilterByChipKey(filters, 'testId');

      expect(result).toBeNull();
    });

    it('should not mutate original filters', () => {
      const filters = {
        testId: 'T001',
        testType: 'ELISA',
      } as MormFilterValue;
      MormFilterChipsUtils.removeFilterByChipKey(filters, 'testId');

      expect(filters.testId).toBe('T001');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(MormFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters = {} as MormFilterValue;
      expect(MormFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when includeInactive is false and no other filters', () => {
      const filters = { includeInactive: false } as MormFilterValue;
      expect(MormFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when testId is set', () => {
      const filters = { testId: 'T001' } as MormFilterValue;
      expect(MormFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when testType is set', () => {
      const filters = { testType: 'ELISA' } as MormFilterValue;
      expect(MormFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when testIntp is set', () => {
      const filters = { testIntp: 'POS' } as MormFilterValue;
      expect(MormFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when includeInactive is true', () => {
      const filters = { includeInactive: true } as MormFilterValue;
      expect(MormFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
