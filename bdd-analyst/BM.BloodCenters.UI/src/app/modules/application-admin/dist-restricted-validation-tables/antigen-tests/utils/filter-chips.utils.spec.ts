import { AntigenTestFilterChipsUtils } from './filter-chips.utils';
import { AntigenTestFilterValue } from '../models/antigen-test.model';

describe('AntigenTestFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert price filter to chip', () => {
      const filters: AntigenTestFilterValue = {
        priceRange: 'Over',
        price: 100.50,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = AntigenTestFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('price');
      expect(chips[0].label).toBe('Price Over $100.50');
    });

    it('should convert effective date filter to chip', () => {
      const filters: AntigenTestFilterValue = {
        priceRange: null,
        price: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-11'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = AntigenTestFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
    });

    it('should convert all filters to chips', () => {
      const filters: AntigenTestFilterValue = {
        priceRange: 'Over',
        price: 100,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-11'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-01-31')
      };

      const chips = AntigenTestFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
    });
  });

  describe('removeFilterByChipKey', () => {


    it('should remove effective date filter and keep others', () => {
      const filters: AntigenTestFilterValue = {
        priceRange: 'Over',
        price: 100,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-11'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AntigenTestFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result).not.toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
      expect(result?.effectiveDate).toBeNull();
      expect(result?.priceRange).toBe('Over');
      expect(result?.price).toBe(100);
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false when all filters are empty', () => {
      const filters: AntigenTestFilterValue = {
        priceRange: null,
        price: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(AntigenTestFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when price filter is active', () => {
      const filters: AntigenTestFilterValue = {
        priceRange: 'Over',
        price: 100,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(AntigenTestFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when any filter is active', () => {
      const filters: AntigenTestFilterValue = {
        priceRange: null,
        price: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date(),
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(AntigenTestFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
