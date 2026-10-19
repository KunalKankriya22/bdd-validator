import { BarCodeTranslationsFilterChipsUtils } from './filter-chips.utils';
import { BarCodeTranslationFilterValue } from '../models/bar-code-translations.model';

describe('BarCodeTranslationsFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array for all null values', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: null, eyeReadTrns: null,
        effDate: null, effDatePeriod: null,
        termDate: null, termDatePeriod: null
      };
      expect(BarCodeTranslationsFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for machineCode', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: '00', eyeReadTrns: null,
        effDate: null, effDatePeriod: null,
        termDate: null, termDatePeriod: null
      };
      const result = BarCodeTranslationsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('machineCode');
      expect(result[0].label).toBe('Machine Code: 00');
    });

    it('should create chip for eyeReadTrns', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: null, eyeReadTrns: ' C',
        effDate: null, effDatePeriod: null,
        termDate: null, termDatePeriod: null
      };
      const result = BarCodeTranslationsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('eyeReadTrns');
      expect(result[0].label).toContain('Eye Read Translation:');
    });

    it('should create chip for effDate with period', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: null, eyeReadTrns: null,
        effDate: '2025-11-01T00:00:00Z', effDatePeriod: 'AFTER',
        termDate: null, termDatePeriod: null
      };
      const result = BarCodeTranslationsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effDate');
      expect(result[0].label).toContain('Effective Date ≥');
    });

    it('should NOT create chip for effDate without period', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: null, eyeReadTrns: null,
        effDate: '2025-11-01T00:00:00Z', effDatePeriod: null,
        termDate: null, termDatePeriod: null
      };
      expect(BarCodeTranslationsFilterChipsUtils.convertFiltersToChips(filters).length).toBe(0);
    });

    it('should create chip for termDate with period', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: null, eyeReadTrns: null,
        effDate: null, effDatePeriod: null,
        termDate: '2025-12-31T00:00:00Z', termDatePeriod: 'BEFORE'
      };
      const result = BarCodeTranslationsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('termDate');
      expect(result[0].label).toContain('Termination Date ≤');
    });

    it('should create chips for all active filters', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: '01', eyeReadTrns: 'E2',
        effDate: '2025-11-01T00:00:00Z', effDatePeriod: 'AFTER',
        termDate: '2025-12-31T00:00:00Z', termDatePeriod: 'BEFORE'
      };
      const result = BarCodeTranslationsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(4);
    });
  });

  describe('removeFilterByChipKey', () => {


    it('should remove effDate and effDatePeriod together', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: '00', eyeReadTrns: null,
        effDate: '2025-11-01T00:00:00Z', effDatePeriod: 'AFTER',
        termDate: null, termDatePeriod: null
      };
      const result = BarCodeTranslationsFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result?.effDate).toBeNull();
      expect(result?.effDatePeriod).toBeNull();
      expect(result?.machineCode).toBe('00');
    });


    it('should not mutate original filters', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: '00', eyeReadTrns: 'C1',
        effDate: null, effDatePeriod: null,
        termDate: null, termDatePeriod: null
      };
      BarCodeTranslationsFilterChipsUtils.removeFilterByChipKey(filters, 'machineCode');
      expect(filters.machineCode).toBe('00');
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false for all null values', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: null, eyeReadTrns: null,
        effDate: null, effDatePeriod: null,
        termDate: null, termDatePeriod: null
      };
      expect(BarCodeTranslationsFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when machineCode has value', () => {
      const filters: BarCodeTranslationFilterValue = {
        machineCode: '00', eyeReadTrns: null,
        effDate: null, effDatePeriod: null,
        termDate: null, termDatePeriod: null
      };
      expect(BarCodeTranslationsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

  });
});
