import { AttributeServiceCodeFilterChipsUtils } from './filter-chips.utils';
import { AttributeServiceCodeFilterValue } from '../filter-dialog/attribute-service-code-filter-dialog';

describe('AttributeServiceCodeFilterChipsUtils', () => {
  describe('toFilterChips', () => {
    it('should return empty array when no filters are set', () => {
      const filters = {
        attributeGroup: null,
        price: null,
        serviceCode: null,
      } as unknown as AttributeServiceCodeFilterValue;
      expect(AttributeServiceCodeFilterChipsUtils.toFilterChips(filters)).toEqual([]);
    });

    it('should create chip for attributeGroup', () => {
      const filters = { attributeGroup: 'GRP1' } as AttributeServiceCodeFilterValue;
      const result = AttributeServiceCodeFilterChipsUtils.toFilterChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'attributeGroup',
        label: 'Attribute Group: GRP1',
        value: 'GRP1',
      });
    });

    it('should create chip for price', () => {
      const filters = { price: '100.00' } as AttributeServiceCodeFilterValue;
      const result = AttributeServiceCodeFilterChipsUtils.toFilterChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'price',
        label: 'Price: 100.00',
        value: '100.00',
      });
    });

    it('should create chip for serviceCode', () => {
      const filters = { serviceCode: 'SVC001' } as AttributeServiceCodeFilterValue;
      const result = AttributeServiceCodeFilterChipsUtils.toFilterChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'serviceCode',
        label: 'Service Code: SVC001',
        value: 'SVC001',
      });
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        attributeGroup: 'GRP1',
        price: '100.00',
        serviceCode: 'SVC001',
      } as AttributeServiceCodeFilterValue;
      const result = AttributeServiceCodeFilterChipsUtils.toFilterChips(filters);

      expect(result.length).toBe(3);
      expect(result.map(c => c.key)).toEqual(['attributeGroup', 'price', 'serviceCode']);
    });
  });

  describe('removeFilter', () => {
    it('should set attributeGroup to null when removing attributeGroup', () => {
      const filters = {
        attributeGroup: 'GRP1',
        price: '100.00',
        serviceCode: 'SVC001',
      } as AttributeServiceCodeFilterValue;
      const result = AttributeServiceCodeFilterChipsUtils.removeFilter(filters, 'attributeGroup');

      expect(result.attributeGroup).toBeNull();
      expect(result.price).toBe('100.00');
      expect(result.serviceCode).toBe('SVC001');
    });

    it('should set price to null when removing price', () => {
      const filters = {
        attributeGroup: 'GRP1',
        price: '100.00',
        serviceCode: null,
      } as unknown as AttributeServiceCodeFilterValue;
      const result = AttributeServiceCodeFilterChipsUtils.removeFilter(filters, 'price');

      expect(result.price).toBeNull();
      expect(result.attributeGroup).toBe('GRP1');
    });

    it('should set serviceCode to null when removing serviceCode', () => {
      const filters = { serviceCode: 'SVC001' } as AttributeServiceCodeFilterValue;
      const result = AttributeServiceCodeFilterChipsUtils.removeFilter(filters, 'serviceCode');

      expect(result.serviceCode).toBeNull();
    });

    it('should not mutate original filters', () => {
      const filters = { attributeGroup: 'GRP1' } as AttributeServiceCodeFilterValue;
      AttributeServiceCodeFilterChipsUtils.removeFilter(filters, 'attributeGroup');

      expect(filters.attributeGroup).toBe('GRP1');
    });
  });

  describe('clearAll', () => {
    it('should return object with all filter values set to null', () => {
      const result = AttributeServiceCodeFilterChipsUtils.clearAll();

      expect(result).toEqual({
        attributeGroup: null,
        price: null,
        serviceCode: null,
      });
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(AttributeServiceCodeFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters = {
        attributeGroup: null,
        price: null,
        serviceCode: null,
      } as unknown as AttributeServiceCodeFilterValue;
      expect(AttributeServiceCodeFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when attributeGroup is set', () => {
      const filters = { attributeGroup: 'GRP1' } as AttributeServiceCodeFilterValue;
      expect(AttributeServiceCodeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when price is set', () => {
      const filters = { price: '100.00' } as AttributeServiceCodeFilterValue;
      expect(AttributeServiceCodeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when serviceCode is set', () => {
      const filters = { serviceCode: 'SVC001' } as AttributeServiceCodeFilterValue;
      expect(AttributeServiceCodeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
