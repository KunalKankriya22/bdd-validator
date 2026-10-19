import { PrePrintedProductLabelFilterChipsUtils } from './filter-chips.utils';
import { PrePrintedProductLabelFilterValue } from '../models/pre-printed-product-labels.model';

describe('PrePrintedProductLabelFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array when no filters are active', () => {
      const filters: PrePrintedProductLabelFilterValue = {};
      expect(PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for catalogNumber', () => {
      const filters: PrePrintedProductLabelFilterValue = { catalogNumber: 'TEP540004' };
      const chips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('catalogNumber');
      expect(chips[0].label).toBe('Catalog Number: TEP540004');
      expect(chips[0].value).toBe('TEP540004');
    });

    it('should create chip for productType', () => {
      const filters: PrePrintedProductLabelFilterValue = { productType: 'RBC' };
      const chips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('productType');
      expect(chips[0].label).toBe('Product Type: RBC');
    });

    it('should create chip for bagCode', () => {
      const filters: PrePrintedProductLabelFilterValue = { bagCode: 'P53' };
      const chips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('bagCode');
      expect(chips[0].label).toBe('Bag Code: P53');
    });

    it('should create chip for faceLabel', () => {
      const filters: PrePrintedProductLabelFilterValue = { faceLabel: 'E0385000' };
      const chips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('faceLabel');
      expect(chips[0].label).toBe('Face Label: E0385000');
    });

    it('should create chip for effective date with AFTER period using >= symbol', () => {
      const filters: PrePrintedProductLabelFilterValue = {
        effDate: '2026-01-15T00:00:00',
        effDatePeriod: 'AFTER' as any
      };
      const chips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toContain('≥');
    });

    it('should create chip for effective date with BEFORE period using <= symbol', () => {
      const filters: PrePrintedProductLabelFilterValue = {
        effDate: '2026-01-15T00:00:00',
        effDatePeriod: 'BEFORE' as any
      };
      const chips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should not create effDate chip when period is missing', () => {
      const filters: PrePrintedProductLabelFilterValue = { effDate: '2026-01-15T00:00:00' };
      const chips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create effDate chip when date is missing', () => {
      const filters: PrePrintedProductLabelFilterValue = { effDatePeriod: 'AFTER' as any };
      const chips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create chip for termination date with AFTER period', () => {
      const filters: PrePrintedProductLabelFilterValue = {
        termDate: '2026-12-31T00:00:00',
        termDatePeriod: 'AFTER' as any
      };
      const chips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('≥');
    });

    it('should create multiple chips for multiple active filters', () => {
      const filters: PrePrintedProductLabelFilterValue = {
        catalogNumber: 'TEP540004',
        faceLabel: 'E0385000',
        effDate: '2026-01-01T00:00:00',
        effDatePeriod: 'AFTER' as any
      };
      const chips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(chips.map(c => c.key)).toEqual(['catalogNumber', 'faceLabel', 'effDate']);
    });
  });

  describe('removeFilterByChipKey', () => {





    it('should remove effDate and effDatePeriod together', () => {
      const filters: PrePrintedProductLabelFilterValue = {
        catalogNumber: 'TEP540004',
        effDate: '2026-01-01',
        effDatePeriod: 'after'
      };
      const result = PrePrintedProductLabelFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result?.effDate).toBeNull();
      expect(result?.effDatePeriod).toBeNull();
      expect(result?.catalogNumber).toBe('TEP540004');
    });

    it('should remove termDate and termDatePeriod together', () => {
      const filters: PrePrintedProductLabelFilterValue = {
        catalogNumber: 'TEP540004',
        termDate: '2026-12-31',
        termDatePeriod: 'before'
      };
      const result = PrePrintedProductLabelFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');
      expect(result?.termDate).toBeNull();
      expect(result?.termDatePeriod).toBeNull();
    });


    it('should not return null when other active filters remain', () => {
      const filters: PrePrintedProductLabelFilterValue = {
        catalogNumber: 'TEP540004',
        faceLabel: 'E0385000'
      };
      const result = PrePrintedProductLabelFilterChipsUtils.removeFilterByChipKey(filters, 'catalogNumber');
      expect(result).not.toBeNull();
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false when filters object is empty', () => {
      expect(PrePrintedProductLabelFilterChipsUtils.hasActiveFilters({})).toBeFalse();
    });

    it('should return true when catalogNumber is set', () => {
      expect(PrePrintedProductLabelFilterChipsUtils.hasActiveFilters({ catalogNumber: 'TEP540004' })).toBeTrue();
    });

    it('should return true when productType is set', () => {
      expect(PrePrintedProductLabelFilterChipsUtils.hasActiveFilters({ productType: 'RBC' })).toBeTrue();
    });

    it('should return true when bagCode is set', () => {
      expect(PrePrintedProductLabelFilterChipsUtils.hasActiveFilters({ bagCode: 'P53' })).toBeTrue();
    });

    it('should return true when faceLabel is set', () => {
      expect(PrePrintedProductLabelFilterChipsUtils.hasActiveFilters({ faceLabel: 'E0385000' })).toBeTrue();
    });

    it('should return true when effDate and effDatePeriod are both set', () => {
      expect(PrePrintedProductLabelFilterChipsUtils.hasActiveFilters({
        effDate: '2026-01-01',
        effDatePeriod: 'after'
      })).toBeTrue();
    });

    it('should return false when only effDate is set without period', () => {
      expect(PrePrintedProductLabelFilterChipsUtils.hasActiveFilters({
        effDate: '2026-01-01'
      })).toBeFalse();
    });

    it('should return true when termDate and termDatePeriod are both set', () => {
      expect(PrePrintedProductLabelFilterChipsUtils.hasActiveFilters({
        termDate: '2026-12-31',
        termDatePeriod: 'before'
      })).toBeTrue();
    });
  });
});
