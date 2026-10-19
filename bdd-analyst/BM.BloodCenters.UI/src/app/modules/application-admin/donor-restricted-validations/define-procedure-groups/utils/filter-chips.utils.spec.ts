import { ProcedureGroupsFilterChipsUtils } from './filter-chips.utils';
import { DefineProcedureGroupsFilterValue } from '../models/define-procedure-groups.model';

describe('ProcedureGroupsFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array when all filters are null', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert procedure group code filter to chip', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: 'PLASM',
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('procedureGroupCode');
      expect(chips[0].label).toBe('Procedure Group: PLASM');
      expect(chips[0].value).toBe('PLASM');
    });

    it('should convert procedure code filter to chip', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: 'PL',
        donationCredits: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('procedureCode');
      expect(chips[0].label).toBe('Procedure Code: PL');
      expect(chips[0].value).toBe('PL');
    });

    it('should convert donation credits filter to chip', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: 2,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('donationCredits');
      expect(chips[0].label).toBe('Donation Credits: 2');
      expect(chips[0].value).toBe('2');
    });

    it('should convert donation credits 0 to chip', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: 0,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('donationCredits');
      expect(chips[0].label).toBe('Donation Credits: 0');
      expect(chips[0].value).toBe('0');
    });

    it('should convert period "After" filter to chip', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: 'After',
        terminationDatePeriod: null,
        terminationDate: null,
        effectiveDate: new Date('2025-01-15')
      };

      const chips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toBe('Effective Date ≥ 15-JAN-2025');
      expect(chips[0].value).toBe('After');
    });

    it('should convert period "Before" filter to chip', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: 'Before',
        terminationDatePeriod: null,
        terminationDate: null,
        effectiveDate: new Date('2025-12-31')
      };

      const chips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toBe('Effective Date ≤ 31-DEC-2025');
      expect(chips[0].value).toBe('Before');
    });

    it('should not create period chip if effectiveDatePeriod is set but effectiveDate is null', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });


    it('should format date correctly with single digit day', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: 'After',
        terminationDatePeriod: null,
        terminationDate: null,
        effectiveDate: new Date('2025-03-05')
      };

      const chips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toBe('Effective Date ≥ 05-MAR-2025');
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove procedure group code filter', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: 'PLASM',
        procedureCode: 'PL',
        donationCredits: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ProcedureGroupsFilterChipsUtils.removeFilterByChipKey(filters, 'procedureGroupCode');

      expect(result).not.toBeNull();
      expect(result?.procedureGroupCode).toBeNull();
      expect(result?.procedureCode).toBe('PL');
    });

    it('should remove procedure code filter', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: 'PLASM',
        procedureCode: 'PL',
        donationCredits: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ProcedureGroupsFilterChipsUtils.removeFilterByChipKey(filters, 'procedureCode');

      expect(result).not.toBeNull();
      expect(result?.procedureCode).toBeNull();
      expect(result?.procedureGroupCode).toBe('PLASM');
    });

    it('should remove donation credits filter', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: 'PLASM',
        procedureCode: null,
        donationCredits: 2,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ProcedureGroupsFilterChipsUtils.removeFilterByChipKey(filters, 'donationCredits');

      expect(result).not.toBeNull();
      expect(result?.donationCredits).toBeNull();
      expect(result?.procedureGroupCode).toBe('PLASM');
    });

    it('should remove effective date filter and clear all related fields', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: 'PLASM',
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ProcedureGroupsFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
      expect(result?.effectiveDate).toBeNull();
      expect(result?.procedureGroupCode).toBe('PLASM');
    });


    it('should preserve other filters when removing one', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: 'PLASM',
        procedureCode: 'PL',
        donationCredits: 1,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ProcedureGroupsFilterChipsUtils.removeFilterByChipKey(filters, 'procedureCode');

      expect(result).not.toBeNull();
      expect(result?.procedureCode).toBeNull();
      expect(result?.procedureGroupCode).toBe('PLASM');
      expect(result?.donationCredits).toBe(1);
      expect(result?.effectiveDatePeriod).toBe('After');
    });

  });

  describe('hasActiveFilters', () => {


    it('should return true when procedure group code filter is set', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: 'PLASM',
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(ProcedureGroupsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when procedure code filter is set', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: 'PL',
        donationCredits: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(ProcedureGroupsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when donation credits is 0', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: 0,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(ProcedureGroupsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when donation credits is set to positive number', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: 2,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(ProcedureGroupsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDatePeriod is set', () => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(ProcedureGroupsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });


  });

  describe('Date Formatting', () => {
    it('should format dates correctly for different months', () => {
      const months = [
        { date: new Date('2025-01-01'), expected: '01-JAN-2025' },
        { date: new Date('2025-02-15'), expected: '15-FEB-2025' },
        { date: new Date('2025-03-20'), expected: '20-MAR-2025' },
        { date: new Date('2025-04-10'), expected: '10-APR-2025' },
        { date: new Date('2025-05-25'), expected: '25-MAY-2025' },
        { date: new Date('2025-06-30'), expected: '30-JUN-2025' },
        { date: new Date('2025-07-04'), expected: '04-JUL-2025' },
        { date: new Date('2025-08-15'), expected: '15-AUG-2025' },
        { date: new Date('2025-09-22'), expected: '22-SEP-2025' },
        { date: new Date('2025-10-31'), expected: '31-OCT-2025' },
        { date: new Date('2025-11-11'), expected: '11-NOV-2025' },
        { date: new Date('2025-12-25'), expected: '25-DEC-2025' }
      ];

      months.forEach(({ date, expected }) => {
        const filters: DefineProcedureGroupsFilterValue = {
          procedureGroupCode: null,
          procedureCode: null,
          donationCredits: null,
          effectiveDatePeriod: 'After',
          effectiveDate: date,
          terminationDatePeriod: null,
          terminationDate: null
        };

        const chips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);
        expect(chips[0].label).toBe(`Effective Date ≥ ${expected}`);
      });
    });
  });
});
