import { ValidFilterFilterChipsUtils } from './filter-chips.utils';
import { ValidFilterFilterValue } from '../models/valid-filters.model';

describe('ValidFilterFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert catalogNumber filter to chip', () => {
      const filters: ValidFilterFilterValue = { catalogNumber: 'PA0000003' };
      const result = ValidFilterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ key: 'catalogNumber', label: 'Catalog: PA0000003', value: 'PA0000003' });
    });

    it('should convert productType filter to chip', () => {
      const filters: ValidFilterFilterValue = { productType: 'RBC' };
      const result = ValidFilterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ key: 'productType', label: 'Product Type: RBC', value: 'RBC' });
    });

    it('should convert days filter to chip', () => {
      const filters: ValidFilterFilterValue = { days: 56 };
      const result = ValidFilterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ key: 'days', label: 'Days: 56', value: 56 });
    });

  });
  describe('hasActiveFilters', () => {

    it('should return false when filters is empty', () => {
      expect(ValidFilterFilterChipsUtils.hasActiveFilters({})).toBe(false);
    });

    it('should return true when catalogNumber filter exists', () => {
      expect(ValidFilterFilterChipsUtils.hasActiveFilters({ catalogNumber: 'PA0000003' })).toBe(true);
    });

    it('should return true when any filter exists', () => {
      expect(ValidFilterFilterChipsUtils.hasActiveFilters({ days: 56 })).toBe(true);
    });
  });
});
