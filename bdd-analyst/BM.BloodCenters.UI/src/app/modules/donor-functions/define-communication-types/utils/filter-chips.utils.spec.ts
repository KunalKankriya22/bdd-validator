import { CommTypesFilterChipsUtils } from './filter-chips.utils';
import { CommTypeFilter } from '../services/communication-types.service';

describe('CommTypesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = CommTypesFilterChipsUtils.convertFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when no date filters are set', () => {
      const filters: CommTypeFilter = {};
      const result = CommTypesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create effective date chip with >= symbol when period is AFTER', () => {
      const filters: CommTypeFilter = {
        effectiveDate: new Date('2025-03-15'),
        effectiveDatePeriod: 'AFTER',
      };

      const chips = CommTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('15-MAR-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should create effective date chip with <= symbol when period is BEFORE', () => {
      const filters: CommTypeFilter = {
        effectiveDate: new Date('2025-06-20'),
        effectiveDatePeriod: 'BEFORE',
      };

      const chips = CommTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('20-JUN-2025');
    });

    it('should not create effective date chip when effectiveDate is set but period is missing', () => {
      const filters: CommTypeFilter = {
        effectiveDate: new Date('2025-03-15'),
      };

      const chips = CommTypesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create effective date chip when period is set but date is missing', () => {
      const filters: CommTypeFilter = {
        effectiveDatePeriod: 'AFTER',
      };

      const chips = CommTypesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create termination date chip with >= symbol when period is AFTER', () => {
      const filters: CommTypeFilter = {
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'AFTER',
      };

      const chips = CommTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('31-DEC-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should create termination date chip with <= symbol when period is BEFORE', () => {
      const filters: CommTypeFilter = {
        terminationDate: new Date('2025-01-01'),
        terminationDatePeriod: 'BEFORE',
      };

      const chips = CommTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('01-JAN-2025');
    });

    it('should not create termination date chip when terminationDate is set but period is missing', () => {
      const filters: CommTypeFilter = {
        terminationDate: new Date('2025-12-31'),
      };

      const chips = CommTypesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create chips for both effective and termination dates when both are set', () => {
      const filters: CommTypeFilter = {
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE',
      };

      const chips = CommTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[1].key).toBe('terminationDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = CommTypesFilterChipsUtils.removeFilterByChipKey(null, 'effectiveDate');
      expect(result).toBeNull();
    });

    it('should remove effective date filter and return null when no other filters remain', () => {
      const filters: CommTypeFilter = {
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'AFTER',
      };

      const result = CommTypesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).toBeNull();
    });

    it('should remove effective date filter and preserve termination date', () => {
      const filters: CommTypeFilter = {
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE',
      };

      const result = CommTypesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeUndefined();
      expect(result!.effectiveDatePeriod).toBeUndefined();
      expect(result!.terminationDate).toEqual(new Date('2025-12-31'));
    });

    it('should remove termination date filter and return null when no other filters remain', () => {
      const filters: CommTypeFilter = {
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE',
      };

      const result = CommTypesFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).toBeNull();
    });

    it('should remove termination date filter and preserve effective date', () => {
      const filters: CommTypeFilter = {
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE',
      };

      const result = CommTypesFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeUndefined();
      expect(result!.terminationDatePeriod).toBeUndefined();
      expect(result!.effectiveDate).toEqual(new Date('2025-01-01'));
    });

    it('should not modify filters when unknown chip key is provided', () => {
      const filters: CommTypeFilter = {
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'AFTER',
      };

      const result = CommTypesFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toEqual(new Date('2025-01-01'));
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(CommTypesFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are set', () => {
      const filters: CommTypeFilter = {};
      expect(CommTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effective date and period are set', () => {
      const filters: CommTypeFilter = {
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'AFTER',
      };
      expect(CommTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termination date and period are set', () => {
      const filters: CommTypeFilter = {
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE',
      };
      expect(CommTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only date is set without period', () => {
      const filters: CommTypeFilter = {
        effectiveDate: new Date('2025-01-01'),
      };
      expect(CommTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when only period is set without date', () => {
      const filters: CommTypeFilter = {
        effectiveDatePeriod: 'AFTER',
      };
      expect(CommTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
