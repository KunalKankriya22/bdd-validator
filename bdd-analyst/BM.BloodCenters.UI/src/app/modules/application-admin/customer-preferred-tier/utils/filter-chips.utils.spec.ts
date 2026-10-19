import { CustomerPreferredTierFilterChipsUtils } from './filter-chips.utils';
import {
  CustomerPreferredTierFilterValue,
  ProductTypeDropdownDto
} from '../models/customer-preferred-tier.model';

describe('CustomerPreferredTierFilterChipsUtils', () => {
  const mockProductTypes: ProductTypeDropdownDto[] = [
    { productType: 'WB', productTypeDesc: 'Whole Blood' },
    { productType: 'RBC', productTypeDesc: 'Red Blood Cells' }
  ];

  describe('generateFilterChips', () => {

    it('should generate chip for product type filter', () => {
      const filters: CustomerPreferredTierFilterValue = {
        productType: 'WB',
        effDatePeriod: null,
        effDateFilter: null,
        termDatePeriod: null,
        termDateFilter: null
      };

      const chips = CustomerPreferredTierFilterChipsUtils.generateFilterChips(filters, mockProductTypes);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Product: WB - Whole Blood');
      expect(chips[0].key).toBe('productType');
    });

    it('should generate chip for effective date filter', () => {
      const filters: CustomerPreferredTierFilterValue = {
        productType: null,
        effDatePeriod: 'After',
        effDateFilter: '2024-06-01T12:00:00.000Z',
        termDatePeriod: null,
        termDateFilter: null
      };

      const chips = CustomerPreferredTierFilterChipsUtils.generateFilterChips(filters, mockProductTypes);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toContain('Effective Date ≥');
    });

    it('should generate chip for termination date filter', () => {
      const filters: CustomerPreferredTierFilterValue = {
        productType: null,
        effDatePeriod: null,
        effDateFilter: null,
        termDatePeriod: 'Before',
        termDateFilter: '2025-12-31T12:00:00.000Z'
      };

      const chips = CustomerPreferredTierFilterChipsUtils.generateFilterChips(filters, mockProductTypes);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('Termination Date ≤');
    });

    it('should generate chips for all applied filters', () => {
      const filters: CustomerPreferredTierFilterValue = {
        productType: 'WB',
        effDatePeriod: 'After',
        effDateFilter: '2024-01-01T12:00:00.000Z',
        termDatePeriod: 'Before',
        termDateFilter: '2025-12-31T12:00:00.000Z'
      };

      const chips = CustomerPreferredTierFilterChipsUtils.generateFilterChips(filters, mockProductTypes);
      expect(chips.length).toBe(3);
      expect(chips.some(c => c.key === 'productType')).toBeTrue();
      expect(chips.some(c => c.key === 'effDate')).toBeTrue();
      expect(chips.some(c => c.key === 'termDate')).toBeTrue();
    });
  });

  describe('removeFilter', () => {


    it('should remove effective date filter', () => {
      const filters: CustomerPreferredTierFilterValue = {
        productType: 'WB',
        effDatePeriod: 'After',
        effDateFilter: '2024-01-01T12:00:00.000Z',
        termDatePeriod: null,
        termDateFilter: null
      };

      const result = CustomerPreferredTierFilterChipsUtils.removeFilter(filters, 'effDate');
      expect(result?.effDatePeriod).toBeNull();
      expect(result?.effDateFilter).toBeNull();
      expect(result?.productType).toBe('WB');
    });

  });

  describe('clearAllFilters', () => {
    it('should return null', () => {
      expect(CustomerPreferredTierFilterChipsUtils.clearAllFilters()).toBeNull();
    });
  });
});
