import { InterdictionUpgradeMatrixFilterChipsUtils } from './filter-chips.utils';
import { InterdictionUpgradeMatrixFilterValue } from '../models/interdiction-upgrade-matrix.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('InterdictionUpgradeMatrixFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array for filters with all null values', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: null
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create chip for sourceInterdiction', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: null,
        actionInterdiction: null,
        action: null
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('sourceInterdiction');
      expect(result[0].label).toBe('Source Interdiction: SRC001');
      expect(result[0].value).toBe('SRC001');
    });

    it('should create chip for existingInterdiction', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: 'EXT001',
        actionInterdiction: null,
        action: null
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('existingInterdiction');
      expect(result[0].label).toBe('Existing Interdiction: EXT001');
      expect(result[0].value).toBe('EXT001');
    });

    it('should create chip for actionInterdiction', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: 'ACT001',
        action: null
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('actionInterdiction');
      expect(result[0].label).toBe('Action Interdiction: ACT001');
      expect(result[0].value).toBe('ACT001');
    });

    it('should create chip for action with P mapped to Place', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: 'P'
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('action');
      expect(result[0].label).toBe('Action: Place');
      expect(result[0].value).toBe('P');
    });

    it('should create chip for action with R mapped to Release', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: 'R'
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('action');
      expect(result[0].label).toBe('Action: Release');
      expect(result[0].value).toBe('R');
    });

    it('should create chip for action with unknown value unmapped', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: 'X'
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('action');
      expect(result[0].label).toBe('Action: X');
      expect(result[0].value).toBe('X');
    });


    it('should create chips in correct order', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: 'ACT001',
        action: 'P'
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].key).toBe('sourceInterdiction');
      expect(result[1].key).toBe('existingInterdiction');
      expect(result[2].key).toBe('actionInterdiction');
      expect(result[3].key).toBe('action');
    });

  });

  describe('removeFilterByChipKey', () => {









    it('should return updated filters when some filters remain', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: 'ACT001',
        action: 'P'
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'sourceInterdiction');

      expect(result).not.toBeNull();
      expect(result?.sourceInterdiction).toBeNull();
      expect(result?.existingInterdiction).toBe('EXT001');
      expect(result?.actionInterdiction).toBe('ACT001');
      expect(result?.action).toBe('P');
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false for filters with all null values', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: null
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when sourceInterdiction has value', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: null,
        actionInterdiction: null,
        action: null
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when existingInterdiction has value', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: 'EXT001',
        actionInterdiction: null,
        action: null
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when actionInterdiction has value', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: 'ACT001',
        action: null
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when action has value', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: 'P'
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });


    it('should return true when some filters have values', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: null,
        actionInterdiction: null,
        action: 'R'
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

  });

  describe('mapActionToDisplay (private method through convertFiltersToChips)', () => {
    it('should map P to Place in chip label', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: 'P'
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toContain('Place');
    });

    it('should map R to Release in chip label', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: 'R'
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toContain('Release');
    });

    it('should preserve original value in chip value property', () => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: 'P'
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].value).toBe('P');
    });
  });

  describe('Edge Cases', () => {
    it('should handle filters with undefined values gracefully', () => {
      const filters = {
        sourceInterdiction: undefined as any,
        existingInterdiction: undefined as any,
        actionInterdiction: undefined as any,
        action: undefined as any
      };

      const result = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });


  });

  describe('Integration Scenarios', () => {
    it('should work correctly in a typical filter -> chip -> remove flow', () => {
      // Apply filters
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: null,
        action: 'P'
      };

      // Convert to chips
      const chips = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);

      // Remove one filter
      const updatedFilters = InterdictionUpgradeMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'sourceInterdiction');

      // Convert updated filters to chips
      const updatedChips = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(updatedFilters);
      expect(updatedChips.length).toBe(2);
      expect(updatedChips.find(c => c.key === 'sourceInterdiction')).toBeUndefined();
    });

    it('should correctly identify when all filters are cleared', () => {
      let filters: InterdictionUpgradeMatrixFilterValue | null = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: null,
        actionInterdiction: null,
        action: null
      };

      expect(InterdictionUpgradeMatrixFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      filters = InterdictionUpgradeMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'sourceInterdiction');

      expect(filters).toBeNull();
      expect(InterdictionUpgradeMatrixFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
