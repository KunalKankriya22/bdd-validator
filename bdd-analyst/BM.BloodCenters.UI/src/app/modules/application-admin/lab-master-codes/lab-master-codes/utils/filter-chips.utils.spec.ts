import { LabMasterCodesFilterChipsUtils } from './filter-chips.utils';
import { MasterCodeFilter } from '../services/lab-master-codes.service';

describe('LabMasterCodesFilterChipsUtils', () => {

  describe('convertFiltersToChips', () => {

    it('should return empty array for empty filter object', () => {
      const filters: MasterCodeFilter = {};
      expect(LabMasterCodesFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should return chip for effectiveDate with AFTER period', () => {
      const filters: MasterCodeFilter = {
        effectiveDate: new Date('2025-01-11'),
        effectiveDatePeriod: 'AFTER'
      };
      const chips = LabMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('11-JAN-2025');
    });

    it('should return chip for effectiveDate with BEFORE period', () => {
      const filters: MasterCodeFilter = {
        effectiveDate: new Date('2025-06-15'),
        effectiveDatePeriod: 'BEFORE'
      };
      const chips = LabMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('15-JUN-2025');
    });

    it('should not create chip when effectiveDate set but no period', () => {
      const filters: MasterCodeFilter = {
        effectiveDate: new Date('2025-01-11')
      };
      const chips = LabMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip when period set but no date', () => {
      const filters: MasterCodeFilter = {
        effectiveDatePeriod: 'AFTER'
      };
      const chips = LabMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should return chip for terminationDate with BEFORE period', () => {
      const filters: MasterCodeFilter = {
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      };
      const chips = LabMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('31-DEC-2025');
    });

    it('should return chip for terminationDate with AFTER period', () => {
      const filters: MasterCodeFilter = {
        terminationDate: new Date('2025-03-20'),
        terminationDatePeriod: 'AFTER'
      };
      const chips = LabMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('20-MAR-2025');
    });

    it('should return two chips when both effective and termination dates are set', () => {
      const filters: MasterCodeFilter = {
        effectiveDate: new Date('2025-01-11'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      };
      const chips = LabMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[1].key).toBe('terminationDate');
    });

    it('should format date with leading zero for single-digit day', () => {
      const filters: MasterCodeFilter = {
        effectiveDate: new Date('2025-01-05'),
        effectiveDatePeriod: 'AFTER'
      };
      const chips = LabMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toContain('05-JAN-2025');
    });
  });

  describe('removeFilterByChipKey', () => {




    it('should return updated filters when other active filters remain', () => {
      const filters: MasterCodeFilter = {
        effectiveDate: new Date('2025-01-11'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      };
      const result = LabMasterCodesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result).not.toBeNull();
      expect(result?.terminationDate).toBeDefined();
      expect(result?.terminationDatePeriod).toBe('BEFORE');
    });


  });

  describe('hasActiveFilters', () => {

    it('should return false for empty filter object', () => {
      expect(LabMasterCodesFilterChipsUtils.hasActiveFilters({})).toBe(false);
    });

    it('should return false when only effectiveDate set without period', () => {
      const filters: MasterCodeFilter = { effectiveDate: new Date() };
      expect(LabMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when only period set without date', () => {
      const filters: MasterCodeFilter = { effectiveDatePeriod: 'AFTER' };
      expect(LabMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effectiveDate and period both set', () => {
      const filters: MasterCodeFilter = {
        effectiveDate: new Date(),
        effectiveDatePeriod: 'AFTER'
      };
      expect(LabMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when terminationDate and period both set', () => {
      const filters: MasterCodeFilter = {
        terminationDate: new Date(),
        terminationDatePeriod: 'BEFORE'
      };
      expect(LabMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when both date filters are active', () => {
      const filters: MasterCodeFilter = {
        effectiveDate: new Date(),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date(),
        terminationDatePeriod: 'BEFORE'
      };
      expect(LabMasterCodesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
