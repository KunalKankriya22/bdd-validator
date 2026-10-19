import { NotationCodeFilterChipsUtils } from './filter-chips.utils';
import { NotationCodeFilterValue } from '../models/notation-code.model';

describe('NotationCodeFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array when filters are empty object', () => {
      const filters: NotationCodeFilterValue = {};
      const result = NotationCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create chip for notation code filter', () => {
      const filters: NotationCodeFilterValue = {
        notationCode: 'TEST01'
      };
      const result = NotationCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'notationCode',
        label: 'Notation Code: TEST01',
        value: 'TEST01'
      });
    });

    it('should create chip for notation type filter', () => {
      const filters: NotationCodeFilterValue = {
        notationType: 'S'
      };
      const result = NotationCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'notationType',
        label: 'Type: S - Sample',
        value: 'S'
      });
    });



  });

  describe('removeFilterByChipKey', () => {




    it('should not modify filters when removing unknown key', () => {
      const filters: NotationCodeFilterValue = {
        notationCode: 'TEST01',
        notationType: 'S'
      };
      const result = NotationCodeFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');
      expect(result).toEqual(filters);
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false when filters are empty object', () => {
      const filters: NotationCodeFilterValue = {};
      const result = NotationCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when notation code filter is set', () => {
      const filters: NotationCodeFilterValue = {
        notationCode: 'TEST01'
      };
      const result = NotationCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when notation type filter is set', () => {
      const filters: NotationCodeFilterValue = {
        notationType: 'S'
      };
      const result = NotationCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when any filter is set', () => {
      const filters: NotationCodeFilterValue = {
        notationCode: 'TEST01',
        notationType: 'R'
      };
      const result = NotationCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });
  });
});
