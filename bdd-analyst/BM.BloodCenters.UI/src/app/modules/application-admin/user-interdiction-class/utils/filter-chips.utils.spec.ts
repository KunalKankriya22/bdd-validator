import { FilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('FilterChipsUtils (User Interdiction Class)', () => {
  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = FilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when all filter fields are null', () => {
      const filters = FilterChipsUtils.getEmptyFilters();

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated filters', () => {
      const effDate = new Date(2025, 0, 15);
      const termDate = new Date(2025, 5, 30);
      const filters = {
        interClass: 'CLASS-A',
        effectiveDatePeriod: 'After',
        effectiveDate: effDate,
        terminationDatePeriod: 'After',
        terminationDate: termDate
      } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(expect.objectContaining({ key: 'interClass', removable: true }));
      expect(result[0].label).toBe('Interdiction Class: CLASS-A');
      expect(result[1].key).toBe('effectiveDate');
      expect(result[1].label).toContain('≥');
      expect(result[1].removable).toBe(true);
      expect(result[2].key).toBe('terminationDate');
    });

    it('should create interClass chip when set', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), interClass: 'B' };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('interClass');
      expect(result[0].label).toBe('Interdiction Class: B');
    });

    it('should not create effectiveDate chip when effectiveDate is null', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), effectiveDatePeriod: 'After' };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create effectiveDate chip when effectiveDatePeriod is null', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), effectiveDate: new Date(2025, 0, 1) };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should use >= for After period on effectiveDate', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        effectiveDatePeriod: 'After',
        effectiveDate: new Date(2025, 0, 15)
      };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
    });

    it('should use <= for Before period on terminationDate', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        terminationDatePeriod: 'Before',
        terminationDate: new Date(2025, 11, 31)
      };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should use custom formatDate function when provided', () => {
      const customFormatter = (date: Date | null) => date ? 'CUSTOM' : '';
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        effectiveDatePeriod: 'After',
        effectiveDate: new Date(2025, 0, 15)
      };

      const result = FilterChipsUtils.convertFiltersToChips(filters, customFormatter);

      expect(result[0].label).toContain('CUSTOM');
    });

    it('should use default date format when no custom formatter is provided', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        effectiveDatePeriod: 'After',
        effectiveDate: new Date(2025, 0, 15)
      };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toMatch(/Effective Date ≥ \d{2}-[A-Z]{3}-\d{4}/);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return empty filters when filters is null', () => {
      const result = FilterChipsUtils.removeFilterByChipKey(null, 'interClass');

      expect(result).toEqual(FilterChipsUtils.getEmptyFilters());
    });

    it('should clear interClass', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        interClass: 'A',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date()
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'interClass');

      expect(result.interClass).toBeNull();
      expect(result.effectiveDatePeriod).toBe('After');
    });

    it('should clear effectiveDate and effectiveDatePeriod together', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        effectiveDatePeriod: 'After',
        effectiveDate: new Date(2025, 0, 15),
        interClass: 'A'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result.effectiveDate).toBeNull();
      expect(result.effectiveDatePeriod).toBeNull();
    });

    it('should clear terminationDate and terminationDatePeriod together', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        terminationDatePeriod: 'Before',
        terminationDate: new Date(2025, 11, 31),
        interClass: 'B'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result.terminationDate).toBeNull();
      expect(result.terminationDatePeriod).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(FilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all values are null', () => {
      expect(FilterChipsUtils.hasActiveFilters(FilterChipsUtils.getEmptyFilters())).toBe(false);
    });

    it('should return true when interClass has a value', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), interClass: 'A' };

      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDatePeriod has a value', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), effectiveDatePeriod: 'After' };

      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('getEmptyFilters', () => {
    it('should return an object with all fields set to null', () => {
      const empty = FilterChipsUtils.getEmptyFilters();

      expect(empty).toEqual({
        interClass: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
    });
  });
});
