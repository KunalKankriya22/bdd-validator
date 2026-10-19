import { ProductStorageFilterChipsUtils } from './filter-chips.utils';
import { ProductStorageFilterValue } from '../models/product-storage-definition.model';

const emptyFilters = (): ProductStorageFilterValue => ({
  productType: null,
  warehouseCode: null,
  deviceType: null,
  effectivePeriod: null,
  effectiveDate: null,
  terminationPeriod: null,
  terminationDate: null
});

describe('ProductStorageFilterChipsUtils', () => {

  // ─── convertFiltersToChips ──────────────────────────────────────────────────

  describe('convertFiltersToChips', () => {
    it('should return empty array for null filters', () => {
      expect(ProductStorageFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when no values set', () => {
      expect(ProductStorageFilterChipsUtils.convertFiltersToChips(emptyFilters())).toEqual([]);
    });

    it('should create productType chip', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({ ...emptyFilters(), productType: 'RBC' });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('productType');
      expect(chips[0].label).toBe('Product Type: RBC');
      expect(chips[0].value).toBe('RBC');
    });

    it('should create warehouseCode chip', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({ ...emptyFilters(), warehouseCode: 'A' });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('warehouseCode');
      expect(chips[0].label).toBe('Warehouse: A');
    });

    it('should create deviceType chip', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({ ...emptyFilters(), deviceType: 'F' });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('deviceType');
      expect(chips[0].label).toBe('Device Type: F');
    });

    it('should create effectiveDate chip with ≥ symbol for After period', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({
        ...emptyFilters(), effectiveDate: '2026-01-15', effectivePeriod: 'After'
      });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('15-JAN-2026');
    });

    it('should create effectiveDate chip with ≤ symbol for Before period', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({
        ...emptyFilters(), effectiveDate: '2026-06-30', effectivePeriod: 'Before'
      });
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('30-JUN-2026');
    });

    it('should not create effectiveDate chip when period is missing', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({
        ...emptyFilters(), effectiveDate: '2026-01-15', effectivePeriod: null
      });
      expect(chips.length).toBe(0);
    });

    it('should not create effectiveDate chip when effectiveDate is null', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({
        ...emptyFilters(), effectiveDate: null, effectivePeriod: 'After'
      });
      expect(chips.length).toBe(0);
    });

    it('should create terminationDate chip with ≥ for After', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({
        ...emptyFilters(), terminationDate: '2026-12-31', terminationPeriod: 'After'
      });
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('31-DEC-2026');
    });

    it('should create terminationDate chip with ≤ for Before', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({
        ...emptyFilters(), terminationDate: '2026-03-01', terminationPeriod: 'Before'
      });
      expect(chips[0].label).toContain('≤');
    });

    it('should not create terminationDate chip when period is missing', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({
        ...emptyFilters(), terminationDate: '2026-12-31', terminationPeriod: null
      });
      expect(chips.length).toBe(0);
    });

    it('should create all chips when all filters are set', () => {
      const chips = ProductStorageFilterChipsUtils.convertFiltersToChips({
        productType: 'RBC',
        warehouseCode: 'A',
        deviceType: 'F',
        effectiveDate: '2026-01-01',
        effectivePeriod: 'After',
        terminationDate: '2026-12-31',
        terminationPeriod: 'Before'
      });
      expect(chips.length).toBe(5);
    });
  });

  // ─── removeFilterByChipKey ──────────────────────────────────────────────────

  describe('removeFilterByChipKey', () => {
    it('should return null when filters are null', () => {
      expect(ProductStorageFilterChipsUtils.removeFilterByChipKey(null, 'productType')).toBeNull();
    });

    it('should remove productType and return null when no other filters remain', () => {
      const result = ProductStorageFilterChipsUtils.removeFilterByChipKey(
        { ...emptyFilters(), productType: 'RBC' }, 'productType'
      );
      expect(result).toBeNull();
    });

    it('should remove productType but keep other filters', () => {
      const result = ProductStorageFilterChipsUtils.removeFilterByChipKey(
        { ...emptyFilters(), productType: 'RBC', warehouseCode: 'A' }, 'productType'
      );
      expect(result).not.toBeNull();
      expect(result!.productType).toBeNull();
      expect(result!.warehouseCode).toBe('A');
    });

    it('should remove warehouseCode', () => {
      const result = ProductStorageFilterChipsUtils.removeFilterByChipKey(
        { ...emptyFilters(), warehouseCode: 'A', deviceType: 'F' }, 'warehouseCode'
      );
      expect(result!.warehouseCode).toBeNull();
      expect(result!.deviceType).toBe('F');
    });

    it('should remove deviceType', () => {
      const result = ProductStorageFilterChipsUtils.removeFilterByChipKey(
        { ...emptyFilters(), productType: 'RBC', deviceType: 'F' }, 'deviceType'
      );
      expect(result!.deviceType).toBeNull();
    });

    it('should clear effectiveDate and effectivePeriod together', () => {
      const result = ProductStorageFilterChipsUtils.removeFilterByChipKey(
        { ...emptyFilters(), productType: 'RBC', effectiveDate: '2026-01-01', effectivePeriod: 'After' },
        'effectiveDate'
      );
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectivePeriod).toBeNull();
    });

    it('should clear terminationDate and terminationPeriod together', () => {
      const result = ProductStorageFilterChipsUtils.removeFilterByChipKey(
        { ...emptyFilters(), productType: 'RBC', terminationDate: '2026-12-31', terminationPeriod: 'Before' },
        'terminationDate'
      );
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationPeriod).toBeNull();
    });

    it('should return null when last filter is removed', () => {
      const result = ProductStorageFilterChipsUtils.removeFilterByChipKey(
        { ...emptyFilters(), deviceType: 'F' }, 'deviceType'
      );
      expect(result).toBeNull();
    });
  });

  // ─── hasActiveFilters ───────────────────────────────────────────────────────

  describe('hasActiveFilters', () => {
    it('should return false for null', () => {
      expect(ProductStorageFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are null', () => {
      expect(ProductStorageFilterChipsUtils.hasActiveFilters(emptyFilters())).toBe(false);
    });

    it('should return true when productType is set', () => {
      expect(ProductStorageFilterChipsUtils.hasActiveFilters({ ...emptyFilters(), productType: 'RBC' })).toBe(true);
    });

    it('should return true when warehouseCode is set', () => {
      expect(ProductStorageFilterChipsUtils.hasActiveFilters({ ...emptyFilters(), warehouseCode: 'A' })).toBe(true);
    });

    it('should return true when deviceType is set', () => {
      expect(ProductStorageFilterChipsUtils.hasActiveFilters({ ...emptyFilters(), deviceType: 'F' })).toBe(true);
    });

    it('should return true when effectiveDate is set', () => {
      expect(ProductStorageFilterChipsUtils.hasActiveFilters({ ...emptyFilters(), effectiveDate: '2026-01-01' })).toBe(true);
    });

    it('should return true when terminationDate is set', () => {
      expect(ProductStorageFilterChipsUtils.hasActiveFilters({ ...emptyFilters(), terminationDate: '2026-12-31' })).toBe(true);
    });
  });
});
