import { ReportActionFilterChipsUtils } from './report-action-filter-chips.utils';
import { ReportActionFilterValue } from '../models/report-action.model';

describe('ReportActionFilterChipsUtils', () => {
  describe('filtersToQueryParams', () => {
    it('should return empty object for null filters', () => {
      const result = ReportActionFilterChipsUtils.filtersToQueryParams(null);
      expect(result).toEqual({});
    });

    it('should return empty object for empty filters', () => {
      const filters: ReportActionFilterValue = {};
      const result = ReportActionFilterChipsUtils.filtersToQueryParams(filters);
      expect(result).toEqual({});
    });

    it('should include userName in query params', () => {
      const filters: ReportActionFilterValue = {
        userName: 'testuser'
      };
      const result = ReportActionFilterChipsUtils.filtersToQueryParams(filters);

      expect(result.userName).toBe('testuser');
    });

    it('should set submitDateFrom when generatedPeriodType is "after"', () => {
      const testDate = new Date(2025, 10, 21, 10, 30, 0); // Nov 21, 2025, 10:30:00
      const filters: ReportActionFilterValue = {
        generatedDate: testDate,
        generatedPeriodType: 'after'
      };

      const result = ReportActionFilterChipsUtils.filtersToQueryParams(filters);

      expect(result.submitDateFrom).toBeDefined();
      expect(result.submitDateTo).toBeUndefined();
      expect(result.submitDateFrom).toContain('2025-11-21');
      expect(result.submitDateFrom).toContain('10:30:00');
    });

    it('should set submitDateTo when generatedPeriodType is "before"', () => {
      const testDate = new Date(2025, 10, 21, 15, 45, 30); // Nov 21, 2025, 15:45:30
      const filters: ReportActionFilterValue = {
        generatedDate: testDate,
        generatedPeriodType: 'before'
      };

      const result = ReportActionFilterChipsUtils.filtersToQueryParams(filters);

      expect(result.submitDateTo).toBeDefined();
      expect(result.submitDateFrom).toBeUndefined();
      expect(result.submitDateTo).toContain('2025-11-21');
      expect(result.submitDateTo).toContain('15:45:30');
    });

    it('should preserve local date without timezone conversion', () => {
      // Test that Nov 21 stays Nov 21, not shifted to Nov 20
      const testDate = new Date(2025, 10, 21, 0, 0, 0); // Nov 21, 2025 midnight
      const filters: ReportActionFilterValue = {
        generatedDate: testDate,
        generatedPeriodType: 'after'
      };

      const result = ReportActionFilterChipsUtils.filtersToQueryParams(filters);

      // Verify the date is Nov 21, not Nov 20
      expect(result.submitDateFrom).toMatch(/2025-11-21T00:00:00/);
    });

    it('should format date as ISO string with milliseconds', () => {
      const testDate = new Date(2025, 0, 15, 9, 5, 3, 123); // Jan 15, 2025, 09:05:03.123
      const filters: ReportActionFilterValue = {
        generatedDate: testDate,
        generatedPeriodType: 'after'
      };

      const result = ReportActionFilterChipsUtils.filtersToQueryParams(filters);

      expect(result.submitDateFrom).toBe('2025-01-15T09:05:03.123Z');
    });

    it('should handle all filters combined', () => {
      const testDate = new Date(2026, 3, 9, 12, 0, 0); // Apr 9, 2026, 12:00:00
      const filters: ReportActionFilterValue = {
        userName: 'john.doe',
        generatedDate: testDate,
        generatedPeriodType: 'before'
      };

      const result = ReportActionFilterChipsUtils.filtersToQueryParams(filters);

      expect(result.userName).toBe('john.doe');
      expect(result.submitDateTo).toBeDefined();
      expect(result.submitDateTo).toContain('2026-04-09');
    });
  });

  describe('convertFiltersToChips', () => {

    it('should create chip for userName', () => {
      const filters: ReportActionFilterValue = {
        userName: 'testuser'
      };
      const chips = ReportActionFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('userName');
      expect(chips[0].label).toBe('User: testuser');
      expect(chips[0].value).toBe('testuser');
    });

    it('should create chip for generatedDate with "after" period', () => {
      const testDate = new Date(2025, 10, 21); // Nov 21, 2025
      const filters: ReportActionFilterValue = {
        generatedDate: testDate,
        generatedPeriodType: 'after'
      };
      const chips = ReportActionFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('generatedDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('21-NOV-2025');
    });

    it('should create chip for generatedDate with "before" period', () => {
      const testDate = new Date(2025, 10, 21); // Nov 21, 2025
      const filters: ReportActionFilterValue = {
        generatedDate: testDate,
        generatedPeriodType: 'before'
      };
      const chips = ReportActionFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('generatedDate');
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('21-NOV-2025');
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove userName filter', () => {
      const filters: ReportActionFilterValue = {
        userName: 'testuser',
        generatedDate: new Date()
      };
      const result = ReportActionFilterChipsUtils.removeFilterByChipKey(filters, 'userName');

      expect(result?.userName).toBeUndefined();
      expect(result?.generatedDate).toBeDefined();
    });

    it('should remove generatedDate and generatedPeriodType together', () => {
      const filters: ReportActionFilterValue = {
        userName: 'testuser',
        generatedDate: new Date(),
        generatedPeriodType: 'after'
      };
      const result = ReportActionFilterChipsUtils.removeFilterByChipKey(filters, 'generatedDate');

      expect(result?.generatedDate).toBeUndefined();
      expect(result?.generatedPeriodType).toBeUndefined();
      expect(result?.userName).toBe('testuser');
    });
  });

  describe('hasActiveFilters', () => {


    it('should return true if userName is set', () => {
      const filters: ReportActionFilterValue = {
        userName: 'testuser'
      };
      expect(ReportActionFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true if generatedDate is set', () => {
      const filters: ReportActionFilterValue = {
        generatedDate: new Date()
      };
      expect(ReportActionFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('getEmptyFilters', () => {
    it('should return filter object with undefined values', () => {
      const filters = ReportActionFilterChipsUtils.getEmptyFilters();

      expect(filters.userName).toBeUndefined();
      expect(filters.generatedDate).toBeUndefined();
      expect(filters.generatedPeriodType).toBeUndefined();
    });
  });
});
