import { FilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('FilterChipsUtils (Interdiction Class)', () => {
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
      const filters = {
        interdictionCode: 'IC001',
        type: 'TypeA',
        class: 'ClassB',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15',
        terminationDatePeriod: 'After',
        terminationDate: '2025-06-30'
      } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual(expect.objectContaining({ key: 'interdictionCode', removable: true }));
      expect(result[0].label).toBe('Interdiction Code: IC001');
      expect(result[1]).toEqual(expect.objectContaining({ key: 'type', removable: true }));
      expect(result[1].label).toBe('Type: TypeA');
      expect(result[2]).toEqual(expect.objectContaining({ key: 'class', removable: true }));
      expect(result[2].label).toBe('Class: ClassB');
      expect(result[3].key).toBe('effectiveDate');
      expect(result[3].removable).toBe(true);
      expect(result[4].key).toBe('terminationDate');
    });

    it('should create interdictionCode chip when set', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), interdictionCode: 'IC001' };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('interdictionCode');
      expect(result[0].label).toBe('Interdiction Code: IC001');
    });

    it('should create type chip when set', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), type: 'Donor' };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('type');
      expect(result[0].label).toBe('Type: Donor');
    });

    it('should create class chip when set', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), class: 'A' };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('class');
      expect(result[0].label).toBe('Class: A');
    });

    it('should not create effectiveDate chip when effectiveDate is null', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), effectiveDatePeriod: 'After' };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create effectiveDate chip when effectiveDatePeriod is null', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), effectiveDate: '2025-01-01' };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should use >= for After period on effectiveDate', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15'
      };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('≥');
    });

    it('should use <= for non-After period on terminationDate', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31'
      };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('≤');
    });

    it('should use custom formatDate function when provided', () => {
      const customFormatter = (date: string | null) => date ? 'CUSTOM_DATE' : '';
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15'
      };

      const result = FilterChipsUtils.convertFiltersToChips(filters, customFormatter);

      expect(result[0].label).toContain('CUSTOM_DATE');
    });

    it('should use default date format when no custom formatter is provided', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15'
      };

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toMatch(/Effective Date ≥ \d{2}-[A-Z]{3}-\d{4}/);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return empty filters when filters is null', () => {
      const result = FilterChipsUtils.removeFilterByChipKey(null, 'interdictionCode');

      expect(result).toEqual(FilterChipsUtils.getEmptyFilters());
    });

    it('should clear interdictionCode', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), interdictionCode: 'IC001', type: 'TypeA' };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'interdictionCode');

      expect(result.interdictionCode).toBeNull();
      expect(result.type).toBe('TypeA');
    });

    it('should clear type', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), type: 'TypeA', class: 'B' };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'type');

      expect(result.type).toBeNull();
      expect(result.class).toBe('B');
    });

    it('should clear class', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), class: 'A', interdictionCode: 'IC001' };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'class');

      expect(result.class).toBeNull();
    });

    it('should clear effectiveDate and effectiveDatePeriod together', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15',
        interdictionCode: 'IC001'
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result.effectiveDate).toBeNull();
      expect(result.effectiveDatePeriod).toBeNull();
    });

    it('should clear terminationDate and terminationDatePeriod together', () => {
      const filters = {
        ...FilterChipsUtils.getEmptyFilters(),
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31',
        type: 'TypeA'
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

    it('should return true when any field has a non-null value', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), interdictionCode: 'IC001' };

      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDatePeriod is set (even without effectiveDate)', () => {
      const filters = { ...FilterChipsUtils.getEmptyFilters(), effectiveDatePeriod: 'After' };

      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('getEmptyFilters', () => {
    it('should return an object with all fields set to null', () => {
      const empty = FilterChipsUtils.getEmptyFilters();

      expect(empty).toEqual({
        interdictionCode: null,
        type: null,
        class: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
    });
  });
});
