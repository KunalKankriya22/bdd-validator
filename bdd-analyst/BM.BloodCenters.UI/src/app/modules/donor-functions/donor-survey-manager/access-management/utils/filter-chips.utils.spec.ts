import { AccessManagementFilterChipsUtils } from './filter-chips.utils';
import { AccessManagementFilterValue } from '../models/access-management.model';

describe('AccessManagementFilterChipsUtils', () => {

  describe('convertFiltersToChips', () => {

    it('should convert chapterId filter to chip', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('chapterId');
      expect(chips[0].label).toBe('Chapter ID: CH001');
      expect(chips[0].value).toBe('CH001');
    });

    it('should convert alertRequired filter to chip', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: 'Yes',
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('alertRequired');
      expect(chips[0].label).toBe('Alert Required: Yes');
      expect(chips[0].value).toBe('Yes');
    });

    it('should convert effectiveDateFrom filter to chip with >= symbol', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: '2025-01-01',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('01-JAN-2025');
      expect(chips[0].removable).toBeTrue();
    });

    it('should convert effectiveDateTo filter to chip with <= symbol', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: '2025-12-31',
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≤');
      expect(chips[0].label).toContain('31-DEC-2025');
      expect(chips[0].removable).toBeTrue();
    });

    it('should convert terminationDateFrom filter to chip', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: '2025-06-01',
        terminationDateTo: null
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≥');
      expect(chips[0].label).toContain('01-JUN-2025');
    });

    it('should convert terminationDateTo filter to chip', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: '2025-12-31'
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≤');
      expect(chips[0].label).toContain('31-DEC-2025');
    });

  });

  describe('removeFilterByChipKey', () => {





    it('should remove effectiveDate filter while preserving other filters', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDateFrom: '2025-01-01',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const result = AccessManagementFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      // Other filters remain, so result is not null
      expect(result).not.toBeNull();
      expect(result?.chapterId).toBe('CH001');
      expect(result?.effectiveDateFrom).toBeNull();
      expect(result?.effectiveDateTo).toBeNull();
    });

    it('should remove terminationDate filter while preserving other filters', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: 'Yes',
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: '2025-01-01',
        terminationDateTo: null
      };

      const result = AccessManagementFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      // Other filters remain, so result is not null
      expect(result).not.toBeNull();
      expect(result?.alertRequired).toBe('Yes');
      expect(result?.terminationDateFrom).toBeNull();
      expect(result?.terminationDateTo).toBeNull();
    });


    it('should preserve other filters when removing one', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: 'CH001',
        alertRequired: 'Yes',
        effectiveDateFrom: '2025-01-01',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const result = AccessManagementFilterChipsUtils.removeFilterByChipKey(filters, 'chapterId');

      expect(result?.chapterId).toBeNull();
      expect(result?.alertRequired).toBe('Yes');
      expect(result?.effectiveDateFrom).toBe('2025-01-01');
    });
  });

  describe('hasActiveFilters', () => {

    it('should return true when chapterId is set', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const result = AccessManagementFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when alertRequired is set', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: 'Yes',
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const result = AccessManagementFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when effectiveDateFrom is set', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: '2025-01-01',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const result = AccessManagementFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when effectiveDateTo is set', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: '2025-12-31',
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const result = AccessManagementFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when terminationDateFrom is set', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: '2025-06-01',
        terminationDateTo: null
      };

      const result = AccessManagementFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when terminationDateTo is set', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: '2025-12-31'
      };

      const result = AccessManagementFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });


  });

  describe('formatDateForChip', () => {
    it('should format date in DD-MMM-YYYY format', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: '2025-01-15',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('15-JAN-2025');
    });

    it('should format different months correctly', () => {
      const testCases = [
        { date: '2025-01-01', expected: '01-JAN-2025' },
        { date: '2025-02-15', expected: '15-FEB-2025' },
        { date: '2025-03-20', expected: '20-MAR-2025' },
        { date: '2025-04-10', expected: '10-APR-2025' },
        { date: '2025-05-05', expected: '05-MAY-2025' },
        { date: '2025-06-30', expected: '30-JUN-2025' },
        { date: '2025-07-25', expected: '25-JUL-2025' },
        { date: '2025-08-12', expected: '12-AUG-2025' },
        { date: '2025-09-18', expected: '18-SEP-2025' },
        { date: '2025-10-22', expected: '22-OCT-2025' },
        { date: '2025-11-11', expected: '11-NOV-2025' },
        { date: '2025-12-31', expected: '31-DEC-2025' }
      ];

      testCases.forEach(testCase => {
        const filters: AccessManagementFilterValue = {
          chapterId: null,
          alertRequired: null,
          effectiveDateFrom: testCase.date,
          effectiveDateTo: null,
          terminationDateFrom: null,
          terminationDateTo: null
        };

        const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);
        expect(chips[0].label).toContain(testCase.expected);
      });
    });

    it('should handle invalid date gracefully', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: 'invalid-date',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      // Should still create a chip even with invalid date
      expect(chips.length).toBe(1);
    });

    it('should pad single digit days with zero', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: '2025-01-05',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('05-JAN-2025');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filter object', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should handle removing unknown chip key', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const result = AccessManagementFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      // Should return filters unchanged
      expect(result?.chapterId).toBe('CH001');
    });

    it('should prioritize effectiveDateFrom over effectiveDateTo', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: '2025-01-01',
        effectiveDateTo: '2025-12-31',
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      // Should only create one chip for effectiveDateFrom
      const effectiveDateChips = chips.filter(c => c.key === 'effectiveDate');
      expect(effectiveDateChips.length).toBe(1);
      expect(effectiveDateChips[0].label).toContain('≥');
    });

    it('should prioritize terminationDateFrom over terminationDateTo', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: null,
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: '2025-06-01',
        terminationDateTo: '2025-12-31'
      };

      const chips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

      // Should only create one chip for terminationDateFrom
      const terminationDateChips = chips.filter(c => c.key === 'terminationDate');
      expect(terminationDateChips.length).toBe(1);
      expect(terminationDateChips[0].label).toContain('≥');
    });
  });
});
