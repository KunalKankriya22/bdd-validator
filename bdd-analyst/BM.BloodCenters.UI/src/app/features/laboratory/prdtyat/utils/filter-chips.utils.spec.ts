import { FilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('FilterChipsUtils (PRDTYAT)', () => {
  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = FilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when all filter fields are null', () => {
      const filters = {
        anticoagulantCode: null,
        productType: null,
        attribute: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated filters', () => {
      const filters = {
        anticoagulantCode: 'AC01',
        productType: 'RBC',
        attribute: 'ATTR-A',
        effectiveDateFrom: '2025-01-15',
        effectiveDateTo: '2025-06-30',
        terminationDateFrom: '2025-07-01',
        terminationDateTo: '2025-12-31'
      } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(7);
      expect(result[0]).toEqual({ key: 'anticoagulantCode', label: 'Anticoagulant Code: AC01', value: 'AC01' });
      expect(result[1]).toEqual({ key: 'productType', label: 'Product Type: RBC', value: 'RBC' });
      expect(result[2]).toEqual({ key: 'attribute', label: 'Attribute: ATTR-A', value: 'ATTR-A' });
      expect(result[3].key).toBe('effectiveDateFrom');
      expect(result[3].label).toContain('Effective Date ≥');
      expect(result[4].key).toBe('effectiveDateTo');
      expect(result[4].label).toContain('Effective Date ≤');
      expect(result[5].key).toBe('terminationDateFrom');
      expect(result[5].label).toContain('Termination Date ≥');
      expect(result[6].key).toBe('terminationDateTo');
      expect(result[6].label).toContain('Termination Date ≤');
    });

    it('should create anticoagulantCode chip when set', () => {
      const filters = { anticoagulantCode: 'CPD' } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('anticoagulantCode');
      expect(result[0].label).toBe('Anticoagulant Code: CPD');
    });

    it('should create productType chip when set', () => {
      const filters = { productType: 'PLT' } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('productType');
      expect(result[0].label).toBe('Product Type: PLT');
    });

    it('should create attribute chip when set', () => {
      const filters = { attribute: 'ATTR-B' } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('attribute');
      expect(result[0].label).toBe('Attribute: ATTR-B');
    });

    it('should create effectiveDateFrom chip with >= symbol', () => {
      const filters = { effectiveDateFrom: '2025-03-15' } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('effectiveDateFrom');
      expect(result[0].label).toContain('≥');
    });

    it('should create effectiveDateTo chip with <= symbol', () => {
      const filters = { effectiveDateTo: '2025-06-30' } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('effectiveDateTo');
      expect(result[0].label).toContain('≤');
    });

    it('should create terminationDateFrom chip with >= symbol', () => {
      const filters = { terminationDateFrom: '2025-07-01' } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('terminationDateFrom');
      expect(result[0].label).toContain('Termination Date ≥');
    });

    it('should create terminationDateTo chip with <= symbol', () => {
      const filters = { terminationDateTo: '2025-12-31' } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('terminationDateTo');
      expect(result[0].label).toContain('Termination Date ≤');
    });

    it('should format dates as DD-MMM-YYYY', () => {
      const filters = { effectiveDateFrom: '2025-01-15' } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('15-JAN-2025');
    });

    it('should handle individual filter fields independently', () => {
      const filters = {
        anticoagulantCode: null,
        productType: 'RBC',
        attribute: null,
        effectiveDateFrom: '2025-01-01',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      } as any;

      const result = FilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('productType');
      expect(result[1].key).toBe('effectiveDateFrom');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = FilterChipsUtils.removeFilterByChipKey(null, 'anticoagulantCode');

      expect(result).toBeNull();
    });

    it('should clear anticoagulantCode', () => {
      const filters = { anticoagulantCode: 'AC01', productType: 'RBC' } as any;

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'anticoagulantCode');

      expect(result).not.toBeNull();
      expect(result!.anticoagulantCode).toBeNull();
      expect(result!.productType).toBe('RBC');
    });

    it('should clear productType', () => {
      const filters = { productType: 'RBC', attribute: 'A' } as any;

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'productType');

      expect(result).not.toBeNull();
      expect(result!.productType).toBeNull();
    });

    it('should clear attribute', () => {
      const filters = { attribute: 'A', productType: 'RBC' } as any;

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'attribute');

      expect(result).not.toBeNull();
      expect(result!.attribute).toBeNull();
    });

    it('should clear effectiveDateFrom', () => {
      const filters = { effectiveDateFrom: '2025-01-01', productType: 'RBC' } as any;

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDateFrom');

      expect(result).not.toBeNull();
      expect(result!.effectiveDateFrom).toBeNull();
    });

    it('should clear effectiveDateTo', () => {
      const filters = { effectiveDateTo: '2025-06-30', productType: 'RBC' } as any;

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDateTo');

      expect(result).not.toBeNull();
      expect(result!.effectiveDateTo).toBeNull();
    });

    it('should clear terminationDateFrom', () => {
      const filters = { terminationDateFrom: '2025-07-01', productType: 'RBC' } as any;

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'terminationDateFrom');

      expect(result).not.toBeNull();
      expect(result!.terminationDateFrom).toBeNull();
    });

    it('should clear terminationDateTo', () => {
      const filters = { terminationDateTo: '2025-12-31', productType: 'RBC' } as any;

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'terminationDateTo');

      expect(result).not.toBeNull();
      expect(result!.terminationDateTo).toBeNull();
    });

    it('should return null when removing the last active filter', () => {
      const filters = { productType: 'RBC' } as any;

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'productType');

      expect(result).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(FilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are null/falsy', () => {
      const filters = {
        anticoagulantCode: null,
        productType: null,
        attribute: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      } as any;

      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when anticoagulantCode is set', () => {
      expect(FilterChipsUtils.hasActiveFilters({ anticoagulantCode: 'AC01' } as any)).toBe(true);
    });

    it('should return true when productType is set', () => {
      expect(FilterChipsUtils.hasActiveFilters({ productType: 'RBC' } as any)).toBe(true);
    });

    it('should return true when attribute is set', () => {
      expect(FilterChipsUtils.hasActiveFilters({ attribute: 'A' } as any)).toBe(true);
    });

    it('should return true when effectiveDateFrom is set', () => {
      expect(FilterChipsUtils.hasActiveFilters({ effectiveDateFrom: '2025-01-01' } as any)).toBe(true);
    });

    it('should return true when effectiveDateTo is set', () => {
      expect(FilterChipsUtils.hasActiveFilters({ effectiveDateTo: '2025-06-30' } as any)).toBe(true);
    });

    it('should return true when terminationDateFrom is set', () => {
      expect(FilterChipsUtils.hasActiveFilters({ terminationDateFrom: '2025-07-01' } as any)).toBe(true);
    });

    it('should return true when terminationDateTo is set', () => {
      expect(FilterChipsUtils.hasActiveFilters({ terminationDateTo: '2025-12-31' } as any)).toBe(true);
    });
  });
});
