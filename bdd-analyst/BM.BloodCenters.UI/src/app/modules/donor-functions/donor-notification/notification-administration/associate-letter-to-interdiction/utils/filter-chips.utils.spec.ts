import { AssociateLetterToInterdictionFilterChipsUtils } from './filter-chips.utils';
import { AssociateLetterToInterdictionFilterValue } from '../models/associate-letter-to-interdiction.model';

describe('AssociateLetterToInterdictionFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert interCode filter to chip', () => {
      const filters: AssociateLetterToInterdictionFilterValue = {
        interCode: 'D01',
        donationType: null,
        letterId: null
      };

      const result = AssociateLetterToInterdictionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'interCode',
        label: 'Interdiction Code: D01',
        value: 'D01'
      });
    });

    it('should convert donationType filter to chip', () => {
      const filters: AssociateLetterToInterdictionFilterValue = {
        interCode: null,
        donationType: 'WB',
        letterId: null
      };

      const result = AssociateLetterToInterdictionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'donationType',
        label: 'Donation Type: WB',
        value: 'WB'
      });
    });

    it('should convert letterId filter to chip', () => {
      const filters: AssociateLetterToInterdictionFilterValue = {
        interCode: null,
        donationType: null,
        letterId: 'LTR001'
      };

      const result = AssociateLetterToInterdictionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'letterId',
        label: 'Letter ID: LTR001',
        value: 'LTR001'
      });
    });


    it('should skip null filter values', () => {
      const filters: AssociateLetterToInterdictionFilterValue = {
        interCode: 'D01',
        donationType: null,
        letterId: 'LTR001'
      };

      const result = AssociateLetterToInterdictionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(2);
      expect(result.map(chip => chip.key)).toEqual(['interCode', 'letterId']);
    });
  });
  describe('hasActiveFilters', () => {

    it('should return true when interCode is set', () => {
      const filters: AssociateLetterToInterdictionFilterValue = {
        interCode: 'D01',
        donationType: null,
        letterId: null
      };

      expect(AssociateLetterToInterdictionFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when donationType is set', () => {
      const filters: AssociateLetterToInterdictionFilterValue = {
        interCode: null,
        donationType: 'WB',
        letterId: null
      };

      expect(AssociateLetterToInterdictionFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when letterId is set', () => {
      const filters: AssociateLetterToInterdictionFilterValue = {
        interCode: null,
        donationType: null,
        letterId: 'LTR001'
      };

      expect(AssociateLetterToInterdictionFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

  });
});
