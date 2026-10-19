import { HlaRbcFilterChipsUtils } from './filter-chips.utils';
import { FilterValue } from '../models/hla-rbc-request-query.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('HlaRbcFilterChipsUtils', () => {
  describe('createChipsFromFilters', () => {
    it('should return empty array when filters is null', () => {
      const result = HlaRbcFilterChipsUtils.createChipsFromFilters(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when no filter fields are set', () => {
      const filters: FilterValue = {};

      const result = HlaRbcFilterChipsUtils.createChipsFromFilters(filters);
      expect(result).toEqual([]);
    });

    it('should create showGradeThrough chip when set', () => {
      const filters: FilterValue = {
        showGradeThrough: 'Yes',
      };

      const chips = HlaRbcFilterChipsUtils.createChipsFromFilters(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('showGradeThrough');
      expect(chips[0].label).toBe('Show Grade Through: Yes');
      expect(chips[0].value).toBe('Yes');
    });

    it('should create grades chip with comma-separated values', () => {
      const filters: FilterValue = {
        grades: ['A', 'B', 'C'],
      };

      const chips = HlaRbcFilterChipsUtils.createChipsFromFilters(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('grades');
      expect(chips[0].label).toBe('Grades: A, B, C');
      expect(chips[0].value).toBe('A,B,C');
    });

    it('should not create grades chip when grades array is empty', () => {
      const filters: FilterValue = {
        grades: [],
      };

      const result = HlaRbcFilterChipsUtils.createChipsFromFilters(filters);
      expect(result.length).toBe(0);
    });

    it('should create level chip when level is set', () => {
      const filters: FilterValue = {
        level: 3,
      };

      const chips = HlaRbcFilterChipsUtils.createChipsFromFilters(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('level');
      expect(chips[0].label).toBe('Level: 3');
      expect(chips[0].value).toBe('3');
    });

    it('should create pattern chip when pattern is set', () => {
      const filters: FilterValue = {
        pattern: 'Pattern1',
      };

      const chips = HlaRbcFilterChipsUtils.createChipsFromFilters(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('pattern');
      expect(chips[0].label).toBe('Pattern: Pattern1');
      expect(chips[0].value).toBe('Pattern1');
    });

    it('should create abo chip when abo is set', () => {
      const filters: FilterValue = {
        abo: 'O+',
      };

      const chips = HlaRbcFilterChipsUtils.createChipsFromFilters(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('abo');
      expect(chips[0].label).toBe('ABO: O+');
      expect(chips[0].value).toBe('O+');
    });

    it('should create antigens chip when antigens is set', () => {
      const filters: FilterValue = {
        antigens: 'HLA-A',
      };

      const chips = HlaRbcFilterChipsUtils.createChipsFromFilters(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('antigens');
      expect(chips[0].label).toBe('Antigens: HLA-A');
      expect(chips[0].value).toBe('HLA-A');
    });

    it('should create all chips when all filters are populated', () => {
      const filters: FilterValue = {
        showGradeThrough: 'Yes',
        grades: ['A', 'B'],
        level: 2,
        pattern: 'P1',
        abo: 'A+',
        antigens: 'HLA-B',
      };

      const chips = HlaRbcFilterChipsUtils.createChipsFromFilters(filters);

      expect(chips.length).toBe(6);
      expect(chips.map(c => c.key)).toEqual([
        'showGradeThrough', 'grades', 'level', 'pattern', 'abo', 'antigens'
      ]);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = HlaRbcFilterChipsUtils.removeFilterByChipKey(null, 'showGradeThrough');
      expect(result).toBeNull();
    });

    it('should remove showGradeThrough and return null when no other filters remain', () => {
      const filters: FilterValue = {
        showGradeThrough: 'Yes',
      };

      const result = HlaRbcFilterChipsUtils.removeFilterByChipKey(filters, 'showGradeThrough');
      expect(result).toBeNull();
    });

    it('should remove grades filter and preserve others', () => {
      const filters: FilterValue = {
        grades: ['A', 'B'],
        level: 3,
      };

      const result = HlaRbcFilterChipsUtils.removeFilterByChipKey(filters, 'grades');

      expect(result).not.toBeNull();
      expect(result!.grades).toBeUndefined();
      expect(result!.level).toBe(3);
    });

    it('should remove level filter', () => {
      const filters: FilterValue = {
        level: 3,
        abo: 'O+',
      };

      const result = HlaRbcFilterChipsUtils.removeFilterByChipKey(filters, 'level');

      expect(result).not.toBeNull();
      expect(result!.level).toBeUndefined();
      expect(result!.abo).toBe('O+');
    });

    it('should remove pattern filter', () => {
      const filters: FilterValue = {
        pattern: 'P1',
        antigens: 'HLA-A',
      };

      const result = HlaRbcFilterChipsUtils.removeFilterByChipKey(filters, 'pattern');

      expect(result).not.toBeNull();
      expect(result!.pattern).toBeUndefined();
    });

    it('should remove abo filter', () => {
      const filters: FilterValue = {
        abo: 'O+',
        showGradeThrough: 'Yes',
      };

      const result = HlaRbcFilterChipsUtils.removeFilterByChipKey(filters, 'abo');

      expect(result).not.toBeNull();
      expect(result!.abo).toBeUndefined();
    });

    it('should remove antigens filter', () => {
      const filters: FilterValue = {
        antigens: 'HLA-A',
        level: 2,
      };

      const result = HlaRbcFilterChipsUtils.removeFilterByChipKey(filters, 'antigens');

      expect(result).not.toBeNull();
      expect(result!.antigens).toBeUndefined();
    });

    it('should return null when removing the last active filter', () => {
      const filters: FilterValue = {
        abo: 'A+',
      };

      const result = HlaRbcFilterChipsUtils.removeFilterByChipKey(filters, 'abo');
      expect(result).toBeNull();
    });

    it('should not modify filters when unknown chip key is provided', () => {
      const filters: FilterValue = {
        abo: 'O+',
      };

      const result = HlaRbcFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.abo).toBe('O+');
    });
  });

  describe('removeFilter', () => {
    it('should remove filter based on chip key', () => {
      const filters: FilterValue = {
        showGradeThrough: 'Yes',
        grades: ['A'],
        level: 2,
      };

      const chip: FilterChip = { key: 'showGradeThrough', label: 'Show Grade Through: Yes', value: 'Yes' };

      const result = HlaRbcFilterChipsUtils.removeFilter(filters, chip);

      expect(result.showGradeThrough).toBeUndefined();
      expect(result.grades).toEqual(['A']);
      expect(result.level).toBe(2);
    });

    it('should remove grades filter via chip', () => {
      const filters: FilterValue = {
        grades: ['A', 'B'],
      };
      const chip: FilterChip = { key: 'grades', label: 'Grades: A, B', value: 'A,B' };

      const result = HlaRbcFilterChipsUtils.removeFilter(filters, chip);
      expect(result.grades).toBeUndefined();
    });

    it('should remove pattern filter via chip', () => {
      const filters: FilterValue = {
        pattern: 'P1',
        abo: 'O+',
      };
      const chip: FilterChip = { key: 'pattern', label: 'Pattern: P1', value: 'P1' };

      const result = HlaRbcFilterChipsUtils.removeFilter(filters, chip);
      expect(result.pattern).toBeUndefined();
      expect(result.abo).toBe('O+');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(HlaRbcFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filter fields are set', () => {
      const filters: FilterValue = {};
      expect(HlaRbcFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when grades is empty array', () => {
      const filters: FilterValue = { grades: [] };
      expect(HlaRbcFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when showGradeThrough is set', () => {
      const filters: FilterValue = { showGradeThrough: 'Yes' };
      expect(HlaRbcFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when grades has values', () => {
      const filters: FilterValue = { grades: ['A'] };
      expect(HlaRbcFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when level is set', () => {
      const filters: FilterValue = { level: 1 };
      expect(HlaRbcFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when pattern is set', () => {
      const filters: FilterValue = { pattern: 'P1' };
      expect(HlaRbcFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when abo is set', () => {
      const filters: FilterValue = { abo: 'O+' };
      expect(HlaRbcFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when antigens is set', () => {
      const filters: FilterValue = { antigens: 'HLA-A' };
      expect(HlaRbcFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
