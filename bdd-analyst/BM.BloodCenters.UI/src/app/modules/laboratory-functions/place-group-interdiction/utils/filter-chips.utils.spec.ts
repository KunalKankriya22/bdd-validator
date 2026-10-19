import { FilterChipsUtils } from './filter-chips.utils';
import { GroupInterdictionFilterValue } from '../models/group-interdiction.model';

describe('FilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(FilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when no filters are set', () => {
      const filters = {} as GroupInterdictionFilterValue;
      expect(FilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for interType', () => {
      const filters = { interType: 'PERM' } as GroupInterdictionFilterValue;
      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'interType',
        label: 'Type: PERM',
        value: 'PERM',
      });
    });

    it('should create chip for interCode', () => {
      const filters = { interCode: 'IC001' } as GroupInterdictionFilterValue;
      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'interCode',
        label: 'Code: IC001',
        value: 'IC001',
      });
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        interType: 'PERM',
        interCode: 'IC001',
      } as GroupInterdictionFilterValue;
      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(2);
      expect(result[0].key).toBe('interType');
      expect(result[1].key).toBe('interCode');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(FilterChipsUtils.removeFilterByChipKey(null, 'interType')).toBeNull();
    });

    it('should delete interType when removing interType chip', () => {
      const filters = {
        interType: 'PERM',
        interCode: 'IC001',
      } as GroupInterdictionFilterValue;
      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'interType');

      expect(result).not.toBeNull();
      expect(result!.interType).toBeUndefined();
      expect(result!.interCode).toBe('IC001');
    });

    it('should delete interCode when removing interCode chip', () => {
      const filters = {
        interType: 'PERM',
        interCode: 'IC001',
      } as GroupInterdictionFilterValue;
      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'interCode');

      expect(result).not.toBeNull();
      expect(result!.interCode).toBeUndefined();
      expect(result!.interType).toBe('PERM');
    });

    it('should return null when removing last filter', () => {
      const filters = { interType: 'PERM' } as GroupInterdictionFilterValue;
      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'interType');

      expect(result).toBeNull();
    });

    it('should not mutate original filters', () => {
      const filters = {
        interType: 'PERM',
        interCode: 'IC001',
      } as GroupInterdictionFilterValue;
      FilterChipsUtils.removeFilterByChipKey(filters, 'interType');

      expect(filters.interType).toBe('PERM');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(FilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters = {} as GroupInterdictionFilterValue;
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when interType is set', () => {
      const filters = { interType: 'PERM' } as GroupInterdictionFilterValue;
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when interCode is set', () => {
      const filters = { interCode: 'IC001' } as GroupInterdictionFilterValue;
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when both filters are set', () => {
      const filters = {
        interType: 'PERM',
        interCode: 'IC001',
      } as GroupInterdictionFilterValue;
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
