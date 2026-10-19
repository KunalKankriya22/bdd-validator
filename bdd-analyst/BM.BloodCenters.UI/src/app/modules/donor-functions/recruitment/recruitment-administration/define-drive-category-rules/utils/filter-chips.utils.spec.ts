import { DriveCategoryRuleFilterChipsUtils } from './filter-chips.utils';
import { DriveCategoryRuleFilterValue } from '../models/drive-category-rules.model';

describe('DriveCategoryRuleFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should create chip for show terminated', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: true,
        effectiveDatePeriod: null,
        effectiveDateValue: null,
        terminationDatePeriod: null,
        terminationDateValue: null
      };

      const chips = DriveCategoryRuleFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('showTerminated');
      expect(chips[0].label).toBe('Show Terminated: Yes');
    });

    it('should create chip for effective date with Before period', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: false,
        effectiveDatePeriod: 'Before',
        effectiveDateValue: '2025-01-15',
        terminationDatePeriod: null,
        terminationDateValue: null
      };

      const chips = DriveCategoryRuleFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Before');
      expect(chips[0].label).toMatch(/15-jan-2025/i);
    });

    it('should create chip for effective date with After period', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: false,
        effectiveDatePeriod: 'After',
        effectiveDateValue: '2025-03-20',
        terminationDatePeriod: null,
        terminationDateValue: null
      };

      const chips = DriveCategoryRuleFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('After');
      expect(chips[0].label).toMatch(/20-mar-2025/i);
    });

    it('should create chip for termination date', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: false,
        effectiveDatePeriod: null,
        effectiveDateValue: null,
        terminationDatePeriod: 'Before',
        terminationDateValue: '2025-12-31'
      };

      const chips = DriveCategoryRuleFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Before');
      expect(chips[0].label).toMatch(/31-dec-2025/i);
    });

    it('should create multiple chips for multiple filters', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: true,
        effectiveDatePeriod: 'After',
        effectiveDateValue: '2025-01-01',
        terminationDatePeriod: 'Before',
        terminationDateValue: '2025-12-31'
      };

      const chips = DriveCategoryRuleFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(3);
      expect(chips.find(c => c.key === 'showTerminated')).toBeDefined();
      expect(chips.find(c => c.key === 'effectiveDate')).toBeDefined();
      expect(chips.find(c => c.key === 'terminationDate')).toBeDefined();
    });

    it('should not create chip if date period is set but value is null', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: false,
        effectiveDatePeriod: 'After',
        effectiveDateValue: null,
        terminationDatePeriod: null,
        terminationDateValue: null
      };

      const chips = DriveCategoryRuleFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {


    it('should remove effective date filter', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: true,
        effectiveDatePeriod: 'After',
        effectiveDateValue: '2025-01-01',
        terminationDatePeriod: null,
        terminationDateValue: null
      };

      const result = DriveCategoryRuleFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
      expect(result?.effectiveDateValue).toBeNull();
      expect(result?.showTerminated).toBe(true);
    });

    it('should remove termination date filter', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: true,
        effectiveDatePeriod: null,
        effectiveDateValue: null,
        terminationDatePeriod: 'Before',
        terminationDateValue: '2025-12-31'
      };

      const result = DriveCategoryRuleFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result?.terminationDatePeriod).toBeNull();
      expect(result?.terminationDateValue).toBeNull();
      expect(result?.showTerminated).toBe(true);
    });

  });

  describe('hasActiveFilters', () => {

    it('should return true if show terminated is active', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: true,
        effectiveDatePeriod: null,
        effectiveDateValue: null,
        terminationDatePeriod: null,
        terminationDateValue: null
      };

      const result = DriveCategoryRuleFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true if effective date is active', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: false,
        effectiveDatePeriod: 'After',
        effectiveDateValue: '2025-01-01',
        terminationDatePeriod: null,
        terminationDateValue: null
      };

      const result = DriveCategoryRuleFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true if termination date is active', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: false,
        effectiveDatePeriod: null,
        effectiveDateValue: null,
        terminationDatePeriod: 'Before',
        terminationDateValue: '2025-12-31'
      };

      const result = DriveCategoryRuleFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return false if no filters are active', () => {
      const filters: DriveCategoryRuleFilterValue = {
        showTerminated: false,
        effectiveDatePeriod: null,
        effectiveDateValue: null,
        terminationDatePeriod: null,
        terminationDateValue: null
      };

      const result = DriveCategoryRuleFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

  });
});
