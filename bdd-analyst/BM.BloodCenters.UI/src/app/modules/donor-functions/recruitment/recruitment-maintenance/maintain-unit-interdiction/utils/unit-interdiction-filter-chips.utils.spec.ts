import { UnitInterdictionFilterChipsUtils } from './unit-interdiction-filter-chips.utils';
import { UnitInterdictionFilterValue } from '../models/unit-interdiction.model';

describe('UnitInterdictionFilterChipsUtils', () => {
  describe('generateFilterChips', () => {
    it('should return empty array when filters is null', () => {
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when filters is undefined', () => {
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(undefined as any);
      expect(result).toEqual([]);
    });

    it('should generate chip for codes filter with correct label format', () => {
      const filters: UnitInterdictionFilterValue = { codes: ['HBVP', 'HCVP'] };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('codes');
      expect(result[0].label).toBe('Code: HBVP, HCVP');
      expect(result[0].value).toEqual(['HBVP', 'HCVP']);
    });

    it('should generate chip for single code', () => {
      const filters: UnitInterdictionFilterValue = { codes: ['HBVP'] };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].label).toBe('Code: HBVP');
    });

    it('should generate chip for types filter with correct label format', () => {
      const filters: UnitInterdictionFilterValue = { types: ['P', 'T'] };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('types');
      expect(result[0].label).toBe('Type: P, T');
      expect(result[0].value).toEqual(['P', 'T']);
    });

    it('should generate ONE chip for effective date range (not two separate chips)', () => {
      const filters: UnitInterdictionFilterValue = {
        effectiveDateFrom: '2024-01-01',
        effectiveDateTo: '2024-12-31'
      };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe('Effective Date: 2024-01-01 - 2024-12-31');
    });

    it('should generate effective date chip with only from date', () => {
      const filters: UnitInterdictionFilterValue = { effectiveDateFrom: '2024-01-01' };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe('Effective Date: 2024-01-01 - End');
    });

    it('should generate effective date chip with only to date', () => {
      const filters: UnitInterdictionFilterValue = { effectiveDateTo: '2024-12-31' };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe('Effective Date: Start - 2024-12-31');
    });

    it('should generate ONE chip for termination date range', () => {
      const filters: UnitInterdictionFilterValue = {
        terminationDateFrom: '2024-01-01',
        terminationDateTo: '2024-12-31'
      };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toBe('Termination Date: 2024-01-01 - 2024-12-31');
    });

    it('should generate chip for userIds filter', () => {
      const filters: UnitInterdictionFilterValue = { userIds: ['USER001', 'USER002'] };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('userIds');
      expect(result[0].label).toBe('User ID: USER001, USER002');
      expect(result[0].value).toEqual(['USER001', 'USER002']);
    });

    it('should generate chip for originated filter', () => {
      const filters: UnitInterdictionFilterValue = { originated: ['D', 'S'] };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('originated');
      expect(result[0].label).toBe('Originated: D, S');
    });

    it('should generate chip for reasons filter', () => {
      const filters: UnitInterdictionFilterValue = { reasons: ['ERR', 'MIS'] };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('reasons');
      expect(result[0].label).toBe('Reason: ERR, MIS');
    });

    it('should generate 3 chips for codes + effectiveDateRange + userIds', () => {
      const filters: UnitInterdictionFilterValue = {
        codes: ['HBVP'],
        effectiveDateFrom: '2024-01-01',
        userIds: ['USER001']
      };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(3);
    });

    it('should skip empty arrays for codes', () => {
      const filters: UnitInterdictionFilterValue = { codes: [], types: ['P'] };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('types');
    });

    it('should skip undefined date values', () => {
      const filters: UnitInterdictionFilterValue = {
        codes: ['HBVP'],
        effectiveDateFrom: undefined
      };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('codes');
    });

    it('should return empty array when all arrays are empty', () => {
      const filters: UnitInterdictionFilterValue = { codes: [], types: [], userIds: [] };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result).toEqual([]);
    });

    it('should handle single value in codes array', () => {
      const filters: UnitInterdictionFilterValue = { codes: ['HBVP'] };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result[0].value).toEqual(['HBVP']);
    });

    it('should join multiple codes with comma-space', () => {
      const filters: UnitInterdictionFilterValue = { codes: ['HBVP', 'HCVP', 'HIVM'] };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result[0].label).toBe('Code: HBVP, HCVP, HIVM');
    });

    it('should handle mixed empty and filled values', () => {
      const filters: UnitInterdictionFilterValue = {
        codes: [],
        types: ['P'],
        userIds: []
      };
      const result = UnitInterdictionFilterChipsUtils.generateFilterChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('types');
    });
  });

  describe('removeFilterChip', () => {
    it('should remove codes filter', () => {
      const filters: UnitInterdictionFilterValue = { codes: ['HBVP'], types: ['P'] };
      const chip = { key: 'codes', label: 'Code: HBVP', value: ['HBVP'] };
      const result = UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(result.codes).toBeUndefined();
      expect(result.types).toEqual(['P']);
    });

    it('should remove types filter', () => {
      const filters: UnitInterdictionFilterValue = { codes: ['HBVP'], types: ['P'] };
      const chip = { key: 'types', label: 'Type: P', value: ['P'] };
      const result = UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(result.types).toBeUndefined();
      expect(result.codes).toEqual(['HBVP']);
    });

    it('should remove both effectiveDateFrom and effectiveDateTo for effectiveDate chip', () => {
      const filters: UnitInterdictionFilterValue = {
        effectiveDateFrom: '2024-01-01',
        effectiveDateTo: '2024-12-31'
      };
      const chip = { key: 'effectiveDate', label: 'Effective Date: ...', value: {} };
      const result = UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(result.effectiveDateFrom).toBeUndefined();
      expect(result.effectiveDateTo).toBeUndefined();
    });

    it('should remove both terminationDateFrom and terminationDateTo for terminationDate chip', () => {
      const filters: UnitInterdictionFilterValue = {
        terminationDateFrom: '2024-01-01',
        terminationDateTo: '2024-12-31'
      };
      const chip = { key: 'terminationDate', label: 'Termination Date: ...', value: {} };
      const result = UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(result.terminationDateFrom).toBeUndefined();
      expect(result.terminationDateTo).toBeUndefined();
    });

    it('should remove userIds filter', () => {
      const filters: UnitInterdictionFilterValue = { userIds: ['USER001'], types: ['P'] };
      const chip = { key: 'userIds', label: 'User ID: USER001', value: ['USER001'] };
      const result = UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(result.userIds).toBeUndefined();
      expect(result.types).toEqual(['P']);
    });

    it('should remove originated filter', () => {
      const filters: UnitInterdictionFilterValue = { originated: ['D'], types: ['P'] };
      const chip = { key: 'originated', label: 'Originated: D', value: ['D'] };
      const result = UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(result.originated).toBeUndefined();
      expect(result.types).toEqual(['P']);
    });

    it('should remove reasons filter', () => {
      const filters: UnitInterdictionFilterValue = { reasons: ['ERR'], types: ['P'] };
      const chip = { key: 'reasons', label: 'Reason: ERR', value: ['ERR'] };
      const result = UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(result.reasons).toBeUndefined();
      expect(result.types).toEqual(['P']);
    });

    it('should not modify the original filters object', () => {
      const filters: UnitInterdictionFilterValue = { codes: ['HBVP'], types: ['P'] };
      const chip = { key: 'codes', label: 'Code: HBVP', value: ['HBVP'] };
      UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(filters.codes).toEqual(['HBVP']);
      expect(filters.types).toEqual(['P']);
    });

    it('should return object with remaining filters after removal', () => {
      const filters: UnitInterdictionFilterValue = { codes: ['HBVP'], types: ['P'] };
      const chip = { key: 'codes', label: 'Code: HBVP', value: ['HBVP'] };
      const result = UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(result).toBeDefined();
      expect(result.types).toEqual(['P']);
    });

    it('should handle unknown chip key without modifying filters', () => {
      const filters: UnitInterdictionFilterValue = { codes: ['HBVP'] };
      const chip = { key: 'unknownKey', label: 'Unknown', value: 'x' };
      const result = UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(result.codes).toEqual(['HBVP']);
    });

    it('should return empty object when last filter is removed', () => {
      const filters: UnitInterdictionFilterValue = { codes: ['HBVP'] };
      const chip = { key: 'codes', label: 'Code: HBVP', value: ['HBVP'] };
      const result = UnitInterdictionFilterChipsUtils.removeFilterChip(filters, chip as any);
      expect(result).toEqual({});
    });
  });
});
