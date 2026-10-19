import { EquipmentMasterCodesFilterChipsUtils } from './filter-chips.utils';
import { EquipmentMasterCodeFilter } from '../models/equipment-master-code.model';

describe('EquipmentMasterCodesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: EquipmentMasterCodeFilter = {};

      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert userGroup filter to chip', () => {
      const filters: EquipmentMasterCodeFilter = { userGroup: 'GRP01' };

      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('userGroup');
      expect(chips[0].label).toBe('User Group: GRP01');
      expect(chips[0].value).toBe('GRP01');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert effective date with "AFTER" period to chip using >= symbol', () => {
      const testDate = new Date('2025-01-15');
      const filters: EquipmentMasterCodeFilter = {
        effectiveDate: testDate,
        effectiveDatePeriod: 'AFTER'
      };

      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert effective date with "BEFORE" period to chip using <= symbol', () => {
      const testDate = new Date('2025-03-20');
      const filters: EquipmentMasterCodeFilter = {
        effectiveDate: testDate,
        effectiveDatePeriod: 'BEFORE'
      };

      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should not create effective date chip when date is set but period is missing', () => {
      const filters: EquipmentMasterCodeFilter = {
        effectiveDate: new Date('2025-01-15')
      };

      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create effective date chip when period is set but date is missing', () => {
      const filters: EquipmentMasterCodeFilter = {
        effectiveDatePeriod: 'AFTER'
      };

      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert termination date with "AFTER" period to chip using >= symbol', () => {
      const testDate = new Date('2025-12-31');
      const filters: EquipmentMasterCodeFilter = {
        terminationDate: testDate,
        terminationDatePeriod: 'AFTER'
      };

      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert termination date with "BEFORE" period to chip using <= symbol', () => {
      const testDate = new Date('2025-06-30');
      const filters: EquipmentMasterCodeFilter = {
        terminationDate: testDate,
        terminationDatePeriod: 'BEFORE'
      };

      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should not create termination date chip when date is set but period is missing', () => {
      const filters: EquipmentMasterCodeFilter = {
        terminationDate: new Date('2025-12-31')
      };

      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: EquipmentMasterCodeFilter = {
        userGroup: 'GRP01',
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      };

      const chips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('userGroup');
      expect(chips[1].key).toBe('effectiveDate');
      expect(chips[2].key).toBe('terminationDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = EquipmentMasterCodesFilterChipsUtils.removeFilterByChipKey(null, 'userGroup');
      expect(result).toBeNull();
    });

    it('should remove userGroup filter', () => {
      const filters: EquipmentMasterCodeFilter = {
        userGroup: 'GRP01',
        effectiveDate: new Date('2025-01-15'),
        effectiveDatePeriod: 'AFTER'
      };

      const result = EquipmentMasterCodesFilterChipsUtils.removeFilterByChipKey(filters, 'userGroup');
      expect(result).not.toBeNull();
      expect(result!.userGroup).toBeUndefined();
      expect(result!.effectiveDate).toBeDefined();
    });

    it('should remove effectiveDate and effectiveDatePeriod', () => {
      const filters: EquipmentMasterCodeFilter = {
        userGroup: 'GRP01',
        effectiveDate: new Date('2025-01-15'),
        effectiveDatePeriod: 'AFTER'
      };

      const result = EquipmentMasterCodesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeUndefined();
      expect(result!.effectiveDatePeriod).toBeUndefined();
      expect(result!.userGroup).toBe('GRP01');
    });

    it('should remove terminationDate and terminationDatePeriod', () => {
      const filters: EquipmentMasterCodeFilter = {
        userGroup: 'GRP01',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      };

      const result = EquipmentMasterCodesFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');
      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeUndefined();
      expect(result!.terminationDatePeriod).toBeUndefined();
    });

    it('should return null when removing the last active filter', () => {
      const filters: EquipmentMasterCodeFilter = { userGroup: 'GRP01' };

      const result = EquipmentMasterCodesFilterChipsUtils.removeFilterByChipKey(filters, 'userGroup');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: EquipmentMasterCodeFilter = {
        userGroup: 'GRP01',
        effectiveDate: new Date('2025-01-15'),
        effectiveDatePeriod: 'AFTER'
      };

      EquipmentMasterCodesFilterChipsUtils.removeFilterByChipKey(filters, 'userGroup');
      expect(filters.userGroup).toBe('GRP01');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(EquipmentMasterCodesFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters: EquipmentMasterCodeFilter = {};
      expect(EquipmentMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when userGroup is set', () => {
      const filters: EquipmentMasterCodeFilter = { userGroup: 'GRP01' };
      expect(EquipmentMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDate and effectiveDatePeriod are both set', () => {
      const filters: EquipmentMasterCodeFilter = {
        effectiveDate: new Date('2025-01-15'),
        effectiveDatePeriod: 'AFTER'
      };
      expect(EquipmentMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only effectiveDate is set without period', () => {
      const filters: EquipmentMasterCodeFilter = {
        effectiveDate: new Date('2025-01-15')
      };
      expect(EquipmentMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when terminationDate and terminationDatePeriod are both set', () => {
      const filters: EquipmentMasterCodeFilter = {
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      };
      expect(EquipmentMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only terminationDatePeriod is set without date', () => {
      const filters: EquipmentMasterCodeFilter = {
        terminationDatePeriod: 'BEFORE'
      };
      expect(EquipmentMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when multiple filters are active', () => {
      const filters: EquipmentMasterCodeFilter = {
        userGroup: 'GRP01',
        effectiveDate: new Date('2025-01-15'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      };
      expect(EquipmentMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
