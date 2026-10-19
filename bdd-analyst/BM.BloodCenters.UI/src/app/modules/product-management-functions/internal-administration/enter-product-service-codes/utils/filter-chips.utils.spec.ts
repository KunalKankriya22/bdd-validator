import { EnterProductServiceCodesFilterChipsUtils } from './filter-chips.utils';
import { FilterValue } from '../models/enter-product-service-codes.model';

describe('EnterProductServiceCodesFilterChipsUtils', () => {
  describe('createFilterChips', () => {
    it('should return empty array when filters object is empty', () => {
      const chips = EnterProductServiceCodesFilterChipsUtils.createFilterChips({});
      expect(chips).toEqual([]);
    });

    it('should create chip for productCode', () => {
      const filters = { productCode: 'PC001' } as FilterValue;
      const result = EnterProductServiceCodesFilterChipsUtils.createFilterChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        label: 'Product Code: PC001',
        value: 'PC001',
        key: 'productCode',
      });
    });

    it('should create chip for invProductType', () => {
      const filters = { invProductType: 'INV01' } as FilterValue;
      const result = EnterProductServiceCodesFilterChipsUtils.createFilterChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        label: 'Inventory Product Type: INV01',
        value: 'INV01',
        key: 'invProductType',
      });
    });

    it('should create chip for productType', () => {
      const filters = { productType: 'RBC' } as FilterValue;
      const result = EnterProductServiceCodesFilterChipsUtils.createFilterChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        label: 'Product Type: RBC',
        value: 'RBC',
        key: 'productType',
      });
    });

    it('should create chip for serviceCode', () => {
      const filters = { serviceCode: 'SVC001' } as FilterValue;
      const result = EnterProductServiceCodesFilterChipsUtils.createFilterChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        label: 'Service Code: SVC001',
        value: 'SVC001',
        key: 'serviceCode',
      });
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        productCode: 'PC001',
        invProductType: 'INV01',
        productType: 'RBC',
        serviceCode: 'SVC001',
      } as FilterValue;
      const result = EnterProductServiceCodesFilterChipsUtils.createFilterChips(filters);

      expect(result.length).toBe(4);
      expect(result.map(c => c.key)).toEqual(['productCode', 'invProductType', 'productType', 'serviceCode']);
    });

    it('should not create chip when filter value is undefined', () => {
      const chips = EnterProductServiceCodesFilterChipsUtils.createFilterChips({
        productCode: undefined
      });
      expect(chips.length).toBe(0);
    });

    it('should not create chip when filter value is empty string', () => {
      const chips = EnterProductServiceCodesFilterChipsUtils.createFilterChips({
        productCode: ''
      });
      expect(chips.length).toBe(0);
    });

    it('should accept optional lookup arrays without affecting chip creation', () => {
      const filters = { productCode: 'PC001' } as FilterValue;
      const productCodeOptions = [{ productCode: 'PC001', productDesc: 'Product 1' }];
      const result = EnterProductServiceCodesFilterChipsUtils.createFilterChips(
        filters, productCodeOptions, [], [], []
      );

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('productCode');
    });
  });

  describe('removeFilter', () => {
    it('should remove productCode key', () => {
      const filters = {
        productCode: 'PC001',
        invProductType: 'INV01',
      } as FilterValue;
      const result = EnterProductServiceCodesFilterChipsUtils.removeFilter(filters, 'productCode');

      expect(result.productCode).toBeUndefined();
      expect(result.invProductType).toBe('INV01');
    });

    it('should remove invProductType key', () => {
      const filters = {
        productCode: 'PC001',
        invProductType: 'INV01',
      } as FilterValue;
      const result = EnterProductServiceCodesFilterChipsUtils.removeFilter(filters, 'invProductType');

      expect(result.invProductType).toBeUndefined();
      expect(result.productCode).toBe('PC001');
    });

    it('should remove productType key', () => {
      const filters = {
        productType: 'RBC',
        serviceCode: 'SVC001',
      } as FilterValue;
      const result = EnterProductServiceCodesFilterChipsUtils.removeFilter(filters, 'productType');

      expect(result.productType).toBeUndefined();
      expect(result.serviceCode).toBe('SVC001');
    });

    it('should remove serviceCode key', () => {
      const filters = { serviceCode: 'SVC001' } as FilterValue;
      const result = EnterProductServiceCodesFilterChipsUtils.removeFilter(filters, 'serviceCode');

      expect(result.serviceCode).toBeUndefined();
    });

    it('should not mutate the original filters object', () => {
      const original: FilterValue = { productCode: 'E0345', invProductType: 'RBC' };
      const result = EnterProductServiceCodesFilterChipsUtils.removeFilter(original, 'productCode');
      expect(original.productCode).toBe('E0345');
      expect(result).not.toBe(original);
    });

    it('should handle unknown key gracefully', () => {
      const filters = { productCode: 'PC001' } as FilterValue;
      const result = EnterProductServiceCodesFilterChipsUtils.removeFilter(filters, 'unknown');

      expect(result.productCode).toBe('PC001');
    });
  });

  describe('clearAllFilters', () => {
    it('should return an empty object', () => {
      const result = EnterProductServiceCodesFilterChipsUtils.clearAllFilters();
      expect(result).toEqual({});
    });

    it('should return a new object on each call', () => {
      const a = EnterProductServiceCodesFilterChipsUtils.clearAllFilters();
      const b = EnterProductServiceCodesFilterChipsUtils.clearAllFilters();
      expect(a).not.toBe(b);
    });
  });
});
