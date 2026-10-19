import { LabelingInterdictionOverrideFilterChipsUtils } from './filter-chips.utils';
import moment from 'moment';
import { LabelingInterdictionOverrideFilterValue } from '../models/labeling-interdiction-override.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('LabelingInterdictionOverrideFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array for filters with all null values', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create chip for donorDecisionCode', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: 'DDC001',
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('donorDecisionCode');
      expect(result[0].label).toBe('Cue: DDC001');
      expect(result[0].value).toBe('DDC001');
    });

    it('should create chip for interType with display mapping', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: 'N',
        interTypeDisplay: 'N - NFT',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('interType');
      expect(result[0].label).toBe('Type: N - NFT');
      expect(result[0].value).toBe('N');
    });

    it('should create chip for interType B as Bio', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: 'B',
        interTypeDisplay: 'B - Bio',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toBe('Type: B - Bio');
    });

    it('should create chip for interType H as Hold', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: 'H',
        interTypeDisplay: 'H - Hold',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toBe('Type: H - Hold');
    });

    it('should create chip for interType I as Initial', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: 'I',
        interTypeDisplay: 'I - Initial',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toBe('Type: I - Initial');
    });


    it('should create chip for effectiveDate with period', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: 'after',
        effectiveDate: moment('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe('Effective Date ≥ 15-JAN-2025');
    });

    it('should create chip for effectiveDate without period', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: moment('2025-06-20'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe('Effective Date = 20-JUN-2025');
    });

    it('should create chip for terminationDate with period', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: moment('2025-12-31')
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toBe('Termination Date ≤ 31-DEC-2025');
    });

    it('should create chip for terminationDate without period', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: moment('2025-03-10')
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toBe('Termination Date = 10-MAR-2025');
    });


    it('should create chips in correct order', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: 'DDC001',
        interType: 'B',
        effectiveDatePeriod: 'after',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: moment('2025-12-31')
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].key).toBe('donorDecisionCode');
      expect(result[1].key).toBe('interType');
      expect(result[2].key).toBe('effectiveDate');
      expect(result[3].key).toBe('terminationDate');
    });


    it('should handle date with toDate method (moment-like objects)', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: 'after',
        effectiveDate: moment('2025-07-04'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].label).toContain('04-JUL-2025');
    });
  });

  describe('removeFilterByChipKey', () => {



    it('should remove effectiveDate and effectiveDatePeriod filter', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: 'DDC001',
        interType: null,
        effectiveDatePeriod: 'after',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result?.donorDecisionCode).toBe('DDC001');
      expect(result?.effectiveDatePeriod).toBeNull();
      expect(result?.effectiveDate).toBeNull();
    });

    it('should remove terminationDate and terminationDatePeriod filter', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: moment('2025-12-31')
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result?.interType).toBe('N');
      expect(result?.terminationDatePeriod).toBeNull();
      expect(result?.terminationDate).toBeNull();
    });





    it('should return updated filters when some filters remain', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: 'DDC001',
        interType: 'N',
        effectiveDatePeriod: 'after',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: moment('2025-12-31')
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'donorDecisionCode');

      expect(result).not.toBeNull();
      expect(result?.donorDecisionCode).toBeNull();
      expect(result?.interType).toBe('N');
      expect(result?.effectiveDate).toBeTruthy();
      expect(result?.terminationDate).toBeTruthy();
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false for filters with all null values', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when donorDecisionCode has value', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: 'DDC001',
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when interType has value', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when effectiveDate has value', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when terminationDate has value', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: moment('2025-12-31')
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });


    it('should return true when some filters have values', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: 'DDC001',
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: moment('2025-12-31')
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

  });

  describe('Edge Cases', () => {
    it('should handle filters with undefined values gracefully', () => {
      const filters = {
        donorDecisionCode: undefined as any,
        interType: undefined as any,
        effectiveDatePeriod: undefined as any,
        effectiveDate: undefined as any,
        terminationDatePeriod: undefined as any,
        terminationDate: undefined as any
      };

      const result = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

  });

  describe('Integration Scenarios', () => {
    it('should work correctly in a typical filter -> chip -> remove flow', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: 'DDC001',
        interType: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: moment('2025-12-31')
      };

      // Convert to chips
      const chips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);

      // Remove one filter
      const updatedFilters = LabelingInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'donorDecisionCode');

      // Convert updated filters to chips
      const updatedChips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(updatedFilters);
      expect(updatedChips.length).toBe(2);
      expect(updatedChips.find(c => c.key === 'donorDecisionCode')).toBeUndefined();
    });

    it('should correctly identify when all filters are cleared', () => {
      let filters: LabelingInterdictionOverrideFilterValue | null = {
        donorDecisionCode: 'DDC001',
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      filters = LabelingInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'donorDecisionCode');

      expect(filters).toBeNull();
      expect(LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
