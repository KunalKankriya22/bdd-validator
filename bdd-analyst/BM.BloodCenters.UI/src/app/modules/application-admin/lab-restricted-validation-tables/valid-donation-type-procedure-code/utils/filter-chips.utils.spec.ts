import { convertFiltersToChips, removeFilterByChipKey, hasActiveFilters } from './filter-chips.utils';
import { DonationTypeProcedureCodeFilterValue } from '../models/valid-donation-type-procedure-code.model';

describe('Filter Chips Utils for Valid Donation Type Procedure Code', () => {
  describe('convertFiltersToChips', () => {

    it('should convert donationType filter to chip', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: 'WHOLE',
        procedureCode: null,
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: null,
        period: null,
        terminationDate: null,
        terminationPeriod: null
      };

      const result = convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('donationType');
      expect(result[0].label).toBe('Donation Type: WHOLE');
      expect(result[0].value).toBe('WHOLE');
      expect(result[0].removable).toBeTrue();
    });

    it('should convert procedureCode filter to chip', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: 'WB',
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: null,
        period: null,
        terminationDate: null,
        terminationPeriod: null
      };

      const result = convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('procedureCode');
      expect(result[0].label).toBe('Procedure Code: WB');
      expect(result[0].value).toBe('WB');
    });

    it('should convert attributeGroup filter to chip', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: 'TEST_GROUP',
        attributeCode: null,
        effectiveDate: null,
        period: null,
        terminationDate: null,
        terminationPeriod: null
      };

      const result = convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('attributeGroup');
      expect(result[0].label).toBe('Attribute Group: TEST_GROUP');
    });

    it('should convert effectiveDate with period to chip with After operator', () => {
      const testDate = new Date('2026-03-15');
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: testDate,
        period: 'After',
        terminationDate: null,
        terminationPeriod: null
      };

      const result = convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date');
      expect(result[0].label).toContain('≥');
      expect(result[0].value).toBe(testDate);
    });

    it('should convert effectiveDate with period to chip with Before operator', () => {
      const testDate = new Date('2026-03-15');
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: testDate,
        period: 'Before',
        terminationDate: null,
        terminationPeriod: null
      };

      const result = convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('≤');
    });

    it('should convert terminationDate with period to chip with After operator', () => {
      const testDate = new Date('2026-03-20');
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: null,
        period: null,
        terminationDate: testDate,
        terminationPeriod: 'After'
      };

      const result = convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date');
      expect(result[0].label).toContain('≥');
    });

    it('should convert terminationDate with period to chip with Before operator', () => {
      const testDate = new Date('2026-03-20');
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: null,
        period: null,
        terminationDate: testDate,
        terminationPeriod: 'Before'
      };

      const result = convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('≤');
    });

    it('should not create date chip if period is null', () => {
      const testDate = new Date('2026-03-15');
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: testDate,
        period: null,
        terminationDate: null,
        terminationPeriod: null
      };

      const result = convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });


    it('should convert all filters including both dates to chips', () => {
      const effDate = new Date('2026-03-15');
      const termDate = new Date('2026-12-31');
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: 'WHOLE',
        procedureCode: null,
        attributeGroup: 'TEST_GROUP',
        attributeCode: null,
        effectiveDate: effDate,
        period: 'After',
        terminationDate: termDate,
        terminationPeriod: 'Before'
      };

      const result = convertFiltersToChips(filters);
      expect(result.length).toBe(4);
      expect(result.find(c => c.key === 'donationType')).toBeTruthy();
      expect(result.find(c => c.key === 'attributeGroup')).toBeTruthy();
      expect(result.find(c => c.key === 'effectiveDate')).toBeTruthy();
      expect(result.find(c => c.key === 'terminationDate')).toBeTruthy();
    });
  });

  describe('removeFilterByChipKey', () => {



    it('should remove attributeGroup filter', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: 'TEST_GROUP',
        attributeCode: null,
        effectiveDate: new Date(),
        period: 'After',
        terminationDate: null,
        terminationPeriod: null
      };

      const result = removeFilterByChipKey(filters, 'attributeGroup');
      expect(result?.attributeGroup).toBeNull();
      expect(result?.effectiveDate).toBeTruthy();
      expect(result?.period).toBe('After');
    });

    it('should remove effectiveDate and period together', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: 'WHOLE',
        procedureCode: null,
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: new Date('2026-03-15'),
        period: 'After',
        terminationDate: null,
        terminationPeriod: null
      };

      const result = removeFilterByChipKey(filters, 'effectiveDate');
      expect(result?.effectiveDate).toBeNull();
      expect(result?.period).toBeNull();
      expect(result?.donationType).toBe('WHOLE');
    });

    it('should remove terminationDate and terminationPeriod together', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: 'WB',
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: null,
        period: null,
        terminationDate: new Date('2026-12-31'),
        terminationPeriod: 'Before'
      };

      const result = removeFilterByChipKey(filters, 'terminationDate');
      expect(result?.terminationDate).toBeNull();
      expect(result?.terminationPeriod).toBeNull();
      expect(result?.procedureCode).toBe('WB');
    });


  });

  describe('hasActiveFilters', () => {


    it('should return true when donationType is set', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: 'WHOLE',
        procedureCode: null,
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: null,
        period: null,
        terminationDate: null,
        terminationPeriod: null
      };

      expect(hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when procedureCode is set', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: 'WB',
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: null,
        period: null,
        terminationDate: null,
        terminationPeriod: null
      };

      expect(hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when attributeGroup is set', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: 'TEST_GROUP',
        attributeCode: null,
        effectiveDate: null,
        period: null,
        terminationDate: null,
        terminationPeriod: null
      };

      expect(hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when effectiveDate and period are set', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: new Date('2026-03-15'),
        period: 'After',
        terminationDate: null,
        terminationPeriod: null
      };

      expect(hasActiveFilters(filters)).toBeTrue();
    });


    it('should return true when terminationDate and terminationPeriod are set', () => {
      const filters: DonationTypeProcedureCodeFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        attributeCode: null,
        effectiveDate: null,
        period: null,
        terminationDate: new Date('2026-12-31'),
        terminationPeriod: 'Before'
      };

      expect(hasActiveFilters(filters)).toBeTrue();
    });


  });
});
