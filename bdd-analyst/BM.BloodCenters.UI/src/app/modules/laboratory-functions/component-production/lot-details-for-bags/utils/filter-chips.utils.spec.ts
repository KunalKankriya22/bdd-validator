import { LotFilterChipsUtils } from './filter-chips.utils';
import { ValidLotFilterValue } from '../models/lot-details-for-bags.model';
import moment from 'moment';

describe('LotFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should create chip for catalogNumber', () => {
      const filters: ValidLotFilterValue = { catalogNumber: 'CAT001' };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('catalogNumber');
      expect(chips[0].label).toBe('Catalog: CAT001');
    });

    it('should create chip for showExpired = true', () => {
      const filters: ValidLotFilterValue = { showExpired: true };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('showExpired');
      expect(chips[0].label).toBe('Show Expired: Yes');
    });

    it('should create chip for showExpired = false', () => {
      const filters: ValidLotFilterValue = { showExpired: false };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toBe('Show Expired: No');
    });

    it('should create multiple chips', () => {
      const filters: ValidLotFilterValue = { catalogNumber: 'CAT001', showExpired: true };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(2);
    });

    it('should return empty array when filters is null', () => {
      const chips = LotFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filter properties are set', () => {
      const chips = LotFilterChipsUtils.convertFiltersToChips({});
      expect(chips).toEqual([]);
    });

    it('should create chip for effDate with "after" period', () => {
      const testDate = '2024-06-15';
      const filters: ValidLotFilterValue = { effDate: testDate, effDatePeriod: 'after' };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      const formattedDate = moment(testDate).format('DD-MMM-YYYY').toUpperCase();
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toBe(`Effective Date ≥ ${formattedDate}`);
      expect(chips[0].value).toBe(testDate);
    });

    it('should create chip for effDate with "before" period', () => {
      const testDate = '2024-03-01';
      const filters: ValidLotFilterValue = { effDate: testDate, effDatePeriod: 'before' };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      const formattedDate = moment(testDate).format('DD-MMM-YYYY').toUpperCase();
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toBe(`Effective Date ≤ ${formattedDate}`);
    });

    it('should not create chip for effDate when effDatePeriod is missing', () => {
      const filters: ValidLotFilterValue = { effDate: '2024-06-15' };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip for effDatePeriod when effDate is missing', () => {
      const filters: ValidLotFilterValue = { effDatePeriod: 'after' };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create chip for termDate with "after" period', () => {
      const testDate = '2025-12-31';
      const filters: ValidLotFilterValue = { termDate: testDate, termDatePeriod: 'after' };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      const formattedDate = moment(testDate).format('DD-MMM-YYYY').toUpperCase();
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toBe(`Termination Date ≥ ${formattedDate}`);
      expect(chips[0].value).toBe(testDate);
    });

    it('should create chip for termDate with "before" period', () => {
      const testDate = '2025-01-15';
      const filters: ValidLotFilterValue = { termDate: testDate, termDatePeriod: 'before' };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      const formattedDate = moment(testDate).format('DD-MMM-YYYY').toUpperCase();
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toBe(`Termination Date ≤ ${formattedDate}`);
    });

    it('should not create chip for termDate when termDatePeriod is missing', () => {
      const filters: ValidLotFilterValue = { termDate: '2025-12-31' };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip for termDatePeriod when termDate is missing', () => {
      const filters: ValidLotFilterValue = { termDatePeriod: 'before' };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip when showExpired is undefined', () => {
      const filters: ValidLotFilterValue = { showExpired: undefined };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create all chips when all filters are provided', () => {
      const filters: ValidLotFilterValue = {
        catalogNumber: 'CAT999',
        showExpired: true,
        effDate: '2024-01-01',
        effDatePeriod: 'after',
        termDate: '2025-12-31',
        termDatePeriod: 'before',
      };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(4);
      expect(chips.map(c => c.key)).toEqual(['catalogNumber', 'showExpired', 'effDate', 'termDate']);
    });

    it('should set correct value property on catalogNumber chip', () => {
      const filters: ValidLotFilterValue = { catalogNumber: 'ABC123' };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].value).toBe('ABC123');
    });

    it('should set correct value property on showExpired chip', () => {
      const filters: ValidLotFilterValue = { showExpired: false };
      const chips = LotFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].value).toBe(false);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should return null when filters is null', () => {
      const result = LotFilterChipsUtils.removeFilterByChipKey(null, 'catalogNumber');
      expect(result).toBeNull();
    });

    it('should remove catalogNumber filter', () => {
      const filters: ValidLotFilterValue = { catalogNumber: 'CAT001', showExpired: true };
      const result = LotFilterChipsUtils.removeFilterByChipKey(filters, 'catalogNumber');
      expect(result).not.toBeNull();
      expect(result!.catalogNumber).toBeUndefined();
      expect(result!.showExpired).toBe(true);
    });

    it('should remove showExpired filter', () => {
      const filters: ValidLotFilterValue = { catalogNumber: 'CAT001', showExpired: true };
      const result = LotFilterChipsUtils.removeFilterByChipKey(filters, 'showExpired');
      expect(result).not.toBeNull();
      expect(result!.showExpired).toBeUndefined();
      expect(result!.catalogNumber).toBe('CAT001');
    });

    it('should remove effDate and effDatePeriod filters', () => {
      const filters: ValidLotFilterValue = {
        catalogNumber: 'CAT001',
        effDate: '2024-06-15',
        effDatePeriod: 'after',
      };
      const result = LotFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result).not.toBeNull();
      expect(result!.effDate).toBeUndefined();
      expect(result!.effDatePeriod).toBeUndefined();
      expect(result!.catalogNumber).toBe('CAT001');
    });

    it('should remove termDate and termDatePeriod filters', () => {
      const filters: ValidLotFilterValue = {
        catalogNumber: 'CAT001',
        termDate: '2025-12-31',
        termDatePeriod: 'before',
      };
      const result = LotFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');
      expect(result).not.toBeNull();
      expect(result!.termDate).toBeUndefined();
      expect(result!.termDatePeriod).toBeUndefined();
      expect(result!.catalogNumber).toBe('CAT001');
    });

    it('should return null when removing the only active filter', () => {
      const filters: ValidLotFilterValue = { catalogNumber: 'CAT001' };
      const result = LotFilterChipsUtils.removeFilterByChipKey(filters, 'catalogNumber');
      expect(result).toBeNull();
    });

    it('should return null when removing showExpired as the only active filter', () => {
      const filters: ValidLotFilterValue = { showExpired: false };
      const result = LotFilterChipsUtils.removeFilterByChipKey(filters, 'showExpired');
      expect(result).toBeNull();
    });

    it('should return null when removing effDate as the only active filter', () => {
      const filters: ValidLotFilterValue = { effDate: '2024-01-01', effDatePeriod: 'after' };
      const result = LotFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result).toBeNull();
    });

    it('should return null when removing termDate as the only active filter', () => {
      const filters: ValidLotFilterValue = { termDate: '2025-12-31', termDatePeriod: 'before' };
      const result = LotFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');
      expect(result).toBeNull();
    });

    it('should not modify original filters object', () => {
      const filters: ValidLotFilterValue = { catalogNumber: 'CAT001', showExpired: true };
      LotFilterChipsUtils.removeFilterByChipKey(filters, 'catalogNumber');
      expect(filters.catalogNumber).toBe('CAT001');
      expect(filters.showExpired).toBe(true);
    });

    it('should handle unknown chipKey without modifying filters', () => {
      const filters: ValidLotFilterValue = { catalogNumber: 'CAT001' };
      const result = LotFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');
      expect(result).not.toBeNull();
      expect(result!.catalogNumber).toBe('CAT001');
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false for empty object', () => {
      expect(LotFilterChipsUtils.hasActiveFilters({})).toBeFalse();
    });

    it('should return true for catalogNumber', () => {
      expect(LotFilterChipsUtils.hasActiveFilters({ catalogNumber: 'CAT001' })).toBeTrue();
    });

    it('should return true for showExpired', () => {
      expect(LotFilterChipsUtils.hasActiveFilters({ showExpired: false })).toBeTrue();
    });

    it('should return false for null filters', () => {
      expect(LotFilterChipsUtils.hasActiveFilters(null)).toBeFalse();
    });

    it('should return true for effDate', () => {
      expect(LotFilterChipsUtils.hasActiveFilters({ effDate: '2024-06-15' })).toBeTrue();
    });

    it('should return true for termDate', () => {
      expect(LotFilterChipsUtils.hasActiveFilters({ termDate: '2025-12-31' })).toBeTrue();
    });

    it('should return true for showExpired = true', () => {
      expect(LotFilterChipsUtils.hasActiveFilters({ showExpired: true })).toBeTrue();
    });

    it('should return false when all properties are undefined', () => {
      expect(LotFilterChipsUtils.hasActiveFilters({
        catalogNumber: undefined,
        showExpired: undefined,
        effDate: undefined,
        termDate: undefined,
      })).toBeFalse();
    });

    it('should return true when multiple filters are active', () => {
      expect(LotFilterChipsUtils.hasActiveFilters({
        catalogNumber: 'CAT001',
        showExpired: true,
        effDate: '2024-01-01',
        termDate: '2025-12-31',
      })).toBeTrue();
    });
  });
});
