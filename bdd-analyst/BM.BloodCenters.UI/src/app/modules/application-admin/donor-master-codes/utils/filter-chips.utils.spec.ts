import { DonorMasterCodesFilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('DonorMasterCodesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = DonorMasterCodesFilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when no date filters are set', () => {
      const filters = {} as any;

      const result = DonorMasterCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated date filters', () => {
      const effDate = new Date(2025, 0, 15);
      const termDate = new Date(2025, 5, 30);
      const filters = {
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: termDate,
        terminationDatePeriod: 'AFTER'
      } as any;

      const result = DonorMasterCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('≥');
      expect(result[0].label).toContain('15-JAN-2025');
      expect(result[0].removable).toBe(true);
      expect(result[1].key).toBe('terminationDate');
      expect(result[1].label).toContain('≥');
    });

    it('should use >= symbol for AFTER period', () => {
      const filters = {
        effectiveDate: new Date(2025, 2, 10),
        effectiveDatePeriod: 'AFTER'
      } as any;

      const result = DonorMasterCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('≥');
    });

    it('should use <= symbol for non-AFTER period (BEFORE)', () => {
      const filters = {
        effectiveDate: new Date(2025, 2, 10),
        effectiveDatePeriod: 'BEFORE'
      } as any;

      const result = DonorMasterCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('≤');
    });

    it('should not create chip when effectiveDate is set but effectiveDatePeriod is missing', () => {
      const filters = {
        effectiveDate: new Date(2025, 0, 1)
      } as any;

      const result = DonorMasterCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create chip when effectiveDatePeriod is set but effectiveDate is missing', () => {
      const filters = {
        effectiveDatePeriod: 'AFTER'
      } as any;

      const result = DonorMasterCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should format date as DD-MON-YYYY', () => {
      const filters = {
        terminationDate: new Date(2025, 11, 25),
        terminationDatePeriod: 'BEFORE'
      } as any;

      const result = DonorMasterCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('25-DEC-2025');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = DonorMasterCodesFilterChipsUtils.removeFilterByChipKey(null, 'effectiveDate');

      expect(result).toBeNull();
    });

    it('should clear effectiveDate and effectiveDatePeriod', () => {
      const filters = {
        effectiveDate: new Date(2025, 0, 1),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date(2025, 11, 31),
        terminationDatePeriod: 'BEFORE'
      } as any;

      const result = DonorMasterCodesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeUndefined();
      expect(result!.effectiveDatePeriod).toBeUndefined();
      expect(result!.terminationDate).toBeDefined();
    });

    it('should clear terminationDate and terminationDatePeriod', () => {
      const filters = {
        effectiveDate: new Date(2025, 0, 1),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date(2025, 11, 31),
        terminationDatePeriod: 'BEFORE'
      } as any;

      const result = DonorMasterCodesFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeUndefined();
      expect(result!.terminationDatePeriod).toBeUndefined();
    });

    it('should return null when removing the last active filter pair', () => {
      const filters = {
        effectiveDate: new Date(2025, 0, 1),
        effectiveDatePeriod: 'AFTER'
      } as any;

      const result = DonorMasterCodesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(DonorMasterCodesFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filter pairs are complete', () => {
      const filters = {
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      } as any;

      expect(DonorMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effectiveDate and period are both set', () => {
      const filters = {
        effectiveDate: new Date(2025, 0, 1),
        effectiveDatePeriod: 'AFTER'
      } as any;

      expect(DonorMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when terminationDate and period are both set', () => {
      const filters = {
        terminationDate: new Date(2025, 11, 31),
        terminationDatePeriod: 'BEFORE'
      } as any;

      expect(DonorMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only effectiveDate is set without period', () => {
      const filters = {
        effectiveDate: new Date(2025, 0, 1),
        effectiveDatePeriod: null
      } as any;

      expect(DonorMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
