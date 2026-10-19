import { DefineDonationProceduresFilterChipsUtils } from './filter-chips.utils';
import { DefineDonationProceduresFilterFormValue } from '../define-donation-procedures-filter-panel/define-donation-procedures-filter-panel';
import moment from 'moment';

describe('DefineDonationProceduresFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert donationType filter to chip', () => {
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: 'WB',
        procedureCode: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'donationType',
          label: 'Donation Type: WB',
          value: 'WB'
        }
      ]);
    });

    it('should convert procedureCode filter to chip', () => {
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: 'P001',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'procedureCode',
          label: 'Procedure Code: P001',
          value: 'P001'
        }
      ]);
    });

    it('should convert effectiveDate filter with period to chip', () => {
      const testDate = moment().add(10, 'days').toDate();
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: null,
        effectiveDate: testDate,
        effectiveDatePeriod: 'On or After',
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date ≥');
      expect(result[0].value).toBe(testDate);
    });

    it('should convert terminationDate filter with period to chip', () => {
      const testDate = moment().add(1, 'year').toDate();
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: testDate,
        terminationDatePeriod: 'On or Before'
      };

      const result = DefineDonationProceduresFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date ≤');
      expect(result[0].value).toBe(testDate);
    });


    it('should not create chip for effectiveDate without period', () => {
      const effectiveDate = moment().add(5, 'days').toDate();
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: null,
        effectiveDate: effectiveDate,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should not create chip for terminationDate without period', () => {
      const terminationDate = moment().add(1, 'year').toDate();
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: terminationDate,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {


    it('should remove procedureCode filter', () => {
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: 'WB',
        procedureCode: 'P001',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.removeFilterByChipKey(filters, 'procedureCode');

      expect(result).not.toBeNull();
      expect(result!.procedureCode).toBeNull();
      expect(result!.donationType).toBe('WB');
    });




    it('should return updated filters when other filters remain', () => {
      const effectiveDate = moment().add(5, 'days').toDate();
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: 'WB',
        procedureCode: 'P001',
        effectiveDate: effectiveDate,
        effectiveDatePeriod: 'On or After',
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      expect(result).not.toBeNull();
      expect(result!.donationType).toBeNull();
      expect(result!.procedureCode).toBe('P001');
      expect(result!.effectiveDate).toEqual(effectiveDate);
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false when all filters are null or empty', () => {
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when donationType is set', () => {
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: 'WB',
        procedureCode: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when procedureCode is set', () => {
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: 'P001',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when effectiveDate and period are set', () => {
      const effectiveDate = moment().add(5, 'days').toDate();
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: null,
        effectiveDate: effectiveDate,
        effectiveDatePeriod: 'On or After',
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when terminationDate and period are set', () => {
      const terminationDate = moment().add(1, 'year').toDate();
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: terminationDate,
        terminationDatePeriod: 'On or Before'
      };

      const result = DefineDonationProceduresFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return false when effectiveDate is set but period is not', () => {
      const effectiveDate = moment().add(5, 'days').toDate();
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: null,
        effectiveDate: effectiveDate,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return false when terminationDate is set but period is not', () => {
      const terminationDate = moment().add(1, 'year').toDate();
      const filters: DefineDonationProceduresFilterFormValue = {
        donationType: null,
        procedureCode: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: terminationDate,
        terminationDatePeriod: null
      };

      const result = DefineDonationProceduresFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

  });
});
