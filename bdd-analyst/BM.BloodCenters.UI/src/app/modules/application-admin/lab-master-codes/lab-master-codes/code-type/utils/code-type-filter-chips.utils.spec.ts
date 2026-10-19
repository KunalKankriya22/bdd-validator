import { CodeTypeFilterChipsUtils } from './code-type-filter-chips.utils';
import { CodeTypeFilter } from '../../services/lab-master-codes.service';

describe('CodeTypeFilterChipsUtils', () => {

  describe('convertFiltersToChips', () => {

    it('should return empty array for empty filter object', () => {
      const filters: CodeTypeFilter = {};
      expect(CodeTypeFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should return chip for effectiveDate with AFTER period', () => {
      const filters: CodeTypeFilter = {
        effectiveDate: new Date('2025-01-11'),
        effectiveDatePeriod: 'AFTER'
      };
      const chips = CodeTypeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('11-JAN-2025');
    });

    it('should return chip for effectiveDate with BEFORE period', () => {
      const filters: CodeTypeFilter = {
        effectiveDate: new Date('2025-06-20'),
        effectiveDatePeriod: 'BEFORE'
      };
      const chips = CodeTypeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('20-JUN-2025');
    });

    it('should not create chip when effectiveDate has no period', () => {
      const filters: CodeTypeFilter = {
        effectiveDate: new Date('2025-01-11')
      };
      expect(CodeTypeFilterChipsUtils.convertFiltersToChips(filters).length).toBe(0);
    });

    it('should not create chip when period has no date', () => {
      const filters: CodeTypeFilter = {
        effectiveDatePeriod: 'BEFORE'
      };
      expect(CodeTypeFilterChipsUtils.convertFiltersToChips(filters).length).toBe(0);
    });

    it('should return chip for terminationDate with AFTER period', () => {
      const filters: CodeTypeFilter = {
        terminationDate: new Date('2025-07-04'),
        terminationDatePeriod: 'AFTER'
      };
      const chips = CodeTypeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('04-JUL-2025');
    });

    it('should return chip for terminationDate with BEFORE period', () => {
      const filters: CodeTypeFilter = {
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      };
      const chips = CodeTypeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('31-DEC-2025');
    });

    it('should return two chips for both effective and termination dates', () => {
      const filters: CodeTypeFilter = {
        effectiveDate: new Date('2025-01-11'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      };
      const chips = CodeTypeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[1].key).toBe('terminationDate');
    });

    it('should format date string input correctly', () => {
      const filters: CodeTypeFilter = {
        effectiveDate: '2025-09-05',
        effectiveDatePeriod: 'AFTER'
      };
      const chips = CodeTypeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('05-SEP-2025');
    });
  });

  describe('removeFilterByChipKey', () => {




    it('should preserve remaining active filter after removing one', () => {
      const filters: CodeTypeFilter = {
        effectiveDate: new Date('2025-01-11'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      };
      const result = CodeTypeFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result?.terminationDate).toBeDefined();
      expect(result?.terminationDatePeriod).toBe('BEFORE');
    });

  });

  describe('hasActiveFilters', () => {

    it('should return false for empty object', () => {
      expect(CodeTypeFilterChipsUtils.hasActiveFilters({})).toBe(false);
    });

    it('should return false when only date set without period', () => {
      const filters: CodeTypeFilter = { effectiveDate: new Date() };
      expect(CodeTypeFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when only period set without date', () => {
      const filters: CodeTypeFilter = { terminationDatePeriod: 'BEFORE' };
      expect(CodeTypeFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effectiveDate and period are both set', () => {
      const filters: CodeTypeFilter = {
        effectiveDate: new Date(),
        effectiveDatePeriod: 'AFTER'
      };
      expect(CodeTypeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when terminationDate and period are both set', () => {
      const filters: CodeTypeFilter = {
        terminationDate: new Date(),
        terminationDatePeriod: 'BEFORE'
      };
      expect(CodeTypeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when both date filters active', () => {
      const filters: CodeTypeFilter = {
        effectiveDate: new Date(),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date(),
        terminationDatePeriod: 'BEFORE'
      };
      expect(CodeTypeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
