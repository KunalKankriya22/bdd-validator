import { HlaAntigenFilterChipsUtils } from './filter-chips.utils';
import { HlaAntigenFilterValue } from '../models/hla-antigens.model';
import moment from 'moment';

describe('HlaAntigenFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = HlaAntigenFilterChipsUtils.convertFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when all filter fields are null', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create antigen chip when antigen is set', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: 'A01',
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('antigen');
      expect(chips[0].label).toBe('Antigen: A01');
      expect(chips[0].value).toBe('A01');
    });

    it('should create associated antigen chip when associatedAntigen is set', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: 'B07',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('associatedAntigen');
      expect(chips[0].label).toBe('Associated Antigen: B07');
      expect(chips[0].value).toBe('B07');
    });

    it('should create effective date chip with >= sign for After period', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-03-15'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('15-MAR-2025');
    });

    it('should create effective date chip with >= sign for On or After period', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: 'On or After',
        effectiveDate: moment('2025-03-15'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≥');
    });

    it('should create effective date chip with <= sign for Before period', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: moment('2025-06-20'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('20-JUN-2025');
    });

    it('should create effective date chip with <= sign for On or Before period', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: 'On or Before',
        effectiveDate: moment('2025-06-20'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should use period text as-is for unknown period values', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: 'Between',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Between');
    });

    it('should not create effective date chip when date is set but period is null', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: moment('2025-03-15'),
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create termination date chip when both date and period are set', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: moment('2025-12-31'),
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('31-DEC-2025');
    });

    it('should not create termination date chip when period is null', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: moment('2025-12-31'),
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create all chips when all filters are populated', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: 'A01',
        associatedAntigen: 'B07',
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: moment('2025-12-31'),
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(4);
      expect(chips[0].key).toBe('antigen');
      expect(chips[1].key).toBe('associatedAntigen');
      expect(chips[2].key).toBe('effectiveDate');
      expect(chips[3].key).toBe('terminationDate');
    });

    it('should handle string dates for effective date formatting', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-07-04' as any,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const chips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('04-JUL-2025');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = HlaAntigenFilterChipsUtils.removeFilterByChipKey(null, 'antigen');
      expect(result).toBeNull();
    });

    it('should remove antigen filter and return null when no other filters remain', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: 'A01',
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = HlaAntigenFilterChipsUtils.removeFilterByChipKey(filters, 'antigen');
      expect(result).toBeNull();
    });

    it('should remove antigen filter and preserve other active filters', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: 'A01',
        associatedAntigen: 'B07',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = HlaAntigenFilterChipsUtils.removeFilterByChipKey(filters, 'antigen');

      expect(result).not.toBeNull();
      expect(result!.antigen).toBeNull();
      expect(result!.associatedAntigen).toBe('B07');
    });

    it('should remove associatedAntigen filter', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: 'A01',
        associatedAntigen: 'B07',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = HlaAntigenFilterChipsUtils.removeFilterByChipKey(filters, 'associatedAntigen');

      expect(result).not.toBeNull();
      expect(result!.associatedAntigen).toBeNull();
      expect(result!.antigen).toBe('A01');
    });

    it('should remove effectiveDate filter and clear both date and period', () => {
      const effDate = moment('2025-01-01');
      const filters: HlaAntigenFilterValue = {
        antigen: 'A01',
        associatedAntigen: null,
        effectiveDatePeriod: 'After',
        effectiveDate: effDate,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = HlaAntigenFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectiveDatePeriod).toBeNull();
    });

    it('should remove terminationDate filter and clear both date and period', () => {
      const termDate = moment('2025-12-31');
      const filters: HlaAntigenFilterValue = {
        antigen: 'A01',
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: termDate,
      };

      const result = HlaAntigenFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationDatePeriod).toBeNull();
    });

    it('should not modify filters when unknown chip key is provided', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: 'A01',
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };

      const result = HlaAntigenFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.antigen).toBe('A01');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(HlaAntigenFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are null', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };
      expect(HlaAntigenFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when antigen is set', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: 'A01',
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };
      expect(HlaAntigenFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when associatedAntigen is set', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: 'B07',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };
      expect(HlaAntigenFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDate is set', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null,
      };
      expect(HlaAntigenFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when terminationDate is set', () => {
      const filters: HlaAntigenFilterValue = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: moment('2025-12-31'),
      };
      expect(HlaAntigenFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
