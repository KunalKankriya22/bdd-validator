import { ResourceStatusQueryFilterChipsUtils } from './filter-chips.utils';
import { ResourceStatusQueryFilterValue } from '../models/resource-status-query.model';

describe('ResourceStatusQueryFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = ResourceStatusQueryFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when criticalInd is null', () => {
      const filters: ResourceStatusQueryFilterValue = { criticalInd: null };

      const chips = ResourceStatusQueryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert criticalInd "Y" to chip with label "Yes"', () => {
      const filters: ResourceStatusQueryFilterValue = { criticalInd: 'Y' };

      const chips = ResourceStatusQueryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('criticalInd');
      expect(chips[0].label).toBe('Critical: Yes');
      expect(chips[0].value).toBe('Y');
    });

    it('should convert criticalInd "N" to chip with label "No"', () => {
      const filters: ResourceStatusQueryFilterValue = { criticalInd: 'N' };

      const chips = ResourceStatusQueryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('criticalInd');
      expect(chips[0].label).toBe('Critical: No');
      expect(chips[0].value).toBe('N');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = ResourceStatusQueryFilterChipsUtils.removeFilterByChipKey(null, 'criticalInd');
      expect(result).toBeNull();
    });

    it('should remove criticalInd and return null when it is the only filter', () => {
      const filters: ResourceStatusQueryFilterValue = { criticalInd: 'Y' };

      const result = ResourceStatusQueryFilterChipsUtils.removeFilterByChipKey(filters, 'criticalInd');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: ResourceStatusQueryFilterValue = { criticalInd: 'Y' };

      ResourceStatusQueryFilterChipsUtils.removeFilterByChipKey(filters, 'criticalInd');
      expect(filters.criticalInd).toBe('Y');
    });

    it('should return filters unchanged for unrecognized chip key', () => {
      const filters: ResourceStatusQueryFilterValue = { criticalInd: 'Y' };

      const result = ResourceStatusQueryFilterChipsUtils.removeFilterByChipKey(filters, 'unknown');
      expect(result).not.toBeNull();
      expect(result!.criticalInd).toBe('Y');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(ResourceStatusQueryFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when criticalInd is null', () => {
      const filters: ResourceStatusQueryFilterValue = { criticalInd: null };
      expect(ResourceStatusQueryFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when criticalInd is set', () => {
      const filters: ResourceStatusQueryFilterValue = { criticalInd: 'Y' };
      expect(ResourceStatusQueryFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
