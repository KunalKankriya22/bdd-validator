import { DonorInterdictionOverrideFilterChipsUtils } from './filter-chips.utils';
import { DonorInterdictionOverrideFilterValue } from '../models/donor-interdiction-override.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

describe('DonorInterdictionOverrideFilterChipsUtils', () => {
  const emptyFilters: DonorInterdictionOverrideFilterValue = {
    donorDecisionCode: null,
    donorDecisionCodeDisplay: null,
    interType: null,
    interTypeDisplay: null,
    effectiveDatePeriod: null,
    effectiveDate: null,
    terminationDatePeriod: null,
    terminationDate: null
  };

  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when all filter fields are null', () => {
      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(emptyFilters);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated filters', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'ABC',
        donorDecisionCodeDisplay: 'ABC - Description',
        interType: 'H',
        interTypeDisplay: 'H - Quarantine all products from donor',
        effectiveDatePeriod: 'after',
        effectiveDate: '2025-01-15',
        terminationDatePeriod: 'before',
        terminationDate: '2025-06-30'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(4);
      expect(result[0].key).toBe('donorDecisionCode');
      expect(result[1].key).toBe('interType');
      expect(result[2].key).toBe('effectiveDate');
      expect(result[3].key).toBe('terminationDate');
    });

    it('should use donorDecisionCodeDisplay when available', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        donorDecisionCode: 'ABC',
        donorDecisionCodeDisplay: 'ABC - Some Description'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Cue: ABC - Some Description');
      expect(result[0].value).toBe('ABC - Some Description');
    });

    it('should fall back to donorDecisionCode when display is not provided', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        donorDecisionCode: 'XYZ'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Cue: XYZ');
    });

    it('should use interTypeDisplay when available', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        interType: 'H',
        interTypeDisplay: 'H - Quarantine all products from donor'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Type: H - Quarantine all products from donor');
    });

    it('should fall back to getInterTypeDisplay when interTypeDisplay is not provided', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        interType: 'N'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('Type:');
      expect(result[0].label).toContain('N');
    });

    it('should use >= operator for "after" period on effectiveDate', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        effectiveDatePeriod: 'after',
        effectiveDate: '2025-03-15'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('≥');
      expect(result[0].label).toContain(moment('2025-03-15').format('DD-MMM-YYYY').toUpperCase());
    });

    it('should use <= operator for "before" period on terminationDate', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        terminationDatePeriod: 'before',
        terminationDate: '2025-12-31'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('≤');
    });

    it('should use = operator when effectiveDatePeriod is null', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        effectiveDatePeriod: null,
        effectiveDate: '2025-06-15'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('= ');
    });

    it('should use the period string as-is when it is not in PERIOD_DISPLAY_MAP', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        effectiveDatePeriod: 'exact',
        effectiveDate: '2025-06-15'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('exact');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = DonorInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(null, 'donorDecisionCode');

      expect(result).toBeNull();
    });

    it('should clear donorDecisionCode and its display', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        donorDecisionCode: 'ABC',
        donorDecisionCodeDisplay: 'ABC - Desc',
        interType: 'H',
        interTypeDisplay: 'H - Desc'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'donorDecisionCode');

      expect(result).not.toBeNull();
      expect(result!.donorDecisionCode).toBeNull();
      expect(result!.donorDecisionCodeDisplay).toBeNull();
      expect(result!.interType).toBe('H');
    });

    it('should clear interType and its display', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        interType: 'H',
        interTypeDisplay: 'H - Desc',
        donorDecisionCode: 'XYZ'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'interType');

      expect(result).not.toBeNull();
      expect(result!.interType).toBeNull();
      expect(result!.interTypeDisplay).toBeNull();
    });

    it('should clear effectiveDate and effectiveDatePeriod', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        effectiveDatePeriod: 'after',
        effectiveDate: '2025-01-01',
        donorDecisionCode: 'ABC'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectiveDatePeriod).toBeNull();
    });

    it('should clear terminationDate and terminationDatePeriod', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        terminationDatePeriod: 'before',
        terminationDate: '2025-12-31',
        interType: 'N'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationDatePeriod).toBeNull();
    });

    it('should return null when all filters are cleared', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        ...emptyFilters,
        donorDecisionCode: 'ABC'
      };

      const result = DonorInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'donorDecisionCode');

      expect(result).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(DonorInterdictionOverrideFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all filter fields are null', () => {
      expect(DonorInterdictionOverrideFilterChipsUtils.hasActiveFilters(emptyFilters)).toBe(false);
    });

    it('should return true when donorDecisionCode is set', () => {
      const filters = { ...emptyFilters, donorDecisionCode: 'ABC' };

      expect(DonorInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when interType is set', () => {
      const filters = { ...emptyFilters, interType: 'H' };

      expect(DonorInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDate is set', () => {
      const filters = { ...emptyFilters, effectiveDate: '2025-01-01' };

      expect(DonorInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when terminationDate is set', () => {
      const filters = { ...emptyFilters, terminationDate: '2025-12-31' };

      expect(DonorInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
