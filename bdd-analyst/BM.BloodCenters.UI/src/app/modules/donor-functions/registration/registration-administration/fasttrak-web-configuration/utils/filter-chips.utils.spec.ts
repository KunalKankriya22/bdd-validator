import { ResourceFilterChipsUtils } from './filter-chips.utils';
import { ResourceFilter } from '../filter/resource-filter';
import moment from 'moment';

describe('ResourceFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = ResourceFilterChipsUtils.convertFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when all filter fields are null', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = ResourceFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create effective date chip with >= when period is AFTER', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-03-15'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = ResourceFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('15-MAR-2025');
    });

    it('should create effective date chip with <= when period is BEFORE', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'BEFORE',
        effectiveDate: new Date('2025-06-20'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = ResourceFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Effective Date ≤');
      expect(chips[0].label).toContain('20-JUN-2025');
    });

    it('should not create effective date chip when date is set but period is null', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: null,
        effectiveDate: new Date('2025-03-15'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = ResourceFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

    it('should not create effective date chip when period is set but date is null', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = ResourceFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

    it('should create termination date chip with >= when period is AFTER', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
      };

      const chips = ResourceFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≥');
      expect(chips[0].label).toContain('31-DEC-2025');
    });

    it('should create termination date chip with <= when period is BEFORE', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-01-01'),
      };

      const chips = ResourceFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Termination Date ≤');
    });

    it('should not create termination date chip when date is set but period is null', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: new Date('2025-12-31'),
      };

      const result = ResourceFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

    it('should create both chips when both date filters are set', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-12-31'),
      };

      const chips = ResourceFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[1].key).toBe('terminationDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = ResourceFilterChipsUtils.removeFilterByChipKey(null, 'effectiveDate');
      expect(result).toBeNull();
    });

    it('should remove effectiveDate filter and return null when no other filters remain', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = ResourceFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result).toBeNull();
    });

    it('should remove effectiveDate filter and preserve termination date', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-12-31'),
      };

      const result = ResourceFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectiveDatePeriod).toBeNull();
      expect(result!.terminationDate).toEqual(new Date('2025-12-31'));
      expect(result!.terminationDatePeriod).toBe('BEFORE');
    });

    it('should remove terminationDate filter and preserve effective date', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-12-31'),
      };

      const result = ResourceFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationDatePeriod).toBeNull();
      expect(result!.effectiveDate).toEqual(new Date('2025-01-01'));
    });

    it('should remove terminationDate filter and return null when no other filters remain', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-12-31'),
      };

      const result = ResourceFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');
      expect(result).toBeNull();
    });

    it('should not modify filters when unknown chip key is provided', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = ResourceFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toEqual(new Date('2025-01-01'));
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(ResourceFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are null', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };
      expect(ResourceFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effective date and period are both set', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null,
      };
      expect(ResourceFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termination date and period are both set', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-12-31'),
      };
      expect(ResourceFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only period is set without date', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };
      expect(ResourceFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when only date is set without period', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: null,
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null,
      };
      expect(ResourceFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
