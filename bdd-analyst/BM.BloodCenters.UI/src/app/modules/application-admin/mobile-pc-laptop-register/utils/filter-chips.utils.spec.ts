import { MobilePcLaptopRegisterFilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('MobilePcLaptopRegisterFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = MobilePcLaptopRegisterFilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when no filter fields are set', () => {
      const result = MobilePcLaptopRegisterFilterChipsUtils.convertFiltersToChips({} as any);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated filters', () => {
      const refreshDate = new Date(2025, 0, 15);
      const filters = {
        chapter: 'CH01',
        period: 'Monthly',
        refreshDate: refreshDate
      } as any;

      const result = MobilePcLaptopRegisterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ key: 'chapter', label: 'Chapter: CH01', value: 'CH01' });
      expect(result[1]).toEqual({ key: 'period', label: 'Period', value: 'Monthly' });
      expect(result[2].key).toBe('refreshDate');
      expect(result[2].label).toBe('Refresh Date');
    });

    it('should create chapter chip when chapter is set', () => {
      const filters = { chapter: 'CH02' } as any;

      const result = MobilePcLaptopRegisterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('chapter');
      expect(result[0].label).toBe('Chapter: CH02');
    });

    it('should create period chip when period is set', () => {
      const filters = { period: 'Weekly' } as any;

      const result = MobilePcLaptopRegisterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('period');
      expect(result[0].label).toBe('Period');
    });

    it('should create refreshDate chip with formatted date value', () => {
      const refreshDate = new Date(2025, 11, 25);
      const filters = { refreshDate } as any;

      const result = MobilePcLaptopRegisterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('refreshDate');
      expect(result[0].value).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should not create chip for undefined filter fields', () => {
      const filters = { chapter: undefined, period: undefined, refreshDate: undefined } as any;

      const result = MobilePcLaptopRegisterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = MobilePcLaptopRegisterFilterChipsUtils.removeFilterByChipKey(null, 'chapter');

      expect(result).toBeNull();
    });

    it('should remove chapter filter and return remaining', () => {
      const filters = { chapter: 'CH01', period: 'Monthly' } as any;

      const result = MobilePcLaptopRegisterFilterChipsUtils.removeFilterByChipKey(filters, 'chapter');

      expect(result).not.toBeNull();
      expect(result!.chapter).toBeUndefined();
      expect(result!.period).toBe('Monthly');
    });

    it('should remove period filter', () => {
      const filters = { chapter: 'CH01', period: 'Monthly' } as any;

      const result = MobilePcLaptopRegisterFilterChipsUtils.removeFilterByChipKey(filters, 'period');

      expect(result).not.toBeNull();
      expect(result!.period).toBeUndefined();
    });

    it('should remove refreshDate filter', () => {
      const filters = { chapter: 'CH01', refreshDate: new Date() } as any;

      const result = MobilePcLaptopRegisterFilterChipsUtils.removeFilterByChipKey(filters, 'refreshDate');

      expect(result).not.toBeNull();
      expect(result!.refreshDate).toBeUndefined();
    });

    it('should return null when removing the last remaining filter', () => {
      const filters = { chapter: 'CH01' } as any;

      const result = MobilePcLaptopRegisterFilterChipsUtils.removeFilterByChipKey(filters, 'chapter');

      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters = { chapter: 'CH01', period: 'Monthly' } as any;
      const original = { ...filters };

      MobilePcLaptopRegisterFilterChipsUtils.removeFilterByChipKey(filters, 'chapter');

      expect(filters).toEqual(original);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(MobilePcLaptopRegisterFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are undefined', () => {
      expect(MobilePcLaptopRegisterFilterChipsUtils.hasActiveFilters({} as any)).toBe(false);
    });

    it('should return false when all fields are null', () => {
      const filters = { chapter: null, period: null, refreshDate: null } as any;

      expect(MobilePcLaptopRegisterFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when all fields are empty strings', () => {
      const filters = { chapter: '', period: '', refreshDate: '' } as any;

      expect(MobilePcLaptopRegisterFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when at least one field has a value', () => {
      const filters = { chapter: 'CH01' } as any;

      expect(MobilePcLaptopRegisterFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
