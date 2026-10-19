import { CityStateZipFilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('CityStateZipFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = CityStateZipFilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when no filter fields are set', () => {
      const result = CityStateZipFilterChipsUtils.convertFiltersToChips({} as any);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated fields', () => {
      const filters = {
        city: 'Denver',
        zip: '80202',
        county: 'Denver County',
        state: 'CO'
      };

      const result = CityStateZipFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ key: 'city', label: 'City: Denver', value: 'Denver' });
      expect(result[1]).toEqual({ key: 'zip', label: 'Zip Code: 80202', value: '80202' });
      expect(result[2]).toEqual({ key: 'county', label: 'County: Denver County', value: 'Denver County' });
      expect(result[3]).toEqual({ key: 'state', label: 'State: CO', value: 'CO' });
    });

    it('should return only city chip when only city is populated', () => {
      const filters = { city: 'Austin' } as any;

      const result = CityStateZipFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('city');
      expect(result[0].label).toBe('City: Austin');
    });

    it('should return only zip chip when only zip is populated', () => {
      const filters = { zip: '90210' } as any;

      const result = CityStateZipFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('zip');
      expect(result[0].label).toBe('Zip Code: 90210');
    });

    it('should return only county chip when only county is populated', () => {
      const filters = { county: 'Harris' } as any;

      const result = CityStateZipFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('county');
    });

    it('should return only state chip when only state is populated', () => {
      const filters = { state: 'TX' } as any;

      const result = CityStateZipFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('state');
      expect(result[0].label).toBe('State: TX');
    });

    it('should skip fields that are empty strings', () => {
      const filters = { city: '', zip: '12345', county: '', state: '' } as any;

      const result = CityStateZipFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('zip');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = CityStateZipFilterChipsUtils.removeFilterByChipKey(null, 'city');

      expect(result).toBeNull();
    });

    it('should remove the city filter and return remaining filters', () => {
      const filters = { city: 'Denver', state: 'CO' };

      const result = CityStateZipFilterChipsUtils.removeFilterByChipKey(filters, 'city');

      expect(result).not.toBeNull();
      expect(result!.city).toBeUndefined();
      expect(result!.state).toBe('CO');
    });

    it('should remove the zip filter', () => {
      const filters = { zip: '80202', state: 'CO' };

      const result = CityStateZipFilterChipsUtils.removeFilterByChipKey(filters, 'zip');

      expect(result).not.toBeNull();
      expect(result!.zip).toBeUndefined();
    });

    it('should remove the county filter', () => {
      const filters = { county: 'Denver County', state: 'CO' };

      const result = CityStateZipFilterChipsUtils.removeFilterByChipKey(filters, 'county');

      expect(result).not.toBeNull();
      expect(result!.county).toBeUndefined();
    });

    it('should remove the state filter', () => {
      const filters = { state: 'CO', city: 'Denver' };

      const result = CityStateZipFilterChipsUtils.removeFilterByChipKey(filters, 'state');

      expect(result).not.toBeNull();
      expect(result!.state).toBeUndefined();
    });

    it('should return null when removing the last active filter', () => {
      const filters = { city: 'Denver' };

      const result = CityStateZipFilterChipsUtils.removeFilterByChipKey(filters, 'city');

      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters = { city: 'Denver', state: 'CO' };
      const original = { ...filters };

      CityStateZipFilterChipsUtils.removeFilterByChipKey(filters, 'city');

      expect(filters).toEqual(original);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(CityStateZipFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all values are null or empty', () => {
      const filters = { city: null, zip: '', county: null, state: '' } as any;

      expect(CityStateZipFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when at least one filter has a value', () => {
      const filters = { city: 'Denver' } as any;

      expect(CityStateZipFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when multiple filters have values', () => {
      const filters = { city: 'Denver', state: 'CO' };

      expect(CityStateZipFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
