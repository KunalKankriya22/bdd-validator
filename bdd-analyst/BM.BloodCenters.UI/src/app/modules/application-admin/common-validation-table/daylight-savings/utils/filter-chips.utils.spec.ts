import { DaylightSavingsFilterChipsUtils } from './filter-chips.utils';
import { DaylightSavingsFilterValue } from '../models/daylight-savings.model';

describe('DaylightSavingsFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert chapterId filter to chip', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: 'DAL',
        chapterName: null,
        timeZone: null,
        dstOffSet: null
      };

      const chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('chapterId');
      expect(chips[0].label).toBe('Chapter ID: DAL');
      expect(chips[0].value).toBe('DAL');
    });

    it('should convert chapterName filter to chip', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: null,
        chapterName: 'Dallas Blood Center',
        timeZone: null,
        dstOffSet: null
      };

      const chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('chapterName');
      expect(chips[0].label).toBe('Chapter Name: Dallas Blood Center');
      expect(chips[0].value).toBe('Dallas Blood Center');
    });

    it('should convert timeZone filter to chip', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: null,
        chapterName: null,
        timeZone: 'GMT-06:00',
        dstOffSet: null
      };

      const chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('timeZone');
      expect(chips[0].label).toBe('Time Zone: GMT-06:00');
      expect(chips[0].value).toBe('GMT-06:00');
    });

    it('should convert dstOffSet filter to chip', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: null,
        chapterName: null,
        timeZone: null,
        dstOffSet: -6
      };

      const chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('dstOffSet');
      expect(chips[0].label).toBe('DST Offset: -6');
      expect(chips[0].value).toBe(-6);
    });

    it('should handle dstOffSet of 0', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: null,
        chapterName: null,
        timeZone: null,
        dstOffSet: 0
      };

      const chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('dstOffSet');
      expect(chips[0].label).toBe('DST Offset: 0');
      expect(chips[0].value).toBe(0);
    });

    it('should convert all filters to chips', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: 'DAL',
        chapterName: 'Dallas Blood Center',
        timeZone: 'GMT-06:00',
        dstOffSet: -6
      };

      const chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(4);
      expect(chips[0].key).toBe('chapterId');
      expect(chips[1].key).toBe('chapterName');
      expect(chips[2].key).toBe('timeZone');
      expect(chips[3].key).toBe('dstOffSet');
    });

    it('should only include non-null filters', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: 'NYC',
        chapterName: null,
        timeZone: 'GMT-05:00',
        dstOffSet: null
      };

      const chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('chapterId');
      expect(chips[1].key).toBe('timeZone');
    });

    it('should handle filters with empty strings as null', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: '',
        chapterName: '',
        timeZone: '',
        dstOffSet: null
      };

      const chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove chapterId filter', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: 'DAL',
        chapterName: 'Dallas Blood Center',
        timeZone: 'GMT-06:00',
        dstOffSet: -6
      };

      const result = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'chapterId');

      expect(result).toBeDefined();
      expect(result?.chapterId).toBeNull();
      expect(result?.chapterName).toBe('Dallas Blood Center');
      expect(result?.timeZone).toBe('GMT-06:00');
      expect(result?.dstOffSet).toBe(-6);
    });

    it('should remove chapterName filter', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: 'DAL',
        chapterName: 'Dallas Blood Center',
        timeZone: 'GMT-06:00',
        dstOffSet: -6
      };

      const result = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'chapterName');

      expect(result).toBeDefined();
      expect(result?.chapterId).toBe('DAL');
      expect(result?.chapterName).toBeNull();
      expect(result?.timeZone).toBe('GMT-06:00');
      expect(result?.dstOffSet).toBe(-6);
    });

    it('should remove timeZone filter', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: 'DAL',
        chapterName: 'Dallas Blood Center',
        timeZone: 'GMT-06:00',
        dstOffSet: -6
      };

      const result = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'timeZone');

      expect(result).toBeDefined();
      expect(result?.chapterId).toBe('DAL');
      expect(result?.chapterName).toBe('Dallas Blood Center');
      expect(result?.timeZone).toBeNull();
      expect(result?.dstOffSet).toBe(-6);
    });

    it('should remove dstOffSet filter', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: 'DAL',
        chapterName: 'Dallas Blood Center',
        timeZone: 'GMT-06:00',
        dstOffSet: -6
      };

      const result = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'dstOffSet');

      expect(result).toBeDefined();
      expect(result?.chapterId).toBe('DAL');
      expect(result?.chapterName).toBe('Dallas Blood Center');
      expect(result?.timeZone).toBe('GMT-06:00');
      expect(result?.dstOffSet).toBeNull();
    });


    it('should keep other filters when removing one', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: 'NYC',
        chapterName: null,
        timeZone: 'GMT-05:00',
        dstOffSet: null
      };

      const result = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'chapterId');

      expect(result).toBeDefined();
      expect(result?.chapterId).toBeNull();
      expect(result?.timeZone).toBe('GMT-05:00');
    });

  });

  describe('hasActiveFilters', () => {

    it('should return false for filters with all null values', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: null,
        chapterName: null,
        timeZone: null,
        dstOffSet: null
      };

      const result = DaylightSavingsFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBe(false);
    });

    it('should return true when chapterId has value', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: 'DAL',
        chapterName: null,
        timeZone: null,
        dstOffSet: null
      };

      const result = DaylightSavingsFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBe(true);
    });

    it('should return true when chapterName has value', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: null,
        chapterName: 'Dallas Blood Center',
        timeZone: null,
        dstOffSet: null
      };

      const result = DaylightSavingsFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBe(true);
    });

    it('should return true when timeZone has value', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: null,
        chapterName: null,
        timeZone: 'GMT-06:00',
        dstOffSet: null
      };

      const result = DaylightSavingsFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBe(true);
    });

    it('should return true when dstOffSet has value (including 0)', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: null,
        chapterName: null,
        timeZone: null,
        dstOffSet: 0
      };

      const result = DaylightSavingsFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBe(true);
    });

    it('should return true when dstOffSet has negative value', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: null,
        chapterName: null,
        timeZone: null,
        dstOffSet: -6
      };

      const result = DaylightSavingsFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBe(true);
    });

    it('should return true when multiple filters have values', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: 'DAL',
        chapterName: 'Dallas Blood Center',
        timeZone: 'GMT-06:00',
        dstOffSet: -6
      };

      const result = DaylightSavingsFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBe(true);
    });

    it('should handle empty strings as no active filter', () => {
      const filters: DaylightSavingsFilterValue = {
        chapterId: '',
        chapterName: '',
        timeZone: '',
        dstOffSet: null
      };

      const result = DaylightSavingsFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should correctly handle filter lifecycle: add, remove, check', () => {
      // Start with filters
      let filters: DaylightSavingsFilterValue = {
        chapterId: 'DAL',
        chapterName: 'Dallas Blood Center',
        timeZone: 'GMT-06:00',
        dstOffSet: -6
      };

      // Convert to chips
      let chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(4);

      // Check has active filters
      expect(DaylightSavingsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      // Remove one filter
      filters = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'chapterId')!;
      chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(DaylightSavingsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      // Remove another filter
      filters = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'chapterName')!;
      chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(2);
      expect(DaylightSavingsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      // Remove another filter
      filters = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'timeZone')!;
      chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(DaylightSavingsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      // Remove last filter
      const lastFilter = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'dstOffSet');
      expect(lastFilter).toBeNull();
      expect(DaylightSavingsFilterChipsUtils.hasActiveFilters(lastFilter)).toBe(false);
    });

    it('should handle partial filters correctly throughout lifecycle', () => {
      let filters: DaylightSavingsFilterValue = {
        chapterId: 'NYC',
        chapterName: null,
        timeZone: 'GMT-05:00',
        dstOffSet: null
      };

      let chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(2);
      expect(DaylightSavingsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      filters = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'chapterId')!;
      chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('timeZone');
      expect(DaylightSavingsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      const finalFilters = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'timeZone');
      expect(finalFilters).toBeNull();
      expect(DaylightSavingsFilterChipsUtils.hasActiveFilters(finalFilters)).toBe(false);
    });

    it('should handle dstOffSet filter throughout lifecycle', () => {
      let filters: DaylightSavingsFilterValue = {
        chapterId: null,
        chapterName: null,
        timeZone: null,
        dstOffSet: -5
      };

      let chips = DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('dstOffSet');
      expect(DaylightSavingsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      const finalFilters = DaylightSavingsFilterChipsUtils.removeFilterByChipKey(filters, 'dstOffSet');
      expect(finalFilters).toBeNull();
      expect(DaylightSavingsFilterChipsUtils.hasActiveFilters(finalFilters)).toBe(false);
    });
  });
});
