import { TestMessageMappingFilterChipsUtils } from './filter-chips.utils';
import { TestMessageMappingFilterValue } from '../models/test-message-mapping.model';

describe('TestMessageMappingFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert result code filter to chip', () => {
      const filters: TestMessageMappingFilterValue = {
        resultCode: 'N',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = TestMessageMappingFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('resultCode');
      expect(result[0].label).toContain('Result');
    });

    it('should convert antibody flag filter to chip', () => {
      const filters: TestMessageMappingFilterValue = {
        resultCode: null,
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = TestMessageMappingFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('antibodyFlag');
      expect(result[0].label).toContain('Antibody');
    });

    it('should convert effective date filter to chip with period', () => {
      const filters: TestMessageMappingFilterValue = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = TestMessageMappingFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('≥');
    });

    it('should convert termination date filter to chip with period', () => {
      const filters: TestMessageMappingFilterValue = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      };

      const result = TestMessageMappingFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('≤');
    });

  });

  describe('removeFilterByChipKey', () => {

    it('should remove result code filter', () => {
      const filters: TestMessageMappingFilterValue = {
        resultCode: 'N',
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = TestMessageMappingFilterChipsUtils.removeFilterByChipKey(filters, 'resultCode');
      expect(result).not.toBeNull();
      expect(result?.resultCode).toBeNull();
      expect(result?.antibodyFlag).toBe('Y');
    });

    it('should remove antibody flag filter', () => {
      const filters: TestMessageMappingFilterValue = {
        resultCode: 'N',
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = TestMessageMappingFilterChipsUtils.removeFilterByChipKey(filters, 'antibodyFlag');
      expect(result).not.toBeNull();
      expect(result?.antibodyFlag).toBeNull();
      expect(result?.resultCode).toBe('N');
    });



  });

  describe('hasActiveFilters', () => {


    it('should return true when result code filter is set', () => {
      const filters: TestMessageMappingFilterValue = {
        resultCode: 'N',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(TestMessageMappingFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when antibody flag is set', () => {
      const filters: TestMessageMappingFilterValue = {
        resultCode: null,
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(TestMessageMappingFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when date filter is set', () => {
      const filters: TestMessageMappingFilterValue = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(),
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(TestMessageMappingFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});