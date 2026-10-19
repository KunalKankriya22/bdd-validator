import { DonorInterdictionOverrideFilterChipsUtils } from './filter-chips.utils';
import { DonorInterdictionOverrideFilterValue } from '../models/donor-interdiction-override-query.model';

describe('DonorInterdictionOverrideFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert cue filter to chip', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: 'A',
        type: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'cue',
        label: 'Cue: A',
        value: 'A'
      });
    });

    it('should convert type filter to chip', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: null,
        type: 'H',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'type',
        label: 'Type: H',
        value: 'H'
      });
    });

    it('should convert effectiveDate with period to chip', () => {
      const effectiveDate = new Date('2025-01-15');
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: null,
        type: null,
        effectiveDatePeriod: 'After',
        effectiveDate: effectiveDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('≥');
    });

    it('should convert terminationDate with period to chip', () => {
      const terminationDate = new Date('2025-12-31');
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: null,
        type: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: terminationDate
      };

      const chips = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≤');
    });


    it('should not create chip for effectiveDate without date value', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: null,
        type: null,
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });

  });

  describe('removeFilterByChipKey', () => {



    it('should remove effectiveDate and effectiveDatePeriod filters', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: 'A',
        type: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result?.effectiveDate).toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
      expect(result?.cue).toBe('A');
    });

    it('should remove terminationDate and terminationDatePeriod filters', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: 'A',
        type: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result?.terminationDate).toBeNull();
      expect(result?.terminationDatePeriod).toBeNull();
      expect(result?.cue).toBe('A');
    });



  });

  describe('hasActiveFilters', () => {

    it('should return true when cue is set', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: 'A',
        type: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(DonorInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBeTruthy();
    });

    it('should return true when type is set', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: null,
        type: 'H',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(DonorInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBeTruthy();
    });




  });
});
