import { HlaInterimOutputFilterChipsUtils } from './filter-chips.utils';
import { HlaInterimOutputSearchParams } from '../models/hla-interim-output.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('HlaInterimOutputFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert matchA1A1 filter to chip', () => {
      const filters: HlaInterimOutputSearchParams = {
        matchA1A1: '01'
      };

      const result = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'matchA1A1',
        label: 'A1A1: 01',
        value: '01'
      });
    });

    it('should convert matchA1A2 filter to chip', () => {
      const filters: HlaInterimOutputSearchParams = {
        matchA1A2: '02'
      };

      const result = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('matchA1A2');
      expect(result[0].label).toBe('A1A2: 02');
    });

    it('should convert outcomeAntigenA1 filter to chip', () => {
      const filters: HlaInterimOutputSearchParams = {
        outcomeAntigenA1: '01'
      };

      const result = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('outcomeAntigenA1');
      expect(result[0].label).toBe('Outcome Antigen A1: 01');
    });

    it('should convert matchA2A1 filter to chip', () => {
      const filters: HlaInterimOutputSearchParams = {
        matchA2A1: '03'
      };

      const result = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('matchA2A1');
      expect(result[0].label).toBe('A2A1: 03');
    });

    it('should convert matchA2A2 filter to chip', () => {
      const filters: HlaInterimOutputSearchParams = {
        matchA2A2: '07'
      };

      const result = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('matchA2A2');
      expect(result[0].label).toBe('A2A2: 07');
    });

    it('should convert outcomeAntigenA2 filter to chip', () => {
      const filters: HlaInterimOutputSearchParams = {
        outcomeAntigenA2: '02'
      };

      const result = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('outcomeAntigenA2');
      expect(result[0].label).toBe('Outcome Antigen A2: 02');
    });


    it('should convert effective date filter to chip with After period', () => {
      const filters: HlaInterimOutputSearchParams = {
        effDate: '2024-01-01',
        effDatePeriod: 'After'
      };

      const result = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effDate');
      expect(result[0].label).toContain('Effective Date >');
    });

    it('should convert effective date filter to chip with Before period', () => {
      const filters: HlaInterimOutputSearchParams = {
        effDate: '2024-01-01',
        effDatePeriod: 'Before'
      };

      const result = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].label).toContain('Effective Date <');
    });

    it('should convert termination date filter to chip with After period', () => {
      const filters: HlaInterimOutputSearchParams = {
        termDate: '2024-12-31',
        termDatePeriod: 'After'
      };

      const result = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('termDate');
      expect(result[0].label).toContain('Termination Date >');
    });

    it('should not create chip for effective date without period', () => {
      const filters: HlaInterimOutputSearchParams = {
        effDate: '2024-01-01'
      };

      const result = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {







    it('should remove effective date and period when removing effDate', () => {
      const filters: HlaInterimOutputSearchParams = {
        effDate: '2024-01-01',
        effDatePeriod: 'After',
        matchA1A1: '01'
      };

      const result = HlaInterimOutputFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');

      expect(result?.effDate).toBeUndefined();
      expect(result?.effDatePeriod).toBeUndefined();
      expect(result?.matchA1A1).toBe('01');
    });

    it('should remove termination date and period when removing termDate', () => {
      const filters: HlaInterimOutputSearchParams = {
        termDate: '2024-12-31',
        termDatePeriod: 'Before',
        matchA1A1: '01'
      };

      const result = HlaInterimOutputFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');

      expect(result?.termDate).toBeUndefined();
      expect(result?.termDatePeriod).toBeUndefined();
      expect(result?.matchA1A1).toBe('01');
    });


  });

  describe('hasActiveFilters', () => {

    it('should return false when filters object is empty', () => {
      const filters: HlaInterimOutputSearchParams = {};
      const result = HlaInterimOutputFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when matchA1A1 filter exists', () => {
      const filters: HlaInterimOutputSearchParams = {
        matchA1A1: '01'
      };
      const result = HlaInterimOutputFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when any filter exists', () => {
      const filters: HlaInterimOutputSearchParams = {
        outcomeAntigenA2: '02'
      };
      const result = HlaInterimOutputFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when multiple filters exist', () => {
      const filters: HlaInterimOutputSearchParams = {
        matchA1A1: '01',
        matchA1A2: '02',
        effDate: '2024-01-01',
        effDatePeriod: 'After'
      };
      const result = HlaInterimOutputFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });
  });
});
