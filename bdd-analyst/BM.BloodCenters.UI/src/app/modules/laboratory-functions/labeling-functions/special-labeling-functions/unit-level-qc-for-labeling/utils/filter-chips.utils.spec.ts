import {
  generateFilterChips,
  removeFilterByKey,
  hasActiveFilters,
  clearAllFilters
} from './filter-chips.utils';
import { UnitLevelQCFilterValue } from '../models/unit-level-qc.model';

describe('Filter Chips Utils', () => {
  describe('generateFilterChips', () => {
    it('should generate chips for all active filters', () => {
      const filters: UnitLevelQCFilterValue = {
        unitId: 'UNIT001',
        productCode: 'RBC',
        qcLabelFlag: 'Y',
        systemLabelDecision: 'APPROVED',
        abo: 'A',
        rh: '+',
        status: 'ACTIVE',
        collDateFrom: new Date('2024-01-01'),
        collDateTo: new Date('2024-01-31'),
        labelDatsFrom: new Date('2024-01-15'),
        labelDatsTo: new Date('2024-01-20')
      };

      const chips = generateFilterChips(filters);

      expect(chips.length).toBe(11);
      expect(chips.find(c => c.key === 'unitId')?.value).toBe('UNIT001');
      expect(chips.find(c => c.key === 'productCode')?.value).toBe('RBC');
      expect(chips.find(c => c.key === 'qcLabelFlag')?.value).toBe('Y');
      expect(chips.find(c => c.key === 'systemLabelDecision')?.value).toBe('APPROVED');
      expect(chips.find(c => c.key === 'abo')?.value).toBe('A');
      expect(chips.find(c => c.key === 'rh')?.value).toBe('+');
      expect(chips.find(c => c.key === 'status')?.value).toBe('ACTIVE');
    });

    it('should format date chips in DD-MMM-YYYY uppercase', () => {
      const filters: UnitLevelQCFilterValue = {
        collDateFrom: new Date('2024-03-15'),
        collDateTo: new Date('2024-03-20')
      };

      const chips = generateFilterChips(filters);

      expect(chips.length).toBe(2);
      expect(chips.find(c => c.key === 'collDateFrom')?.value).toBe('15-MAR-2024');
      expect(chips.find(c => c.key === 'collDateTo')?.value).toBe('20-MAR-2024');
    });

    it('should not generate chips for "All" dropdown values', () => {
      const filters: UnitLevelQCFilterValue = {
        qcLabelFlag: 'All',
        abo: 'All',
        rh: 'All'
      };

      const chips = generateFilterChips(filters);

      expect(chips.length).toBe(0);
    });

    it('should not generate chips for empty or null values', () => {
      const filters: UnitLevelQCFilterValue = {
        unitId: undefined,
        productCode: undefined,
        collDateFrom: null,
        collDateTo: null
      };

      const chips = generateFilterChips(filters);

      expect(chips.length).toBe(0);
    });

  });

  describe('removeFilterByKey', () => {
    it('should remove text filter by key', () => {
      const filters: UnitLevelQCFilterValue = {
        unitId: 'UNIT001',
        productCode: 'RBC',
        status: 'ACTIVE'
      };

      const updated = removeFilterByKey(filters, 'unitId');

      expect(updated.unitId).toBeUndefined();
      expect(updated.productCode).toBe('RBC');
      expect(updated.status).toBe('ACTIVE');
    });

    it('should reset dropdown filter to "All"', () => {
      const filters: UnitLevelQCFilterValue = {
        qcLabelFlag: 'Y',
        abo: 'A',
        rh: '+'
      };

      let updated = removeFilterByKey(filters, 'qcLabelFlag');
      expect(updated.qcLabelFlag).toBe('All');

      updated = removeFilterByKey(updated, 'abo');
      expect(updated.abo).toBe('All');

      updated = removeFilterByKey(updated, 'rh');
      expect(updated.rh).toBe('All');
    });

    it('should reset date filter to null', () => {
      const filters: UnitLevelQCFilterValue = {
        collDateFrom: new Date('2024-01-01'),
        collDateTo: new Date('2024-01-31'),
        labelDatsFrom: new Date('2024-01-15'),
        labelDatsTo: new Date('2024-01-20')
      };

      let updated = removeFilterByKey(filters, 'collDateFrom');
      expect(updated.collDateFrom).toBeNull();
      expect(updated.collDateTo).not.toBeNull();

      updated = removeFilterByKey(updated, 'labelDatsTo');
      expect(updated.labelDatsTo).toBeNull();
    });

  });

  describe('hasActiveFilters', () => {
    it('should return true when text filters are active', () => {
      const filters: UnitLevelQCFilterValue = {
        unitId: 'UNIT001'
      };

      expect(hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when dropdown filters are active (not "All")', () => {
      const filters: UnitLevelQCFilterValue = {
        qcLabelFlag: 'Y'
      };

      expect(hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when date filters are active', () => {
      const filters: UnitLevelQCFilterValue = {
        collDateFrom: new Date('2024-01-01')
      };

      expect(hasActiveFilters(filters)).toBeTrue();
    });

    it('should return false when all filters are empty or "All"', () => {
      const filters: UnitLevelQCFilterValue = {
        unitId: undefined,
        productCode: undefined,
        qcLabelFlag: 'All',
        abo: 'All',
        rh: 'All',
        collDateFrom: null,
        collDateTo: null
      };

      expect(hasActiveFilters(filters)).toBeFalse();
    });

    it('should return false for empty filters object', () => {
      const filters: UnitLevelQCFilterValue = {};

      expect(hasActiveFilters(filters)).toBeFalse();
    });
  });

  describe('clearAllFilters', () => {
    it('should return filter object with all values cleared', () => {
      const cleared = clearAllFilters();

      expect(cleared.unitId).toBeUndefined();
      expect(cleared.productCode).toBeUndefined();
      expect(cleared.qcLabelFlag).toBe('All');
      expect(cleared.systemLabelDecision).toBeUndefined();
      expect(cleared.abo).toBe('All');
      expect(cleared.rh).toBe('All');
      expect(cleared.status).toBeUndefined();
      expect(cleared.collDateFrom).toBeNull();
      expect(cleared.collDateTo).toBeNull();
      expect(cleared.labelDatsFrom).toBeNull();
      expect(cleared.labelDatsTo).toBeNull();
    });

    it('should set dropdown filters to "All" instead of undefined', () => {
      const cleared = clearAllFilters();

      expect(cleared.qcLabelFlag).toBe('All');
      expect(cleared.abo).toBe('All');
      expect(cleared.rh).toBe('All');
    });

    it('should return a new object each time', () => {
      const cleared1 = clearAllFilters();
      const cleared2 = clearAllFilters();

      expect(cleared1).not.toBe(cleared2);
      expect(cleared1).toEqual(cleared2);
    });
  });
});
