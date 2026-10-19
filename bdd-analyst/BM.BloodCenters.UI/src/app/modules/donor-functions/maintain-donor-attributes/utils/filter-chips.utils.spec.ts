import { AttributeFilterChipsUtils } from './filter-chips.utils';
import { AttributeFilters } from '../models/maintain-donor-attributes.models';

describe('AttributeFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = AttributeFilterChipsUtils.convertFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when no filter fields are set', () => {
      const filters: AttributeFilters = {};

      const result = AttributeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create showTerminated chip when showTerminated is true', () => {
      const filters: AttributeFilters = {
        showTerminated: true,
      };

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('showTerminated');
      expect(chips[0].label).toBe('Show Terminated');
      expect(chips[0].value).toBe(true);
    });

    it('should not create showTerminated chip when showTerminated is false', () => {
      const filters: AttributeFilters = {
        showTerminated: false,
      };

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.filter(c => c.key === 'showTerminated').length).toBe(0);
    });

    it('should not create showTerminated chip when showTerminated is undefined', () => {
      const filters: AttributeFilters = {};

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.filter(c => c.key === 'showTerminated').length).toBe(0);
    });

    it('should create effective date chip with >= sign when period is "after"', () => {
      const filters: AttributeFilters = {
        effDate: '2025-03-15',
        effDatePeriod: 'after',
      };

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('15-MAR-2025');
    });

    it('should create effective date chip with <= sign when period is "before"', () => {
      const filters: AttributeFilters = {
        effDate: '2025-06-20',
        effDatePeriod: 'before',
      };

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Effective Date ≤');
      expect(chips[0].label).toContain('20-JUN-2025');
    });

    it('should use period as-is for unknown period values', () => {
      const filters: AttributeFilters = {
        effDate: '2025-01-01',
        effDatePeriod: 'on' as any,
      };

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('on');
    });

    it('should not create effective date chip when date is set but period is missing', () => {
      const filters: AttributeFilters = {
        effDate: '2025-03-15',
      };

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.filter(c => c.key === 'effDate').length).toBe(0);
    });

    it('should not create effective date chip when period is set but date is missing', () => {
      const filters: AttributeFilters = {
        effDatePeriod: 'after',
      };

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.filter(c => c.key === 'effDate').length).toBe(0);
    });

    it('should create termination date chip when both date and period are set', () => {
      const filters: AttributeFilters = {
        termDate: '2025-12-31',
        termDatePeriod: 'before',
      };

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('Termination Date ≤');
      expect(chips[0].label).toContain('31-DEC-2025');
    });

    it('should not create termination date chip when period is missing', () => {
      const filters: AttributeFilters = {
        termDate: '2025-12-31',
      };

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.filter(c => c.key === 'termDate').length).toBe(0);
    });

    it('should create all chips when all filters are populated', () => {
      const filters: AttributeFilters = {
        showTerminated: true,
        effDate: '2025-01-01',
        effDatePeriod: 'after',
        termDate: '2025-12-31',
        termDatePeriod: 'before',
      };

      const chips = AttributeFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('showTerminated');
      expect(chips[1].key).toBe('effDate');
      expect(chips[2].key).toBe('termDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = AttributeFilterChipsUtils.removeFilterByChipKey(null, 'showTerminated');
      expect(result).toBeNull();
    });

    it('should remove showTerminated and return null when no other filters remain', () => {
      const filters: AttributeFilters = {
        showTerminated: true,
      };

      const result = AttributeFilterChipsUtils.removeFilterByChipKey(filters, 'showTerminated');
      expect(result).toBeNull();
    });

    it('should remove showTerminated and preserve other filters', () => {
      const filters: AttributeFilters = {
        showTerminated: true,
        effDate: '2025-01-01',
        effDatePeriod: 'after',
      };

      const result = AttributeFilterChipsUtils.removeFilterByChipKey(filters, 'showTerminated');

      expect(result).not.toBeNull();
      expect(result!.showTerminated).toBeUndefined();
      expect(result!.effDate).toBe('2025-01-01');
    });

    it('should remove effDate filter and clear both date and period', () => {
      const filters: AttributeFilters = {
        showTerminated: true,
        effDate: '2025-01-01',
        effDatePeriod: 'after',
      };

      const result = AttributeFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');

      expect(result).not.toBeNull();
      expect(result!.effDate).toBeUndefined();
      expect(result!.effDatePeriod).toBeUndefined();
      expect(result!.showTerminated).toBe(true);
    });

    it('should remove termDate filter and clear both date and period', () => {
      const filters: AttributeFilters = {
        showTerminated: true,
        termDate: '2025-12-31',
        termDatePeriod: 'before',
      };

      const result = AttributeFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');

      expect(result).not.toBeNull();
      expect(result!.termDate).toBeUndefined();
      expect(result!.termDatePeriod).toBeUndefined();
    });

    it('should return null when removing the last active filter', () => {
      const filters: AttributeFilters = {
        effDate: '2025-01-01',
        effDatePeriod: 'after',
      };

      const result = AttributeFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result).toBeNull();
    });

    it('should not modify filters when unknown chip key is provided', () => {
      const filters: AttributeFilters = {
        showTerminated: true,
      };

      const result = AttributeFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.showTerminated).toBe(true);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(AttributeFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filter fields are set', () => {
      const filters: AttributeFilters = {};
      expect(AttributeFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when showTerminated is true', () => {
      const filters: AttributeFilters = { showTerminated: true };
      expect(AttributeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when showTerminated is false', () => {
      const filters: AttributeFilters = { showTerminated: false };
      expect(AttributeFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effDate is set', () => {
      const filters: AttributeFilters = { effDate: '2025-01-01' };
      expect(AttributeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termDate is set', () => {
      const filters: AttributeFilters = { termDate: '2025-12-31' };
      expect(AttributeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
