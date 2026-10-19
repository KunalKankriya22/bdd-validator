import { AccessClassesFilterChipsUtils } from './access-classes-filter-chips.utils';
import { AccessClassesFilterValue } from '../models/user-access-filters.model';

describe('AccessClassesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert class filter to chip', () => {
      const filters: AccessClassesFilterValue = {
        class: 'ADMIN',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AccessClassesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('class');
      expect(result[0].label).toBe('Class: ADMIN');
      expect(result[0].value).toBe('ADMIN');
    });

    it('should convert effectiveDate filter to chip with period', () => {
      const filters: AccessClassesFilterValue = {
        class: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AccessClassesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date');
      expect(result[0].label).toContain('≥');
      expect(result[0].value).toBe('2025-01-15');
    });

    it('should convert terminationDate filter to chip with period', () => {
      const filters: AccessClassesFilterValue = {
        class: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31'
      };

      const result = AccessClassesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date');
      expect(result[0].label).toContain('≤');
      expect(result[0].value).toBe('2025-12-31');
    });


    it('should use default period when not specified for effectiveDate', () => {
      const filters: AccessClassesFilterValue = {
        class: null,
        effectiveDatePeriod: null,
        effectiveDate: '2025-01-15',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AccessClassesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
    });

    it('should use default period when not specified for terminationDate', () => {
      const filters: AccessClassesFilterValue = {
        class: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: '2025-12-31'
      };

      const result = AccessClassesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove class filter', () => {
      const filters: AccessClassesFilterValue = {
        class: 'ADMIN',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AccessClassesFilterChipsUtils.removeFilterByChipKey(filters, 'class');

      expect(result).not.toBeNull();
      expect(result?.class).toBeNull();
      expect(result?.effectiveDate).toBe('2025-01-15');
    });

    it('should remove effectiveDate filter and period', () => {
      const filters: AccessClassesFilterValue = {
        class: 'ADMIN',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AccessClassesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result?.effectiveDate).toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
      expect(result?.class).toBe('ADMIN');
    });

    it('should remove terminationDate filter and period', () => {
      const filters: AccessClassesFilterValue = {
        class: 'ADMIN',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31'
      };

      const result = AccessClassesFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result?.terminationDate).toBeNull();
      expect(result?.terminationDatePeriod).toBeNull();
      expect(result?.class).toBe('ADMIN');
    });


  });

  describe('hasActiveFilters', () => {


    it('should return true when class is set', () => {
      const filters: AccessClassesFilterValue = {
        class: 'ADMIN',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AccessClassesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });



  });
});
