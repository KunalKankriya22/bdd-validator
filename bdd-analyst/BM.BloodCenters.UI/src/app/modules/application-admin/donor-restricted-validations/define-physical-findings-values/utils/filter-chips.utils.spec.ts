import {
  DefinePhysicalFindingsValuesFilterChipsUtils,
  DefinePhysicalFindingsValuesFilterFormValue
} from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('DefinePhysicalFindingsValuesFilterChipsUtils', () => {
  const emptyFilters: DefinePhysicalFindingsValuesFilterFormValue = {
    operator: null,
    interdiction: null,
    manualAuditFindingsFlag: null,
    equipmentType: null,
    effectiveDate: null,
    periodType: null,
    terminationDate: null,
    terminationPeriodType: null
  };

  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when all filter fields are null', () => {
      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(emptyFilters);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated filters', () => {
      const filters: DefinePhysicalFindingsValuesFilterFormValue = {
        operator: 'OP1',
        interdiction: 'INT1',
        manualAuditFindingsFlag: 'Y',
        equipmentType: 'EQ1',
        effectiveDate: new Date(2025, 0, 15),
        periodType: 'After',
        terminationDate: new Date(2025, 5, 30),
        terminationPeriodType: 'Before'
      };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({ key: 'operator', label: 'Operator: OP1', value: 'OP1' });
      expect(result[1]).toEqual({ key: 'interdiction', label: 'Interdiction: INT1', value: 'INT1' });
      expect(result[2]).toEqual({ key: 'manualAuditFindingsFlag', label: 'Manual Audit Find: Y', value: 'Y' });
      expect(result[3]).toEqual({ key: 'equipmentType', label: 'Equipment Type: EQ1', value: 'EQ1' });
      expect(result[4].key).toBe('effectiveDate');
      expect(result[4].label).toContain('≥');
      expect(result[5].key).toBe('terminationDate');
      expect(result[5].label).toContain('≤');
    });

    it('should create operator chip when operator is set', () => {
      const filters = { ...emptyFilters, operator: 'OP2' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('operator');
      expect(result[0].label).toBe('Operator: OP2');
    });

    it('should create interdiction chip when interdiction is set', () => {
      const filters = { ...emptyFilters, interdiction: 'INT-A' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('interdiction');
    });

    it('should create manualAuditFindingsFlag chip when set', () => {
      const filters = { ...emptyFilters, manualAuditFindingsFlag: 'N' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('manualAuditFindingsFlag');
      expect(result[0].label).toBe('Manual Audit Find: N');
    });

    it('should create equipmentType chip when set', () => {
      const filters = { ...emptyFilters, equipmentType: 'EQ-X' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('equipmentType');
    });

    it('should not create effectiveDate chip when periodType is null', () => {
      const filters = { ...emptyFilters, effectiveDate: new Date(2025, 0, 1), periodType: null };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create effectiveDate chip when effectiveDate is null', () => {
      const filters = { ...emptyFilters, effectiveDate: null, periodType: 'After' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create terminationDate chip when terminationPeriodType is null', () => {
      const filters = { ...emptyFilters, terminationDate: new Date(2025, 5, 1), terminationPeriodType: null };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should use >= operator for "After" period type', () => {
      const filters: DefinePhysicalFindingsValuesFilterFormValue = {
        ...emptyFilters,
        effectiveDate: new Date(2025, 0, 15),
        periodType: 'After'
      };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
    });

    it('should use <= operator for "Before" period type', () => {
      const filters: DefinePhysicalFindingsValuesFilterFormValue = {
        ...emptyFilters,
        terminationDate: new Date(2025, 5, 30),
        terminationPeriodType: 'Before'
      };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should use period type string as-is for unknown values', () => {
      const filters: DefinePhysicalFindingsValuesFilterFormValue = {
        ...emptyFilters,
        effectiveDate: new Date(2025, 0, 1),
        periodType: 'Custom'
      };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('Custom');
    });

    it('should format date as DD-MMM-YYYY', () => {
      const filters: DefinePhysicalFindingsValuesFilterFormValue = {
        ...emptyFilters,
        effectiveDate: new Date(2025, 11, 25),
        periodType: 'After'
      };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('25-DEC-2025');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = DefinePhysicalFindingsValuesFilterChipsUtils.removeFilterByChipKey(null, 'operator');

      expect(result).toBeNull();
    });

    it('should clear operator field', () => {
      const filters = { ...emptyFilters, operator: 'OP1', interdiction: 'INT1' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.removeFilterByChipKey(filters, 'operator');

      expect(result).not.toBeNull();
      expect(result!.operator).toBeNull();
      expect(result!.interdiction).toBe('INT1');
    });

    it('should clear interdiction field', () => {
      const filters = { ...emptyFilters, interdiction: 'INT1', operator: 'OP1' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.removeFilterByChipKey(filters, 'interdiction');

      expect(result).not.toBeNull();
      expect(result!.interdiction).toBeNull();
    });

    it('should clear manualAuditFindingsFlag field', () => {
      const filters = { ...emptyFilters, manualAuditFindingsFlag: 'Y', operator: 'OP1' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.removeFilterByChipKey(filters, 'manualAuditFindingsFlag');

      expect(result).not.toBeNull();
      expect(result!.manualAuditFindingsFlag).toBeNull();
    });

    it('should clear equipmentType field', () => {
      const filters = { ...emptyFilters, equipmentType: 'EQ1', operator: 'OP1' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.removeFilterByChipKey(filters, 'equipmentType');

      expect(result).not.toBeNull();
      expect(result!.equipmentType).toBeNull();
    });

    it('should clear effectiveDate and periodType together', () => {
      const filters = { ...emptyFilters, effectiveDate: new Date(2025, 0, 1), periodType: 'After', operator: 'OP1' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.periodType).toBeNull();
    });

    it('should clear terminationDate and terminationPeriodType together', () => {
      const filters = { ...emptyFilters, terminationDate: new Date(2025, 5, 1), terminationPeriodType: 'Before', operator: 'OP1' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationPeriodType).toBeNull();
    });

    it('should return null when removing the last active filter', () => {
      const filters = { ...emptyFilters, operator: 'OP1' };

      const result = DefinePhysicalFindingsValuesFilterChipsUtils.removeFilterByChipKey(filters, 'operator');

      expect(result).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(DefinePhysicalFindingsValuesFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are null', () => {
      expect(DefinePhysicalFindingsValuesFilterChipsUtils.hasActiveFilters(emptyFilters)).toBe(false);
    });

    it('should return true when operator is set', () => {
      expect(DefinePhysicalFindingsValuesFilterChipsUtils.hasActiveFilters({ ...emptyFilters, operator: 'OP1' })).toBe(true);
    });

    it('should return true when interdiction is set', () => {
      expect(DefinePhysicalFindingsValuesFilterChipsUtils.hasActiveFilters({ ...emptyFilters, interdiction: 'INT1' })).toBe(true);
    });

    it('should return true when manualAuditFindingsFlag is set', () => {
      expect(DefinePhysicalFindingsValuesFilterChipsUtils.hasActiveFilters({ ...emptyFilters, manualAuditFindingsFlag: 'Y' })).toBe(true);
    });

    it('should return true when equipmentType is set', () => {
      expect(DefinePhysicalFindingsValuesFilterChipsUtils.hasActiveFilters({ ...emptyFilters, equipmentType: 'EQ1' })).toBe(true);
    });

    it('should return true when effectiveDate and periodType are both set', () => {
      expect(DefinePhysicalFindingsValuesFilterChipsUtils.hasActiveFilters({
        ...emptyFilters,
        effectiveDate: new Date(2025, 0, 1),
        periodType: 'After'
      })).toBe(true);
    });

    it('should return false when only effectiveDate is set without periodType', () => {
      expect(DefinePhysicalFindingsValuesFilterChipsUtils.hasActiveFilters({
        ...emptyFilters,
        effectiveDate: new Date(2025, 0, 1)
      })).toBe(false);
    });
  });
});
