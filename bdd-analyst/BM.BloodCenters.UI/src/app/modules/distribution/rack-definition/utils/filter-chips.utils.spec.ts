import { RackDefinitionFilterChipsUtils } from './filter-chips.utils';
import { RackDefinitionFilterValue } from '../models/rack-definition.model';

describe('RackDefinitionFilterChipsUtils', () => {
  const emptyFilters: RackDefinitionFilterValue = {
    rackNumber: null,
    productType: null,
    effectivePeriod: null,
    effectiveDate: null,
    terminationPeriod: null,
    terminationDate: null
  };

  describe('convertFiltersToChips', () => {
    it('should return empty array for all null values', () => {
      expect(RackDefinitionFilterChipsUtils.convertFiltersToChips(emptyFilters)).toEqual([]);
    });

    it('should create chip for rackNumber', () => {
      const filters = { ...emptyFilters, rackNumber: 'R001' };
      const result = RackDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('rackNumber');
      expect(result[0].label).toContain('R001');
    });

    it('should create chip for productType', () => {
      const filters = { ...emptyFilters, productType: 'RBC' };
      const result = RackDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('productType');
      expect(result[0].label).toContain('RBC');
    });

    it('should create chip for effectiveDate with After period', () => {
      const filters = { ...emptyFilters, effectivePeriod: 'After', effectiveDate: '2028-01-15' };
      const result = RackDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('≥');
    });

    it('should create chip for effectiveDate with Before period', () => {
      const filters = { ...emptyFilters, effectivePeriod: 'Before', effectiveDate: '2028-01-15' };
      const result = RackDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].label).toContain('≤');
    });

    it('should create chip for terminationDate with After period', () => {
      const filters = { ...emptyFilters, terminationPeriod: 'After', terminationDate: '2028-06-01' };
      const result = RackDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('≥');
    });

    it('should create chip for terminationDate with Before period', () => {
      const filters = { ...emptyFilters, terminationPeriod: 'Before', terminationDate: '2028-06-01' };
      const result = RackDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].label).toContain('≤');
    });

    it('should not create effectiveDate chip without period', () => {
      const filters = { ...emptyFilters, effectiveDate: '2028-01-15' };
      const result = RackDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

    it('should create multiple chips when multiple filters set', () => {
      const filters: RackDefinitionFilterValue = {
        rackNumber: 'A1',
        productType: 'PLT',
        effectivePeriod: 'After',
        effectiveDate: '2028-01-01',
        terminationPeriod: 'Before',
        terminationDate: '2028-12-31'
      };
      const result = RackDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(4);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should remove rackNumber and return null if last', () => {
      const filters = { ...emptyFilters, rackNumber: 'R001' };
      expect(RackDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'rackNumber')).toBeNull();
    });

    it('should remove productType and return null if last', () => {
      const filters = { ...emptyFilters, productType: 'RBC' };
      expect(RackDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'productType')).toBeNull();
    });

    it('should remove effectiveDate fields and return null if last', () => {
      const filters = { ...emptyFilters, effectivePeriod: 'After', effectiveDate: '2028-01-01' };
      expect(RackDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate')).toBeNull();
    });

    it('should remove terminationDate fields and return null if last', () => {
      const filters = { ...emptyFilters, terminationPeriod: 'Before', terminationDate: '2028-12-31' };
      expect(RackDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate')).toBeNull();
    });

    it('should return remaining filters when removing one of multiple', () => {
      const filters: RackDefinitionFilterValue = { ...emptyFilters, rackNumber: 'A1', productType: 'RBC' };
      const result = RackDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'rackNumber');
      expect(result).not.toBeNull();
      expect(result!.rackNumber).toBeNull();
      expect(result!.productType).toBe('RBC');
    });

    it('should handle unknown chipKey gracefully', () => {
      const filters = { ...emptyFilters, rackNumber: 'A1' };
      const result = RackDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'unknown');
      expect(result).not.toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false for all null values', () => {
      expect(RackDefinitionFilterChipsUtils.hasActiveFilters(emptyFilters)).toBe(false);
    });

    it('should return true when rackNumber has value', () => {
      expect(RackDefinitionFilterChipsUtils.hasActiveFilters({ ...emptyFilters, rackNumber: 'R001' })).toBe(true);
    });

    it('should return true when productType has value', () => {
      expect(RackDefinitionFilterChipsUtils.hasActiveFilters({ ...emptyFilters, productType: 'RBC' })).toBe(true);
    });

    it('should return true when effectiveDate has value', () => {
      expect(RackDefinitionFilterChipsUtils.hasActiveFilters({ ...emptyFilters, effectiveDate: '2028-01-01' })).toBe(true);
    });

    it('should return true when terminationDate has value', () => {
      expect(RackDefinitionFilterChipsUtils.hasActiveFilters({ ...emptyFilters, terminationDate: '2028-12-31' })).toBe(true);
    });
  });
});
