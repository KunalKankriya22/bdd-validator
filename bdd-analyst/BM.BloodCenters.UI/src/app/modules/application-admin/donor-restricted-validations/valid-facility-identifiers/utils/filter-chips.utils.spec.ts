import { ValidFacilityIdentifiersFilterChipsUtils } from './filter-chips.utils';
import { ValidFacilityIdentifiersFilterValue } from '../models/valid-facility-identifiers.model';

describe('ValidFacilityIdentifiersFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert chapter ID filter to chip', () => {
      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: 'AB12',
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const chips = ValidFacilityIdentifiersFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('chapterId');
      expect(chips[0].label).toBe('Chapter ID: AB12');
      expect(chips[0].value).toBe('AB12');
    });

    it('should convert effective date filter to chip with period', () => {
      const effectiveDate = new Date('2024-01-15');

      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: null,
        effectivePeriod: 'After',
        effectiveDate: effectiveDate,
        terminationPeriod: null,
        terminationDate: null
      };

      const chips = ValidFacilityIdentifiersFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('JAN');
      expect(chips[0].label).toContain('15');
      expect(chips[0].label).toContain('2024');
    });

    it('should convert termination date filter to chip with period', () => {
      const terminationDate = new Date('2024-12-31');

      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'Before',
        terminationDate: terminationDate
      };

      const chips = ValidFacilityIdentifiersFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≤');
      expect(chips[0].label).toContain('DEC');
      expect(chips[0].label).toContain('31');
      expect(chips[0].label).toContain('2024');
    });

    it('should convert all filters to chips', () => {
      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: 'AB12',
        effectivePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationPeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };

      const chips = ValidFacilityIdentifiersFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(3);
    });

    it('should not create date chip if period is missing', () => {
      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: null,
        effectivePeriod: null,
        effectiveDate: new Date('2024-01-15'),
        terminationPeriod: null,
        terminationDate: null
      };

      const chips = ValidFacilityIdentifiersFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });

    it('should not create date chip if date is missing', () => {
      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: null,
        effectivePeriod: 'After',
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const chips = ValidFacilityIdentifiersFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove chapter ID filter', () => {
      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: 'AB12',
        effectivePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ValidFacilityIdentifiersFilterChipsUtils.removeFilterByChipKey(filters, 'chapterId');

      expect(result).not.toBeNull();
      expect(result?.chapterId).toBeNull();
      expect(result?.effectiveDate).toEqual(new Date('2024-01-01'));
    });



  });

  describe('hasActiveFilters', () => {


    it('should return true when chapter ID is set', () => {
      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: 'AB12',
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      expect(ValidFacilityIdentifiersFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effective date and period are set', () => {
      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: null,
        effectivePeriod: 'After',
        effectiveDate: new Date('2024-01-15'),
        terminationPeriod: null,
        terminationDate: null
      };

      expect(ValidFacilityIdentifiersFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termination date and period are set', () => {
      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };

      expect(ValidFacilityIdentifiersFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when effective date is set but period is missing', () => {
      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: null,
        effectivePeriod: null,
        effectiveDate: new Date('2024-01-15'),
        terminationPeriod: null,
        terminationDate: null
      };

      expect(ValidFacilityIdentifiersFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when period is set but date is missing', () => {
      const filters: ValidFacilityIdentifiersFilterValue = {
        chapterId: null,
        effectivePeriod: 'After',
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      expect(ValidFacilityIdentifiersFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
