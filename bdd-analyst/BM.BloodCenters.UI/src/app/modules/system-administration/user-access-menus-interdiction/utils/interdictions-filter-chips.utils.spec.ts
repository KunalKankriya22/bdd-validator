import { InterdictionsFilterChipsUtils } from './interdictions-filter-chips.utils';
import { InterdictionsFilterValue } from '../models/user-access-filters.model';

describe('InterdictionsFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert interdictionsType filter to chip', () => {
      const filters: InterdictionsFilterValue = {
        interdictionsType: 'DONOR',
        interdictionsCode: null
      };

      const result = InterdictionsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('interdictionsType');
      expect(result[0].label).toBe('Interdictions Type: DONOR');
      expect(result[0].value).toBe('DONOR');
    });

    it('should convert interdictionsCode filter to chip', () => {
      const filters: InterdictionsFilterValue = {
        interdictionsType: null,
        interdictionsCode: 'CODE123'
      };

      const result = InterdictionsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('interdictionsCode');
      expect(result[0].label).toBe('Interdictions Code: CODE123');
      expect(result[0].value).toBe('CODE123');
    });


    it('should return empty array when all filters are null', () => {
      const filters: InterdictionsFilterValue = {
        interdictionsType: null,
        interdictionsCode: null
      };

      const result = InterdictionsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove interdictionsType filter', () => {
      const filters: InterdictionsFilterValue = {
        interdictionsType: 'DONOR',
        interdictionsCode: 'CODE123'
      };

      const result = InterdictionsFilterChipsUtils.removeFilterByChipKey(filters, 'interdictionsType');

      expect(result).not.toBeNull();
      expect(result?.interdictionsType).toBeNull();
      expect(result?.interdictionsCode).toBe('CODE123');
    });

    it('should remove interdictionsCode filter', () => {
      const filters: InterdictionsFilterValue = {
        interdictionsType: 'DONOR',
        interdictionsCode: 'CODE123'
      };

      const result = InterdictionsFilterChipsUtils.removeFilterByChipKey(filters, 'interdictionsCode');

      expect(result).not.toBeNull();
      expect(result?.interdictionsCode).toBeNull();
      expect(result?.interdictionsType).toBe('DONOR');
    });




  });

  describe('hasActiveFilters', () => {


    it('should return true when interdictionsType is set', () => {
      const filters: InterdictionsFilterValue = {
        interdictionsType: 'DONOR',
        interdictionsCode: null
      };

      const result = InterdictionsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when interdictionsCode is set', () => {
      const filters: InterdictionsFilterValue = {
        interdictionsType: null,
        interdictionsCode: 'CODE123'
      };

      const result = InterdictionsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when both filters are set', () => {
      const filters: InterdictionsFilterValue = {
        interdictionsType: 'DONOR',
        interdictionsCode: 'CODE123'
      };

      const result = InterdictionsFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });
  });
});
