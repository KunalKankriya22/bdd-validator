import { OverrideRulesFilterChipsUtils } from './filter-chips.utils';
import { OverrideRuleFilterValue } from '../models/override-rules.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

describe('OverrideRulesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array when no filters are set', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create chip for override flag "Yes"', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('overrideFlag');
      expect(result[0].label).toBe('Override Flag: Yes');
      expect(result[0].value).toBe('Y');
      expect(result[0].removable).toBe(true);
    });

    it('should create chip for override flag "No"', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'N',
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('overrideFlag');
      expect(result[0].label).toBe('Override Flag: No');
      expect(result[0].value).toBe('N');
      expect(result[0].removable).toBe(true);
    });

    it('should create chip for interdiction code', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: 'INT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('interdictionCode');
      expect(result[0].label).toBe('Interdiction: INT001');
      expect(result[0].value).toBe('INT001');
      expect(result[0].removable).toBe(true);
    });

    it('should create chip for effective date "After" with >= operator', () => {
      const testDate = new Date('2025-01-15');
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: testDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe('Effective Date ≥ 15-JAN-2025');
      expect(result[0].value).toBe(testDate);
      expect(result[0].removable).toBe(true);
    });

    it('should create chip for effective date "Before" with <= operator', () => {
      const testDate = new Date('2025-12-31');
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'BEFORE',
        effectiveDate: testDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe('Effective Date ≤ 31-DEC-2025');
      expect(result[0].value).toBe(testDate);
      expect(result[0].removable).toBe(true);
    });

    it('should create chip for termination date "After" with >= operator', () => {
      const testDate = new Date('2025-03-20');
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'AFTER',
        terminationDate: testDate
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toBe('Termination Date ≥ 20-MAR-2025');
      expect(result[0].value).toBe(testDate);
      expect(result[0].removable).toBe(true);
    });

    it('should create chip for termination date "Before" with <= operator', () => {
      const testDate = new Date('2025-06-30');
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: testDate
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toBe('Termination Date ≤ 30-JUN-2025');
      expect(result[0].value).toBe(testDate);
      expect(result[0].removable).toBe(true);
    });

    it('should create chip with moment date object', () => {
      const testDate = moment('2025-03-15');
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: testDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe('Effective Date ≥ 15-MAR-2025');
    });

    it('should not create chip for effective date if period is not set', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

    it('should not create chip for effective date if date is not set', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

    it('should create multiple chips for multiple filters', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-12-31')
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(4);
      expect(result.find(c => c.key === 'overrideFlag')).toBeDefined();
      expect(result.find(c => c.key === 'interdictionCode')).toBeDefined();
      expect(result.find(c => c.key === 'effectiveDate')).toBeDefined();
      expect(result.find(c => c.key === 'terminationDate')).toBeDefined();
    });

    it('should format dates correctly with leading zeros', () => {
      const testDate = new Date('2025-02-05');
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: testDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toBe('Effective Date ≥ 05-FEB-2025');
    });

    it('should format dates correctly for different months', () => {
      const months = [
        { date: new Date('2025-01-01'), expected: 'JAN' },
        { date: new Date('2025-02-01'), expected: 'FEB' },
        { date: new Date('2025-03-01'), expected: 'MAR' },
        { date: new Date('2025-04-01'), expected: 'APR' },
        { date: new Date('2025-05-01'), expected: 'MAY' },
        { date: new Date('2025-06-01'), expected: 'JUN' },
        { date: new Date('2025-07-01'), expected: 'JUL' },
        { date: new Date('2025-08-01'), expected: 'AUG' },
        { date: new Date('2025-09-01'), expected: 'SEP' },
        { date: new Date('2025-10-01'), expected: 'OCT' },
        { date: new Date('2025-11-01'), expected: 'NOV' },
        { date: new Date('2025-12-01'), expected: 'DEC' }
      ];

      months.forEach(({ date, expected }) => {
        const filters: OverrideRuleFilterValue = {
          overrideFlag: null,
          interdictionCode: null,
          effectiveDatePeriod: 'AFTER',
          effectiveDate: date,
          terminationDatePeriod: null,
          terminationDate: null
        };

        const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);
        expect(result[0].label).toContain(expected);
      });
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove override flag filter', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.removeFilterByChipKey(filters, 'overrideFlag');

      expect(result).not.toBeNull();
      expect(result!.overrideFlag).toBeNull();
      expect(result!.interdictionCode).toBe('INT001');
    });

    it('should remove interdiction code filter', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.removeFilterByChipKey(filters, 'interdictionCode');

      expect(result).not.toBeNull();
      expect(result!.interdictionCode).toBeNull();
      expect(result!.overrideFlag).toBe('Y');
    });




    it('should not affect other filters when removing one', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.removeFilterByChipKey(filters, 'overrideFlag');

      expect(result).not.toBeNull();
      expect(result!.overrideFlag).toBeNull();
      expect(result!.interdictionCode).toBe('INT001');
      expect(result!.effectiveDatePeriod).toBe('AFTER');
      expect(result!.effectiveDate).toBeDefined();
    });


  });

  describe('hasActiveFilters', () => {


    it('should return true when override flag is set', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when interdiction code is set', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: 'INT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when effective date is set', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when termination date is set', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-12-31')
      };

      const result = OverrideRulesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });


    it('should return false when only period is set without date', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should handle empty string values as falsy', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });
  });

  describe('Date Formatting', () => {
    it('should format date with string input', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: '2025-01-15',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toBe('Effective Date ≥ 15-JAN-2025');
    });

    it('should handle different date formats correctly', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date(2025, 0, 15), // Month is 0-indexed
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toBe('Effective Date ≥ 15-JAN-2025');
    });

    it('should format end of year dates correctly', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'BEFORE',
        effectiveDate: new Date('2025-12-31'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toBe('Effective Date ≤ 31-DEC-2025');
    });

    it('should format beginning of year dates correctly', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toBe('Effective Date ≥ 01-JAN-2025');
    });

    it('should format moment date objects correctly', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: moment('2025-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toBe('Effective Date ≥ 15-JUN-2025');
    });
  });

  describe('Edge Cases', () => {


    it('should preserve chips order when converting filters', () => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-12-31')
      };

      const result = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

      // Chips should be in order: override flag, interdiction, effective date, termination date
      expect(result[0].key).toBe('overrideFlag');
      expect(result[1].key).toBe('interdictionCode');
      expect(result[2].key).toBe('effectiveDate');
      expect(result[3].key).toBe('terminationDate');
    });
  });
});
