import { BarCodeFilterChipsUtils } from './filter-chips.utils';
import { BarCodeFilterValue } from '../models/bar-code.model';

describe('BarCodeFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert test ID filter to chip', () => {
      const filters: BarCodeFilterValue = {
        testId: 'T001',
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BarCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('testId');
      expect(result[0].label).toBe('Test ID: T001');
    });

    it('should convert result code N filter to chip with Negative display', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BarCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('resultCode');
      expect(result[0].label).toBe('Result: Negative');
    });

    it('should convert result code P filter to chip with Positive display', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: 'P',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BarCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toBe('Result: Positive');
    });

    it('should convert effective date filter to chip with period', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BarCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date');
      expect(result[0].label).toContain('≥');
    });

    it('should convert termination date filter to chip with period', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      };

      const result = BarCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date');
      expect(result[0].label).toContain('≤');
    });

  });

  describe('removeFilterByChipKey', () => {

    it('should remove test ID filter', () => {
      const filters: BarCodeFilterValue = {
        testId: 'T001',
        resultCode: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BarCodeFilterChipsUtils.removeFilterByChipKey(filters, 'testId');
      expect(result).not.toBeNull();
      expect(result?.testId).toBeNull();
      expect(result?.resultCode).toBe('N');
    });

    it('should remove result code filter', () => {
      const filters: BarCodeFilterValue = {
        testId: 'T001',
        resultCode: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BarCodeFilterChipsUtils.removeFilterByChipKey(filters, 'resultCode');
      expect(result).not.toBeNull();
      expect(result?.resultCode).toBeNull();
      expect(result?.testId).toBe('T001');
    });



  });

  describe('hasActiveFilters', () => {


    it('should return true when at least one filter is set', () => {
      const filters: BarCodeFilterValue = {
        testId: 'T001',
        resultCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BarCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when date filter is set', () => {
      const filters: BarCodeFilterValue = {
        testId: null,
        resultCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BarCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });
  });
});
