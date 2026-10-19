import { ProductTypePrioritizationFilterChipsUtils } from './filter-chips.utils';
import { ProductTypePrioritizationFilterValue } from '../models/product-type-prioritization.model';

describe('ProductTypePrioritizationFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert product type filter to chip', () => {
      const filters: ProductTypePrioritizationFilterValue = {
        productType: 'PT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ProductTypePrioritizationFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('productType');
      expect(result[0].label).toContain('Product Type');
    });
  });
  describe('hasActiveFilters', () => {

    it('should return true when product type filter is set', () => {
      const filters: ProductTypePrioritizationFilterValue = {
        productType: 'PT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(ProductTypePrioritizationFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});