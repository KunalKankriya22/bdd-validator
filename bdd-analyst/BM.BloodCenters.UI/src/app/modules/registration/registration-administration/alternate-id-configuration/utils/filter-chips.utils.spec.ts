import { AlternateIdFilterChipsUtils } from './filter-chips.utils';
import { AlternateIdSearchParams, ALTID_MATCH_TYPE_OPTIONS } from '../models/alternate-id.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

describe('AlternateIdFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when no filter fields are set', () => {
      const filters: AlternateIdSearchParams = {};

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated filters', () => {
      const effDate = new Date(2025, 0, 15);
      const termDate = new Date(2025, 5, 30);
      const filters: AlternateIdSearchParams = {
        keyDataGrade: '3',
        altidMatchType: 'SAME',
        finalGrade: '5',
        effDatePeriod: 'After',
        effDate: effDate,
        termDatePeriod: 'Before',
        termDate: termDate
      };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(5);
      expect(result[0].key).toBe('keyDataGrade');
      expect(result[0].label).toBe('Key Grade: 3');
      expect(result[1].key).toBe('altidMatchType');
      expect(result[1].label).toBe('Alternate ID Match: Same');
      expect(result[2].key).toBe('finalGrade');
      expect(result[2].label).toBe('Final Grade: 5');
      expect(result[3].key).toBe('effDate');
      expect(result[3].label).toContain('≥');
      expect(result[4].key).toBe('termDate');
      expect(result[4].label).toContain('≤');
    });

    it('should create keyDataGrade chip when set', () => {
      const filters: AlternateIdSearchParams = { keyDataGrade: '7' };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('keyDataGrade');
      expect(result[0].label).toBe('Key Grade: 7');
      expect(result[0].value).toBe('7');
    });

    it('should create altidMatchType chip with display label from ALTID_MATCH_TYPE_OPTIONS', () => {
      const filters: AlternateIdSearchParams = { altidMatchType: 'DIFF' };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('altidMatchType');
      expect(result[0].label).toBe('Alternate ID Match: Different');
    });

    it('should fall back to raw altidMatchType when not found in ALTID_MATCH_TYPE_OPTIONS', () => {
      const filters: AlternateIdSearchParams = { altidMatchType: 'UNKNOWN' };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Alternate ID Match: UNKNOWN');
    });

    it('should create altidMatchType chip with "Similar" label for SIMM', () => {
      const filters: AlternateIdSearchParams = { altidMatchType: 'SIMM' };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toBe('Alternate ID Match: Similar');
    });

    it('should create finalGrade chip when set', () => {
      const filters: AlternateIdSearchParams = { finalGrade: '9' };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('finalGrade');
      expect(result[0].label).toBe('Final Grade: 9');
    });

    it('should not create effDate chip when effDatePeriod is missing', () => {
      const filters: AlternateIdSearchParams = { effDate: new Date(2025, 0, 1) };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create effDate chip when effDate is missing', () => {
      const filters: AlternateIdSearchParams = { effDatePeriod: 'After' };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create termDate chip when termDatePeriod is missing', () => {
      const filters: AlternateIdSearchParams = { termDate: new Date(2025, 5, 1) };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create termDate chip when termDate is missing', () => {
      const filters: AlternateIdSearchParams = { termDatePeriod: 'Before' };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should use >= operator for "After" period', () => {
      const effDate = new Date(2025, 0, 15);
      const filters: AlternateIdSearchParams = {
        effDatePeriod: 'After',
        effDate: effDate
      };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
      expect(result[0].label).toContain(moment(effDate).format('DD-MMM-YYYY'));
    });

    it('should use <= operator for "Before" period', () => {
      const termDate = new Date(2025, 11, 31);
      const filters: AlternateIdSearchParams = {
        termDatePeriod: 'Before',
        termDate: termDate
      };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should format date using moment DD-MMM-YYYY format', () => {
      const effDate = new Date(2025, 11, 25);
      const filters: AlternateIdSearchParams = {
        effDatePeriod: 'After',
        effDate: effDate
      };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain(moment(effDate).format('DD-MMM-YYYY'));
    });
  });

  describe('periodToOperator (tested indirectly)', () => {
    it('should return >= for "after" (case-insensitive)', () => {
      const filters: AlternateIdSearchParams = {
        effDatePeriod: 'After',
        effDate: new Date(2025, 0, 1)
      };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
    });

    it('should return <= for "before" (case-insensitive)', () => {
      const filters: AlternateIdSearchParams = {
        termDatePeriod: 'Before',
        termDate: new Date(2025, 0, 1)
      };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should return = for unknown period values', () => {
      const filters: AlternateIdSearchParams = {
        effDatePeriod: 'exact' as any,
        effDate: new Date(2025, 0, 1)
      };

      const result = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('Effective Date =');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = AlternateIdFilterChipsUtils.removeFilterByChipKey(null, 'keyDataGrade');

      expect(result).toBeNull();
    });

    it('should remove keyDataGrade', () => {
      const filters: AlternateIdSearchParams = {
        keyDataGrade: '3',
        finalGrade: '5'
      };

      const result = AlternateIdFilterChipsUtils.removeFilterByChipKey(filters, 'keyDataGrade');

      expect(result).not.toBeNull();
      expect(result!.keyDataGrade).toBeUndefined();
      expect(result!.finalGrade).toBe('5');
    });

    it('should remove altidMatchType', () => {
      const filters: AlternateIdSearchParams = {
        altidMatchType: 'SAME',
        keyDataGrade: '1'
      };

      const result = AlternateIdFilterChipsUtils.removeFilterByChipKey(filters, 'altidMatchType');

      expect(result).not.toBeNull();
      expect(result!.altidMatchType).toBeUndefined();
    });

    it('should remove finalGrade', () => {
      const filters: AlternateIdSearchParams = {
        finalGrade: '5',
        keyDataGrade: '1'
      };

      const result = AlternateIdFilterChipsUtils.removeFilterByChipKey(filters, 'finalGrade');

      expect(result).not.toBeNull();
      expect(result!.finalGrade).toBeUndefined();
    });

    it('should remove effDate and effDatePeriod together', () => {
      const filters: AlternateIdSearchParams = {
        effDatePeriod: 'After',
        effDate: new Date(2025, 0, 1),
        keyDataGrade: '3'
      };

      const result = AlternateIdFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');

      expect(result).not.toBeNull();
      expect(result!.effDate).toBeUndefined();
      expect(result!.effDatePeriod).toBeUndefined();
    });

    it('should remove termDate and termDatePeriod together', () => {
      const filters: AlternateIdSearchParams = {
        termDatePeriod: 'Before',
        termDate: new Date(2025, 11, 31),
        keyDataGrade: '3'
      };

      const result = AlternateIdFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');

      expect(result).not.toBeNull();
      expect(result!.termDate).toBeUndefined();
      expect(result!.termDatePeriod).toBeUndefined();
    });

    it('should return null when removing the last active filter', () => {
      const filters: AlternateIdSearchParams = {
        keyDataGrade: '3'
      };

      const result = AlternateIdFilterChipsUtils.removeFilterByChipKey(filters, 'keyDataGrade');

      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: AlternateIdSearchParams = {
        keyDataGrade: '3',
        finalGrade: '5'
      };
      const original = { ...filters };

      AlternateIdFilterChipsUtils.removeFilterByChipKey(filters, 'keyDataGrade');

      expect(filters).toEqual(original);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(AlternateIdFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no fields are set', () => {
      expect(AlternateIdFilterChipsUtils.hasActiveFilters({})).toBe(false);
    });

    it('should return true when keyDataGrade is set', () => {
      expect(AlternateIdFilterChipsUtils.hasActiveFilters({ keyDataGrade: '1' })).toBe(true);
    });

    it('should return true when altidMatchType is set', () => {
      expect(AlternateIdFilterChipsUtils.hasActiveFilters({ altidMatchType: 'SAME' })).toBe(true);
    });

    it('should return true when finalGrade is set', () => {
      expect(AlternateIdFilterChipsUtils.hasActiveFilters({ finalGrade: '5' })).toBe(true);
    });

    it('should return true when effDate is set', () => {
      expect(AlternateIdFilterChipsUtils.hasActiveFilters({ effDate: new Date(2025, 0, 1) })).toBe(true);
    });

    it('should return true when termDate is set', () => {
      expect(AlternateIdFilterChipsUtils.hasActiveFilters({ termDate: new Date(2025, 11, 31) })).toBe(true);
    });
  });
});
