import { SystemParameterFilterChipsUtils } from './filter-chips.utils';
import { SystemParameterFilterFormValue } from '../interfaces/view-system-parameter.interface';

describe('SystemParameterFilterChipsUtils', () => {

  describe('convertFiltersToChips', () => {

    it('should return empty array when no active filters', () => {
      const filters: SystemParameterFilterFormValue = {
        parameter: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };
      expect(SystemParameterFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create effective date chip with After period', () => {
      const filters: SystemParameterFilterFormValue = {
        parameter: null,
        effectivePeriod: 'After',
        effectiveDate: '2025-01-15',
        terminationPeriod: null,
        terminationDate: null
      };
      const chips = SystemParameterFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].removable).toBe(true);
    });

    it('should create effective date chip with Before period', () => {
      const filters: SystemParameterFilterFormValue = {
        parameter: null,
        effectivePeriod: 'Before',
        effectiveDate: '2025-06-01',
        terminationPeriod: null,
        terminationDate: null
      };
      const chips = SystemParameterFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });


    it('should create both chips when both filters are set', () => {
      const filters: SystemParameterFilterFormValue = {
        parameter: null,
        effectivePeriod: 'After',
        effectiveDate: '2025-01-01',
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };
      const chips = SystemParameterFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(2);
    });

    it('should not create chip when date is set but period is missing', () => {
      const filters: SystemParameterFilterFormValue = {
        parameter: null,
        effectivePeriod: null,
        effectiveDate: '2025-01-01',
        terminationPeriod: null,
        terminationDate: null
      };
      const chips = SystemParameterFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should clear effective date filter', () => {
      const filters: SystemParameterFilterFormValue = {
        parameter: null,
        effectivePeriod: 'After',
        effectiveDate: '2025-01-01',
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };
      const result = SystemParameterFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result).not.toBeNull();
      expect(result!.effectivePeriod).toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.terminationPeriod).toBe('Before');
    });

    it('should clear termination date filter', () => {
      const filters: SystemParameterFilterFormValue = {
        parameter: null,
        effectivePeriod: 'After',
        effectiveDate: '2025-01-01',
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };
      const result = SystemParameterFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');
      expect(result).not.toBeNull();
      expect(result!.terminationPeriod).toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.effectivePeriod).toBe('After');
    });

  });

  describe('hasActiveFilters', () => {

    it('should return false when all filters are empty', () => {
      const filters: SystemParameterFilterFormValue = {
        parameter: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };
      expect(SystemParameterFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effective date filter is active', () => {
      const filters: SystemParameterFilterFormValue = {
        parameter: null,
        effectivePeriod: 'After',
        effectiveDate: '2025-01-01',
        terminationPeriod: null,
        terminationDate: null
      };
      expect(SystemParameterFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when date is set but period is missing', () => {
      const filters: SystemParameterFilterFormValue = {
        parameter: null,
        effectivePeriod: null,
        effectiveDate: '2025-01-01',
        terminationPeriod: null,
        terminationDate: null
      };
      expect(SystemParameterFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });

  describe('getEmptyFilters', () => {
    it('should return all null values', () => {
      const empty = SystemParameterFilterChipsUtils.getEmptyFilters();
      expect(empty.effectivePeriod).toBeNull();
      expect(empty.effectiveDate).toBeNull();
      expect(empty.terminationPeriod).toBeNull();
      expect(empty.terminationDate).toBeNull();
    });
  });
});
