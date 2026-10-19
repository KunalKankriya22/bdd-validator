import { ExternalBcDataTranslateFilterChipsUtils } from './filter-chips.utils';
import { ExternalBcDataTranslateFilterFormValue } from '../filter-panel/filter-panel';

describe('ExternalBcDataTranslateFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should convert filters to chips correctly', () => {
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: 'TYPE1',
        targetId: 'TYPE2'
      };

      const chips = ExternalBcDataTranslateFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('sourceId');
      expect(chips[0].label).toBe('Source Code Type: TYPE1');
      expect(chips[0].value).toBe('TYPE1');
      expect(chips[1].key).toBe('targetId');
      expect(chips[1].label).toBe('Target Code Type: TYPE2');
      expect(chips[1].value).toBe('TYPE2');
    });


    it('should only create chips for non-null filter values', () => {
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: 'TYPE1',
        targetId: null
      };

      const chips = ExternalBcDataTranslateFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('sourceId');
      expect(chips[0].value).toBe('TYPE1');
    });


    it('should create chip with proper label for sourceId', () => {
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: 'TEST_TYPE',
        targetId: null
      };

      const chips = ExternalBcDataTranslateFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toBe('Source Code Type: TEST_TYPE');
    });

    it('should create chip with proper label for targetId', () => {
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: null,
        targetId: 'TARGET_TYPE'
      };

      const chips = ExternalBcDataTranslateFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toBe('Target Code Type: TARGET_TYPE');
    });
  });

  describe('hasActiveFilters', () => {
    it('should detect active filters when sourceId is set', () => {
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: 'TYPE1',
        targetId: null
      };

      const hasFilters = ExternalBcDataTranslateFilterChipsUtils.hasActiveFilters(filters);

      expect(hasFilters).toBe(true);
    });

    it('should detect active filters when targetId is set', () => {
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: null,
        targetId: 'TYPE2'
      };

      const hasFilters = ExternalBcDataTranslateFilterChipsUtils.hasActiveFilters(filters);

      expect(hasFilters).toBe(true);
    });

    it('should detect active filters when all are set', () => {
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: 'TYPE1',
        targetId: 'TYPE2'
      };

      const hasFilters = ExternalBcDataTranslateFilterChipsUtils.hasActiveFilters(filters);

      expect(hasFilters).toBe(true);
    });


  });

  describe('removeFilterByChipKey', () => {
    it('should remove sourceId filter by chip key', () => {
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: 'TYPE1',
        targetId: 'TYPE2'
      };

      const updated = ExternalBcDataTranslateFilterChipsUtils.removeFilterByChipKey(filters, 'sourceId');

      expect(updated).not.toBeNull();
      expect(updated?.sourceId).toBeNull();
      expect(updated?.targetId).toBe('TYPE2');
    });

    it('should remove targetId filter by chip key', () => {
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: 'TYPE1',
        targetId: 'TYPE2'
      };

      const updated = ExternalBcDataTranslateFilterChipsUtils.removeFilterByChipKey(filters, 'targetId');

      expect(updated).not.toBeNull();
      expect(updated?.sourceId).toBe('TYPE1');
      expect(updated?.targetId).toBeNull();
    });





  });

  describe('Integration scenarios', () => {
    it('should handle complete filter lifecycle', () => {
      // Start with filters
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: 'TYPE1',
        targetId: 'TYPE2'
      };

      // Convert to chips
      let chips = ExternalBcDataTranslateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(2);

      // Has active filters
      expect(ExternalBcDataTranslateFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      // Remove one filter
      const updated = ExternalBcDataTranslateFilterChipsUtils.removeFilterByChipKey(filters, 'sourceId');
      expect(updated).not.toBeNull();

      // Convert updated to chips
      chips = ExternalBcDataTranslateFilterChipsUtils.convertFiltersToChips(updated);
      expect(chips.length).toBe(1);

      // Still has active filters
      expect(ExternalBcDataTranslateFilterChipsUtils.hasActiveFilters(updated)).toBe(true);

      // Remove last filter
      const final = ExternalBcDataTranslateFilterChipsUtils.removeFilterByChipKey(updated!, 'targetId');
      expect(final).toBeNull();

      // No active filters
      expect(ExternalBcDataTranslateFilterChipsUtils.hasActiveFilters(final)).toBe(false);
    });

    it('should maintain consistency between chips and filters', () => {
      const filters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: 'TYPE1',
        targetId: null
      };

      const chips = ExternalBcDataTranslateFilterChipsUtils.convertFiltersToChips(filters);
      const hasFilters = ExternalBcDataTranslateFilterChipsUtils.hasActiveFilters(filters);

      expect(chips.length > 0).toBe(hasFilters);
    });
  });
});
