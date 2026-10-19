import { DriveChecklistFilterChipsUtils } from './filter-chips.utils';
import { DriveChecklistFilterValue } from '../models/define-default-drive-checklist.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('DriveChecklistFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array when filters is empty object', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: null
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should create chip for noOfDays without condition', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: 30,
        timeline: null
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'noOfDays',
        label: 'No. of Days: 30',
        value: '30'
      });
    });

    it('should create chip for noOfDays with GE condition', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'GE',
        noOfDays: 30,
        timeline: null
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'conditionAndDays',
        label: 'No. of Days: ≥ 30',
        value: 'GE30'
      });
    });

    it('should create chip for noOfDays with LE condition', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'LE',
        noOfDays: 15,
        timeline: null
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'conditionAndDays',
        label: 'No. of Days: ≤ 15',
        value: 'LE15'
      });
    });

    it('should create chip for noOfDays with EQ condition', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'EQ',
        noOfDays: 10,
        timeline: null
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'conditionAndDays',
        label: 'No. of Days: = 10',
        value: 'EQ10'
      });
    });


    it('should create chip for single timeline value (BD)', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: 'BD'
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'timeline',
        label: 'Timeline: Before Drive',
        value: 'BD'
      });
    });

    it('should create chip for single timeline value (AD)', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: 'AD'
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0]).toEqual({
        key: 'timeline',
        label: 'Timeline: After Drive',
        value: 'AD'
      });
    });

    it('should create chip for single timeline value (DD)', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: 'DD'
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0]).toEqual({
        key: 'timeline',
        label: 'Timeline: On Drive Date',
        value: 'DD'
      });
    });

    it('should create chip for single timeline value (CD)', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: 'CD'
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0]).toEqual({
        key: 'timeline',
        label: 'Timeline: After Creation',
        value: 'CD'
      });
    });

    it('should create chip for multiple timeline values', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: 'BD,AD'
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'timeline',
        label: 'Timeline: Before Drive, After Drive',
        value: 'BD,AD'
      });
    });

    it('should create chip for all timeline values', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: 'BD,AD,DD,CD'
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toBe('Timeline: Before Drive, After Drive, On Drive Date, After Creation');
    });

    it('should handle timeline values with spaces', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: 'BD , AD , DD'
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toBe('Timeline: Before Drive, After Drive, On Drive Date');
    });

    it('should handle unknown timeline values', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: 'UNKNOWN'
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toBe('Timeline: UNKNOWN');
    });

    it('should create chips for both noOfDays and timeline', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'GE',
        noOfDays: 30,
        timeline: 'BD,AD'
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('conditionAndDays');
      expect(chips[1].key).toBe('timeline');
    });

    it('should create chips in correct order', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'LE',
        noOfDays: 15,
        timeline: 'DD'
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('No. of Days');
      expect(chips[1].label).toContain('Timeline');
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove noOfDays filter', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'GE',
        noOfDays: 30,
        timeline: 'BD'
      };
      const result = DriveChecklistFilterChipsUtils.removeFilterByChipKey(filters, 'noOfDays');

      expect(result).not.toBeNull();
      expect(result?.noOfDays).toBeNull();
      expect(result?.condition).toBeNull();
      expect(result?.timeline).toBe('BD');
    });

    it('should remove conditionAndDays filter', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'LE',
        noOfDays: 20,
        timeline: 'AD'
      };
      const result = DriveChecklistFilterChipsUtils.removeFilterByChipKey(filters, 'conditionAndDays');

      expect(result).not.toBeNull();
      expect(result?.noOfDays).toBeNull();
      expect(result?.condition).toBeNull();
      expect(result?.timeline).toBe('AD');
    });

    it('should remove timeline filter', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'GE',
        noOfDays: 30,
        timeline: 'BD,AD'
      };
      const result = DriveChecklistFilterChipsUtils.removeFilterByChipKey(filters, 'timeline');

      expect(result).not.toBeNull();
      expect(result?.timeline).toBeNull();
      expect(result?.noOfDays).toBe(30);
      expect(result?.condition).toBe('GE');
    });





    it('should handle unknown chip key', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'GE',
        noOfDays: 30,
        timeline: 'BD'
      };
      const result = DriveChecklistFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result?.noOfDays).toBe(30);
      expect(result?.timeline).toBe('BD');
    });
  });

  describe('hasActiveFilters', () => {


    it('should return true when noOfDays is set', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: 30,
        timeline: null
      };
      const result = DriveChecklistFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when noOfDays is 0', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: 0,
        timeline: null
      };
      const result = DriveChecklistFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when timeline is set', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: 'BD'
      };
      const result = DriveChecklistFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when condition is set (even without noOfDays)', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'GE',
        noOfDays: null,
        timeline: null
      };
      const result = DriveChecklistFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });


    it('should return true when only condition and noOfDays are set', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'EQ',
        noOfDays: 10,
        timeline: null
      };
      const result = DriveChecklistFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when only timeline is set', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: 'DD'
      };
      const result = DriveChecklistFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string timeline', () => {
      const filters: DriveChecklistFilterValue = {
        condition: null,
        noOfDays: null,
        timeline: ''
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should handle very large noOfDays value', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'GE',
        noOfDays: 999999,
        timeline: null
      };
      const chips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toBe('No. of Days: ≥ 999999');
    });


    it('should preserve filter immutability when removing', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'GE',
        noOfDays: 30,
        timeline: 'BD'
      };

      const filtersCopy = { ...filters };
      DriveChecklistFilterChipsUtils.removeFilterByChipKey(filters, 'timeline');

      expect(filters).toEqual(filtersCopy);
    });
  });
});
