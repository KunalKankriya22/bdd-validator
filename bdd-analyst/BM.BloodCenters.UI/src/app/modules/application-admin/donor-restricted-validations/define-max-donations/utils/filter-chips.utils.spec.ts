import { DefineMaxDonationsFilterChipsUtils } from './filter-chips.utils';
import { DefineMaxDonationsFilterFormValue } from '../define-max-donations-filter-panel/define-max-donations-filter-panel';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('DefineMaxDonationsFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should convert donation type filter to chip', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: 'AL',
        effectiveDate: null,
        periodType1: null,
        terminationDate: null,
        periodType2: null
      };

      const chips = DefineMaxDonationsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('donationType');
      expect(chips[0].label).toBe('Donation Type: AL');
    });

    it('should convert effective date filter to chip with period', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: null,
        effectiveDate: new Date('2024-01-15'),
        periodType1: 'After',
        terminationDate: null,
        periodType2: null
      };

      const chips = DefineMaxDonationsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('≥');
    });

    it('should convert termination date filter to chip with period', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: null,
        effectiveDate: null,
        periodType1: null,
        terminationDate: new Date('2024-12-31'),
        periodType2: 'Before'
      };

      const chips = DefineMaxDonationsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≤');
    });


    it('should return empty array when no filters applied', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: null,
        effectiveDate: null,
        periodType1: null,
        terminationDate: null,
        periodType2: null
      };

      const chips = DefineMaxDonationsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });


    it('should handle effective date without period type', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: null,
        effectiveDate: new Date('2024-01-15'),
        periodType1: null,
        terminationDate: null,
        periodType2: null
      };

      const chips = DefineMaxDonationsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });

    it('should handle termination date without period type', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: null,
        effectiveDate: null,
        periodType1: null,
        terminationDate: new Date('2024-12-31'),
        periodType2: null
      };

      const chips = DefineMaxDonationsFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove effective date and period type', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: 'AL',
        effectiveDate: new Date('2024-01-15'),
        periodType1: 'After',
        terminationDate: null,
        periodType2: null
      };

      const updatedFilters = DefineMaxDonationsFilterChipsUtils.removeFilterByChipKey(
        filters,
        'effectiveDate'
      );

      expect(updatedFilters).not.toBeNull();
      expect(updatedFilters!.effectiveDate).toBeNull();
      expect(updatedFilters!.periodType1).toBeNull();
      expect(updatedFilters!.donationType).toBe('AL');
    });

    it('should remove termination date and period type', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: 'AL',
        effectiveDate: null,
        periodType1: null,
        terminationDate: new Date('2024-12-31'),
        periodType2: 'Before'
      };

      const updatedFilters = DefineMaxDonationsFilterChipsUtils.removeFilterByChipKey(
        filters,
        'terminationDate'
      );

      expect(updatedFilters).not.toBeNull();
      expect(updatedFilters!.terminationDate).toBeNull();
      expect(updatedFilters!.periodType2).toBeNull();
      expect(updatedFilters!.donationType).toBe('AL');
    });

    it('should not modify other filters when removing one', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: 'AL',
        effectiveDate: new Date('2024-01-01'),
        periodType1: 'After',
        terminationDate: new Date('2024-12-31'),
        periodType2: 'Before'
      };

      const updatedFilters = DefineMaxDonationsFilterChipsUtils.removeFilterByChipKey(
        filters,
        'donationType'
      );

      expect(updatedFilters).not.toBeNull();
      expect(updatedFilters!.donationType).toBeNull();
      expect(updatedFilters!.effectiveDate).toEqual(new Date('2024-01-01'));
      expect(updatedFilters!.periodType1).toBe('After');
      expect(updatedFilters!.terminationDate).toEqual(new Date('2024-12-31'));
      expect(updatedFilters!.periodType2).toBe('Before');
    });

  });

  describe('hasActiveFilters', () => {
    it('should return true when donation type filter is applied', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: 'AL',
        effectiveDate: null,
        periodType1: null,
        terminationDate: null,
        periodType2: null
      };

      expect(DefineMaxDonationsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effective date filter is applied', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: null,
        effectiveDate: new Date('2024-01-15'),
        periodType1: 'After',
        terminationDate: null,
        periodType2: null
      };

      expect(DefineMaxDonationsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termination date filter is applied', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: null,
        effectiveDate: null,
        periodType1: null,
        terminationDate: new Date('2024-12-31'),
        periodType2: 'Before'
      };

      expect(DefineMaxDonationsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when multiple filters are applied', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: 'AL',
        effectiveDate: new Date('2024-01-01'),
        periodType1: 'After',
        terminationDate: null,
        periodType2: null
      };

      expect(DefineMaxDonationsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });



    it('should return false when date is set but period type is missing', () => {
      const filters: DefineMaxDonationsFilterFormValue = {
        donationType: null,
        effectiveDate: new Date('2024-01-15'),
        periodType1: null,
        terminationDate: null,
        periodType2: null
      };

      expect(DefineMaxDonationsFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
