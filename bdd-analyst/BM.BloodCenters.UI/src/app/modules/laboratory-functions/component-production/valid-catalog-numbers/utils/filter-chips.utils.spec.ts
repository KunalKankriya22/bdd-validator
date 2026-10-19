import { CatalogFilterChipsUtils } from './filter-chips.utils';
import { ValidCatalogFilterValue } from '../models/valid-catalog-numbers.model';

describe('CatalogFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert catalog number filter to chip', () => {
      const filters: ValidCatalogFilterValue = { catalogNumber: 'TEST123' };
      const chips = CatalogFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('catalogNumber');
      expect(chips[0].label).toContain('TEST123');
    });

    it('should convert manufacturer filter to chip', () => {
      const filters: ValidCatalogFilterValue = { manufacturer: 'MFR001' };
      const chips = CatalogFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('manufacturer');
      expect(chips[0].label).toContain('MFR001');
    });

    it('should convert showTerminated filter to chip', () => {
      const filters: ValidCatalogFilterValue = { showTerminated: true };
      const chips = CatalogFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('showTerminated');
      expect(chips[0].label).toContain('Yes');
    });
  });
  describe('hasActiveFilters', () => {

    it('should return true when catalog number is set', () => {
      expect(CatalogFilterChipsUtils.hasActiveFilters({ catalogNumber: 'TEST' })).toBe(true);
    });

    it('should return true when manufacturer is set', () => {
      expect(CatalogFilterChipsUtils.hasActiveFilters({ manufacturer: 'MFR' })).toBe(true);
    });

  });
});
