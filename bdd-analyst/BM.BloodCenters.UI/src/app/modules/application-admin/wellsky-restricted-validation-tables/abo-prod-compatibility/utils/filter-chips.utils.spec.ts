import { ABOProdCompatibilityFilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

describe('ABOProdCompatibilityFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when all filter fields are null', () => {
      const filters = {
        inventoryProductType: null,
        effectiveDateAfter: null,
        effectiveDateBefore: null,
        terminationDateAfter: null,
        terminationDateBefore: null
      } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated filters', () => {
      const filters = {
        inventoryProductType: 'TYPE-A',
        effectiveDateAfter: '2025-01-15',
        effectiveDateBefore: '2025-06-30',
        terminationDateAfter: '2025-07-01',
        terminationDateBefore: '2025-12-31'
      } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ key: 'inventoryProductType', label: 'Inventory Product Type: TYPE-A', value: 'TYPE-A' });
      expect(result[1].key).toBe('effectiveDateAfter');
      expect(result[1].label).toContain('≥');
      expect(result[2].key).toBe('effectiveDateBefore');
      expect(result[2].label).toContain('≤');
      expect(result[3].key).toBe('terminationDateAfter');
      expect(result[3].label).toContain('≥');
      expect(result[4].key).toBe('terminationDateBefore');
      expect(result[4].label).toContain('≤');
    });

    it('should create inventoryProductType chip when set', () => {
      const filters = { inventoryProductType: 'RBC' } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('inventoryProductType');
      expect(result[0].label).toBe('Inventory Product Type: RBC');
    });

    it('should create effectiveDateAfter chip with >= symbol', () => {
      const filters = { effectiveDateAfter: '2025-03-15' } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('effectiveDateAfter');
      expect(result[0].label).toContain('Effective Date ≥');
      expect(result[0].label).toContain(moment('2025-03-15').format('DD-MMM-YYYY'));
    });

    it('should create effectiveDateBefore chip with <= symbol', () => {
      const filters = { effectiveDateBefore: '2025-06-30' } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('effectiveDateBefore');
      expect(result[0].label).toContain('Effective Date ≤');
    });

    it('should create terminationDateAfter chip with >= symbol', () => {
      const filters = { terminationDateAfter: '2025-07-01' } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('terminationDateAfter');
      expect(result[0].label).toContain('Termination Date ≥');
    });

    it('should create terminationDateBefore chip with <= symbol', () => {
      const filters = { terminationDateBefore: '2025-12-31' } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('terminationDateBefore');
      expect(result[0].label).toContain('Termination Date ≤');
    });

    it('should handle individual filters independently', () => {
      const filters = {
        inventoryProductType: null,
        effectiveDateAfter: '2025-01-01',
        effectiveDateBefore: null,
        terminationDateAfter: null,
        terminationDateBefore: '2025-12-31'
      } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('effectiveDateAfter');
      expect(result[1].key).toBe('terminationDateBefore');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = ABOProdCompatibilityFilterChipsUtils.removeFilterByChipKey(null, 'inventoryProductType');

      expect(result).toBeNull();
    });

    it('should clear inventoryProductType', () => {
      const filters = {
        inventoryProductType: 'TYPE-A',
        effectiveDateAfter: '2025-01-01'
      } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.removeFilterByChipKey(filters, 'inventoryProductType');

      expect(result).not.toBeNull();
      expect(result!.inventoryProductType).toBeNull();
      expect(result!.effectiveDateAfter).toBe('2025-01-01');
    });

    it('should clear effectiveDateAfter', () => {
      const filters = {
        effectiveDateAfter: '2025-01-01',
        inventoryProductType: 'A'
      } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDateAfter');

      expect(result).not.toBeNull();
      expect(result!.effectiveDateAfter).toBeNull();
    });

    it('should clear effectiveDateBefore', () => {
      const filters = {
        effectiveDateBefore: '2025-06-30',
        inventoryProductType: 'A'
      } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDateBefore');

      expect(result).not.toBeNull();
      expect(result!.effectiveDateBefore).toBeNull();
    });

    it('should clear terminationDateAfter', () => {
      const filters = {
        terminationDateAfter: '2025-07-01',
        inventoryProductType: 'A'
      } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDateAfter');

      expect(result).not.toBeNull();
      expect(result!.terminationDateAfter).toBeNull();
    });

    it('should clear terminationDateBefore', () => {
      const filters = {
        terminationDateBefore: '2025-12-31',
        inventoryProductType: 'A'
      } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDateBefore');

      expect(result).not.toBeNull();
      expect(result!.terminationDateBefore).toBeNull();
    });

    it('should return null when removing the last active filter', () => {
      const filters = { inventoryProductType: 'TYPE-A' } as any;

      const result = ABOProdCompatibilityFilterChipsUtils.removeFilterByChipKey(filters, 'inventoryProductType');

      expect(result).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(ABOProdCompatibilityFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are null/falsy', () => {
      const filters = {
        inventoryProductType: null,
        effectiveDateAfter: null,
        effectiveDateBefore: null,
        terminationDateAfter: null,
        terminationDateBefore: null
      } as any;

      expect(ABOProdCompatibilityFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when inventoryProductType is set', () => {
      const filters = { inventoryProductType: 'A' } as any;

      expect(ABOProdCompatibilityFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDateAfter is set', () => {
      const filters = { effectiveDateAfter: '2025-01-01' } as any;

      expect(ABOProdCompatibilityFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when terminationDateBefore is set', () => {
      const filters = { terminationDateBefore: '2025-12-31' } as any;

      expect(ABOProdCompatibilityFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
