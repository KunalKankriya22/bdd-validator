import { HHResponseFilterChipsUtils } from './filter-chips.utils';
import { HHResponseFilterValue } from '../models/hh-response-groups.model';

describe('HHResponseFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = HHResponseFilterChipsUtils.convertFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when no filter fields are set', () => {
      const filters: HHResponseFilterValue = {};

      const result = HHResponseFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create questionCode chip when questionCode is set', () => {
      const filters: HHResponseFilterValue = {
        questionCode: 'Q001',
      };

      const chips = HHResponseFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('questionCode');
      expect(chips[0].label).toBe('Question Code');
      expect(chips[0].value).toBe('Q001');
    });

    it('should create responseCode chip when responseCode is set', () => {
      const filters: HHResponseFilterValue = {
        responseCode: 'R001',
      };

      const chips = HHResponseFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('responseCode');
      expect(chips[0].label).toBe('Response Code');
      expect(chips[0].value).toBe('R001');
    });

    it('should create both chips when both filters are set', () => {
      const filters: HHResponseFilterValue = {
        questionCode: 'Q001',
        responseCode: 'R001',
      };

      const chips = HHResponseFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('questionCode');
      expect(chips[1].key).toBe('responseCode');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = HHResponseFilterChipsUtils.removeFilterByChipKey(null, 'questionCode');
      expect(result).toBeNull();
    });

    it('should remove questionCode filter and return null when no other filters remain', () => {
      const filters: HHResponseFilterValue = {
        questionCode: 'Q001',
      };

      const result = HHResponseFilterChipsUtils.removeFilterByChipKey(filters, 'questionCode');
      expect(result).toBeNull();
    });

    it('should remove questionCode filter and preserve responseCode', () => {
      const filters: HHResponseFilterValue = {
        questionCode: 'Q001',
        responseCode: 'R001',
      };

      const result = HHResponseFilterChipsUtils.removeFilterByChipKey(filters, 'questionCode');

      expect(result).not.toBeNull();
      expect(result!.questionCode).toBeUndefined();
      expect(result!.responseCode).toBe('R001');
    });

    it('should remove responseCode filter and preserve questionCode', () => {
      const filters: HHResponseFilterValue = {
        questionCode: 'Q001',
        responseCode: 'R001',
      };

      const result = HHResponseFilterChipsUtils.removeFilterByChipKey(filters, 'responseCode');

      expect(result).not.toBeNull();
      expect(result!.responseCode).toBeUndefined();
      expect(result!.questionCode).toBe('Q001');
    });

    it('should remove responseCode filter and return null when no other filters remain', () => {
      const filters: HHResponseFilterValue = {
        responseCode: 'R001',
      };

      const result = HHResponseFilterChipsUtils.removeFilterByChipKey(filters, 'responseCode');
      expect(result).toBeNull();
    });

    it('should not modify filters when unknown chip key is provided', () => {
      const filters: HHResponseFilterValue = {
        questionCode: 'Q001',
      };

      const result = HHResponseFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.questionCode).toBe('Q001');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(HHResponseFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filter fields are set', () => {
      const filters: HHResponseFilterValue = {};
      expect(HHResponseFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when questionCode is set', () => {
      const filters: HHResponseFilterValue = { questionCode: 'Q001' };
      expect(HHResponseFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when responseCode is set', () => {
      const filters: HHResponseFilterValue = { responseCode: 'R001' };
      expect(HHResponseFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when both are set', () => {
      const filters: HHResponseFilterValue = { questionCode: 'Q001', responseCode: 'R001' };
      expect(HHResponseFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('clearAllFilters', () => {
    it('should return null', () => {
      const result = HHResponseFilterChipsUtils.clearAllFilters();
      expect(result).toBeNull();
    });
  });
});
