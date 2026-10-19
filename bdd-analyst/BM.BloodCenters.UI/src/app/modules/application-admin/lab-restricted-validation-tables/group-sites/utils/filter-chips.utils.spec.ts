import { GroupSitesFilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('GroupSitesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = GroupSitesFilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when chapterId is not set', () => {
      const filters = { chapterId: null } as any;

      const result = GroupSitesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should return a chip when chapterId is set', () => {
      const filters = { chapterId: 'CH001' } as any;

      const result = GroupSitesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        key: 'chapterId',
        label: 'Chapter ID: CH001',
        value: 'CH001'
      });
    });

    it('should not include chip for empty string chapterId', () => {
      const filters = { chapterId: '' } as any;

      const result = GroupSitesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = GroupSitesFilterChipsUtils.removeFilterByChipKey(null, 'chapterId');

      expect(result).toBeNull();
    });

    it('should clear chapterId and return null since no filters remain', () => {
      const filters = { chapterId: 'CH001' } as any;

      const result = GroupSitesFilterChipsUtils.removeFilterByChipKey(filters, 'chapterId');

      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters = { chapterId: 'CH001' } as any;
      const original = { ...filters };

      GroupSitesFilterChipsUtils.removeFilterByChipKey(filters, 'chapterId');

      expect(filters).toEqual(original);
    });

    it('should handle unknown chip keys gracefully', () => {
      const filters = { chapterId: 'CH001' } as any;

      const result = GroupSitesFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.chapterId).toBe('CH001');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(GroupSitesFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when chapterId is null', () => {
      const filters = { chapterId: null } as any;

      expect(GroupSitesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when chapterId is empty string', () => {
      const filters = { chapterId: '' } as any;

      expect(GroupSitesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when chapterId has a value', () => {
      const filters = { chapterId: 'CH001' } as any;

      expect(GroupSitesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
