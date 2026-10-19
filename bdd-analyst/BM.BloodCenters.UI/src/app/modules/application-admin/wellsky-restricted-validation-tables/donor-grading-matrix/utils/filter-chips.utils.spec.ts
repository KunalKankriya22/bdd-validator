import { DonorGradingMatrixFilterChipsUtils } from './filter-chips.utils';
import { DonorGradingMatrixFilterValue } from '../models/donor-grading-matrix.model';

describe('DonorGradingMatrixFilterChipsUtils', () => {
  const emptyFilters: DonorGradingMatrixFilterValue = {
    firstnameMatch: null,
    lastnameMatch: null,
    dobMatch: null,
    genderMatch: null,
    grade: null
  };

  describe('convertFiltersToChips', () => {

    it('should return empty array for all null values', () => {
      expect(DonorGradingMatrixFilterChipsUtils.convertFiltersToChips(emptyFilters)).toEqual([]);
    });

    it('should create chip for firstnameMatch with display label', () => {
      const filters = { ...emptyFilters, firstnameMatch: 'SAME' };
      const result = DonorGradingMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('firstnameMatch');
      expect(result[0].label).toBe('First Name: Same');
    });

    it('should create chip for lastnameMatch', () => {
      const filters = { ...emptyFilters, lastnameMatch: 'DIFF' };
      const result = DonorGradingMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toBe('Last Name: Different');
    });

    it('should create chip for dobMatch', () => {
      const filters = { ...emptyFilters, dobMatch: 'SIMM' };
      const result = DonorGradingMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toBe('DOB: Similar');
    });

    it('should create chip for genderMatch with gender label', () => {
      const filters = { ...emptyFilters, genderMatch: 'M' };
      const result = DonorGradingMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toBe('Gender: Male');
    });

    it('should create chip for grade', () => {
      const filters = { ...emptyFilters, grade: 3 };
      const result = DonorGradingMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toBe('Grade: 3');
    });

    it('should create chips for all active filters', () => {
      const filters: DonorGradingMatrixFilterValue = {
        firstnameMatch: 'SAME',
        lastnameMatch: 'DIFF',
        dobMatch: 'SIMM',
        genderMatch: 'F',
        grade: 2
      };
      const result = DonorGradingMatrixFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(5);
    });
  });

  describe('removeFilterByChipKey', () => {


    it('should remove genderMatch but keep others', () => {
      const filters: DonorGradingMatrixFilterValue = { ...emptyFilters, genderMatch: 'M', grade: 2 };
      const result = DonorGradingMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'genderMatch');
      expect(result?.genderMatch).toBeNull();
      expect(result?.grade).toBe(2);
    });

    it('should not mutate original filters', () => {
      const filters = { ...emptyFilters, firstnameMatch: 'SAME', grade: 1 };
      DonorGradingMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'firstnameMatch');
      expect(filters.firstnameMatch).toBe('SAME');
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false for all null values', () => {
      expect(DonorGradingMatrixFilterChipsUtils.hasActiveFilters(emptyFilters)).toBe(false);
    });

    it('should return true when grade has value', () => {
      expect(DonorGradingMatrixFilterChipsUtils.hasActiveFilters({ ...emptyFilters, grade: 1 })).toBe(true);
    });

    it('should return true when any match field has value', () => {
      expect(DonorGradingMatrixFilterChipsUtils.hasActiveFilters({ ...emptyFilters, dobMatch: 'SAME' })).toBe(true);
    });
  });
});
