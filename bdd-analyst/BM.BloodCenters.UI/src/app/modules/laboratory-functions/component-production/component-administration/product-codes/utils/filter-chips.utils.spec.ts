import { ProductCodeFilterChipsUtils } from './filter-chips.utils';
import { ProductCodeFilterValue } from '../filter-panel/product-codes-filter-panel';
import moment from 'moment';

describe('ProductCodeFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: ProductCodeFilterValue = {
        productType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert productType filter to chip', () => {
      const filters: ProductCodeFilterValue = {
        productType: 'RBC',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('productType');
      expect(chips[0].label).toBe('Product Type: RBC');
      expect(chips[0].value).toBe('RBC');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert effective date with period and Moment value to chip with ≥ symbol', () => {
      const effDate = moment('2025-01-15');
      const filters: ProductCodeFilterValue = {
        productType: null,
        effectiveDatePeriod: 'After',
        effectiveDate: effDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toBe('Effective Date ≥ 15-JAN-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert effective date with Before period to chip with ≤ symbol', () => {
      const effDate = moment('2025-03-20');
      const filters: ProductCodeFilterValue = {
        productType: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: effDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toBe('Effective Date ≤ 20-MAR-2025');
    });

    it('should not create chip when period only without date', () => {
      const filters: ProductCodeFilterValue = {
        productType: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip when date only without period', () => {
      const effDate = moment('2025-03-20');
      const filters: ProductCodeFilterValue = {
        productType: null,
        effectiveDatePeriod: null,
        effectiveDate: effDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert termination date with period and Moment value to chip with ≤ symbol', () => {
      const termDate = moment('2025-12-31');
      const filters: ProductCodeFilterValue = {
        productType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: termDate
      };

      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toBe('Termination Date ≤ 31-DEC-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should not create termination chip when period only without date', () => {
      const filters: ProductCodeFilterValue = {
        productType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'After',
        terminationDate: null
      };

      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create date chips when both date and period are null', () => {
      const filters: ProductCodeFilterValue = {
        productType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: ProductCodeFilterValue = {
        productType: 'RBC',
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: moment('2025-12-31')
      };

      const chips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('productType');
      expect(chips[1].key).toBe('effectiveDate');
      expect(chips[2].key).toBe('terminationDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = ProductCodeFilterChipsUtils.removeFilterByChipKey(null, 'productType');
      expect(result).toBeNull();
    });

    it('should remove productType filter', () => {
      const filters: ProductCodeFilterValue = {
        productType: 'RBC',
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ProductCodeFilterChipsUtils.removeFilterByChipKey(filters, 'productType');
      expect(result).not.toBeNull();
      expect(result!.productType).toBeNull();
      expect(result!.effectiveDatePeriod).toBe('After');
    });

    it('should remove effectiveDate and effectiveDatePeriod', () => {
      const filters: ProductCodeFilterValue = {
        productType: 'RBC',
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ProductCodeFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectiveDatePeriod).toBeNull();
      expect(result!.productType).toBe('RBC');
    });

    it('should remove terminationDate and terminationDatePeriod', () => {
      const filters: ProductCodeFilterValue = {
        productType: 'RBC',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: moment('2025-12-31')
      };

      const result = ProductCodeFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');
      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationDatePeriod).toBeNull();
    });

    it('should return null when removing the last filter leaves all values null', () => {
      const filters: ProductCodeFilterValue = {
        productType: 'RBC',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ProductCodeFilterChipsUtils.removeFilterByChipKey(filters, 'productType');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: ProductCodeFilterValue = {
        productType: 'RBC',
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      ProductCodeFilterChipsUtils.removeFilterByChipKey(filters, 'productType');
      expect(filters.productType).toBe('RBC');
    });
  });
});
