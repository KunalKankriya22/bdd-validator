import { DefineResourceMasterListFilterChipsUtils } from './filter-chips.utils';
import { DefineResourceMasterListFilterValue } from '../models/define-resource-master-list.model';

describe('DefineResourceMasterListFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert resourceCode filter to chip', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: 'STAFF',
        type: null,
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      const result = DefineResourceMasterListFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'resourceCode',
        label: 'Resource Code: STAFF',
        value: 'STAFF'
      });
    });

    it('should convert type filter to chip', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: 'COACH',
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      const result = DefineResourceMasterListFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'type',
        label: 'Type: COACH',
        value: 'COACH'
      });
    });

    it('should convert sequence filter to chip', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: 5,
        critical: null,
        showTermination: null,
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      const result = DefineResourceMasterListFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'sequence',
        label: 'Sequence: 5',
        value: 5
      });
    });


    it('should convert critical filter to chip', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: 'Yes',
        showTermination: null,
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      const result = DefineResourceMasterListFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'critical',
        label: 'Critical: Yes',
        value: 'Yes'
      });
    });

    it('should convert showTermination filter to chip', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: null,
        showTermination: 'Yes',
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      const result = DefineResourceMasterListFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'showTermination',
        label: 'Show Termination: Yes',
        value: 'Yes'
      });
    });

    it('should convert effectiveDate filter with period to chip', () => {
      const effectiveDate = new Date('2024-01-15');
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: effectiveDate,
        terminationDate: null,
        periodType1: 'On or After',
        periodType2: null
      };

      const result = DefineResourceMasterListFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date ≥');
      expect(result[0].value).toBe(effectiveDate);
    });

    it('should convert terminationDate filter with period to chip', () => {
      const terminationDate = new Date('2024-12-31');
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: null,
        terminationDate: terminationDate,
        periodType1: null,
        periodType2: 'On or Before'
      };

      const result = DefineResourceMasterListFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date ≤');
      expect(result[0].value).toBe(terminationDate);
    });

    it('should not create effectiveDate chip without periodType1', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: new Date('2024-01-15'),
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      const result = DefineResourceMasterListFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

  });
  describe('hasActiveFilters', () => {

    it('should return true when resourceCode is set', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: 'STAFF',
        type: null,
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      expect(DefineResourceMasterListFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when type is set', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: 'COACH',
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      expect(DefineResourceMasterListFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when sequence is 0', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: 0,
        critical: null,
        showTermination: null,
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      expect(DefineResourceMasterListFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when critical is set', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: 'Yes',
        showTermination: null,
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      expect(DefineResourceMasterListFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when showTermination is set', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: null,
        showTermination: 'Yes',
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      expect(DefineResourceMasterListFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDate and periodType1 are set', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        periodType1: 'On or After',
        periodType2: null
      };

      expect(DefineResourceMasterListFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when effectiveDate is set but periodType1 is not', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      expect(DefineResourceMasterListFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when terminationDate and periodType2 are set', () => {
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: null,
        terminationDate: new Date('2024-12-31'),
        periodType1: null,
        periodType2: 'On or Before'
      };

      expect(DefineResourceMasterListFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

  });
});
