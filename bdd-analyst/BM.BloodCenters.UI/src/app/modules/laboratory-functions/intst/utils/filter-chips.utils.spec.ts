import { TierPricingFilterChipsUtils } from './filter-chips.utils';
import { TierPricingFilterValue } from '../models/customer-product-tier-pricing.model';

describe('TierPricingFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(TierPricingFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when no filters are set', () => {
      const filters = { customerId: null, productType: null } as unknown as TierPricingFilterValue;
      expect(TierPricingFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for customerId', () => {
      const filters = { customerId: 'CUST001' } as TierPricingFilterValue;
      const result = TierPricingFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'customerId',
        label: 'Customer ID: CUST001',
        value: 'CUST001',
      });
    });

    it('should create chip for productType', () => {
      const filters = { productType: 'RBC' } as TierPricingFilterValue;
      const result = TierPricingFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'productType',
        label: 'Product Type: RBC',
        value: 'RBC',
      });
    });

    it('should create chips for all populated filters', () => {
      const filters = { customerId: 'CUST001', productType: 'RBC' } as TierPricingFilterValue;
      const result = TierPricingFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(2);
      expect(result[0].key).toBe('customerId');
      expect(result[1].key).toBe('productType');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(TierPricingFilterChipsUtils.removeFilterByChipKey(null, 'customerId')).toBeNull();
    });

    it('should set customerId to null when removing customerId chip', () => {
      const filters = { customerId: 'CUST001', productType: 'RBC' } as TierPricingFilterValue;
      const result = TierPricingFilterChipsUtils.removeFilterByChipKey(filters, 'customerId');

      expect(result).not.toBeNull();
      expect(result!.customerId).toBeNull();
      expect(result!.productType).toBe('RBC');
    });

    it('should set productType to null when removing productType chip', () => {
      const filters = { customerId: 'CUST001', productType: 'RBC' } as TierPricingFilterValue;
      const result = TierPricingFilterChipsUtils.removeFilterByChipKey(filters, 'productType');

      expect(result).not.toBeNull();
      expect(result!.productType).toBeNull();
      expect(result!.customerId).toBe('CUST001');
    });

    it('should return null when removing last active filter', () => {
      const filters = { customerId: 'CUST001', productType: null } as unknown as TierPricingFilterValue;
      const result = TierPricingFilterChipsUtils.removeFilterByChipKey(filters, 'customerId');

      expect(result).toBeNull();
    });

    it('should not mutate original filters', () => {
      const filters = { customerId: 'CUST001', productType: 'RBC' } as TierPricingFilterValue;
      TierPricingFilterChipsUtils.removeFilterByChipKey(filters, 'customerId');

      expect(filters.customerId).toBe('CUST001');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(TierPricingFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters = { customerId: null, productType: null } as unknown as TierPricingFilterValue;
      expect(TierPricingFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when customerId is set', () => {
      const filters = { customerId: 'CUST001' } as TierPricingFilterValue;
      expect(TierPricingFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when productType is set', () => {
      const filters = { productType: 'RBC' } as TierPricingFilterValue;
      expect(TierPricingFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when both filters are set', () => {
      const filters = { customerId: 'CUST001', productType: 'RBC' } as TierPricingFilterValue;
      expect(TierPricingFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
