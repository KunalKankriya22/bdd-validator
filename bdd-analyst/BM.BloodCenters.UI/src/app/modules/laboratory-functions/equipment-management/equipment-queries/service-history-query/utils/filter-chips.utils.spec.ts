import { ServiceHistoryFilterChipsUtils } from './filter-chips.utils';
import { ServiceHistoryFilterValue } from '../models/service-history-query.model';

describe('ServiceHistoryFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = ServiceHistoryFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: ServiceHistoryFilterValue = {};

      const chips = ServiceHistoryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert equipmentType filter to chip with code only', () => {
      const filters: ServiceHistoryFilterValue = { equipmentType: 'PUMP' };

      const chips = ServiceHistoryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('equipmentType');
      expect(chips[0].label).toBe('Equipment Type: PUMP');
      expect(chips[0].value).toBe('PUMP');
    });

    it('should convert equipmentType filter to chip with description when available', () => {
      const filters: ServiceHistoryFilterValue = {
        equipmentType: 'PUMP',
        equipmentTypeDescription: 'Blood Pump'
      };

      const chips = ServiceHistoryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('equipmentType');
      expect(chips[0].label).toBe('Equipment Type: PUMP - Blood Pump');
      expect(chips[0].value).toBe('PUMP');
    });

    it('should convert equipmentId filter to chip', () => {
      const filters: ServiceHistoryFilterValue = { equipmentId: 'EQ001' };

      const chips = ServiceHistoryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('equipmentId');
      expect(chips[0].label).toBe('Equipment ID: EQ001');
      expect(chips[0].value).toBe('EQ001');
    });

    it('should convert equipmentReference filter to chip', () => {
      const filters: ServiceHistoryFilterValue = { equipmentReference: 'REF123' };

      const chips = ServiceHistoryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('equipmentReference');
      expect(chips[0].label).toBe('Equipment Ref #: REF123');
      expect(chips[0].value).toBe('REF123');
    });

    it('should convert startDate filter to chip with formatted date', () => {
      const testDate = new Date('2025-01-15');
      const filters: ServiceHistoryFilterValue = { startDate: testDate };

      const chips = ServiceHistoryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('startDate');
      expect(chips[0].label).toContain('Start Date:');
      expect(chips[0].value).toEqual(testDate);
    });

    it('should convert endDate filter to chip with formatted date', () => {
      const testDate = new Date('2025-12-31');
      const filters: ServiceHistoryFilterValue = { endDate: testDate };

      const chips = ServiceHistoryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('endDate');
      expect(chips[0].label).toContain('End Date:');
      expect(chips[0].value).toEqual(testDate);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: ServiceHistoryFilterValue = {
        equipmentType: 'PUMP',
        equipmentTypeDescription: 'Blood Pump',
        equipmentId: 'EQ001',
        equipmentReference: 'REF123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      };

      const chips = ServiceHistoryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(5);
      expect(chips[0].key).toBe('equipmentType');
      expect(chips[1].key).toBe('equipmentId');
      expect(chips[2].key).toBe('equipmentReference');
      expect(chips[3].key).toBe('startDate');
      expect(chips[4].key).toBe('endDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = ServiceHistoryFilterChipsUtils.removeFilterByChipKey(null, 'equipmentType');
      expect(result).toBeNull();
    });

    it('should remove equipmentType and also clear equipmentTypeDescription, equipmentId, equipmentReference', () => {
      const filters: ServiceHistoryFilterValue = {
        equipmentType: 'PUMP',
        equipmentTypeDescription: 'Blood Pump',
        equipmentId: 'EQ001',
        equipmentReference: 'REF123',
        startDate: new Date('2025-01-01')
      };

      const result = ServiceHistoryFilterChipsUtils.removeFilterByChipKey(filters, 'equipmentType');
      expect(result).not.toBeNull();
      expect(result!.equipmentType).toBeUndefined();
      expect(result!.equipmentTypeDescription).toBeUndefined();
      expect(result!.equipmentId).toBeUndefined();
      expect(result!.equipmentReference).toBeUndefined();
      expect(result!.startDate).toBeDefined();
    });

    it('should remove equipmentId and also clear equipmentReference', () => {
      const filters: ServiceHistoryFilterValue = {
        equipmentType: 'PUMP',
        equipmentId: 'EQ001',
        equipmentReference: 'REF123'
      };

      const result = ServiceHistoryFilterChipsUtils.removeFilterByChipKey(filters, 'equipmentId');
      expect(result).not.toBeNull();
      expect(result!.equipmentId).toBeUndefined();
      expect(result!.equipmentReference).toBeUndefined();
      expect(result!.equipmentType).toBe('PUMP');
    });

    it('should remove equipmentReference only', () => {
      const filters: ServiceHistoryFilterValue = {
        equipmentType: 'PUMP',
        equipmentId: 'EQ001',
        equipmentReference: 'REF123'
      };

      const result = ServiceHistoryFilterChipsUtils.removeFilterByChipKey(filters, 'equipmentReference');
      expect(result).not.toBeNull();
      expect(result!.equipmentReference).toBeUndefined();
      expect(result!.equipmentType).toBe('PUMP');
      expect(result!.equipmentId).toBe('EQ001');
    });

    it('should remove startDate filter', () => {
      const filters: ServiceHistoryFilterValue = {
        equipmentType: 'PUMP',
        startDate: new Date('2025-01-01')
      };

      const result = ServiceHistoryFilterChipsUtils.removeFilterByChipKey(filters, 'startDate');
      expect(result).not.toBeNull();
      expect(result!.startDate).toBeUndefined();
      expect(result!.equipmentType).toBe('PUMP');
    });

    it('should remove endDate filter', () => {
      const filters: ServiceHistoryFilterValue = {
        equipmentType: 'PUMP',
        endDate: new Date('2025-12-31')
      };

      const result = ServiceHistoryFilterChipsUtils.removeFilterByChipKey(filters, 'endDate');
      expect(result).not.toBeNull();
      expect(result!.endDate).toBeUndefined();
      expect(result!.equipmentType).toBe('PUMP');
    });

    it('should return null when removing the last remaining filter', () => {
      const filters: ServiceHistoryFilterValue = {
        equipmentReference: 'REF123'
      };

      const result = ServiceHistoryFilterChipsUtils.removeFilterByChipKey(filters, 'equipmentReference');
      expect(result).toBeNull();
    });

    it('should return null when removing equipmentType cascades and clears all filters', () => {
      const filters: ServiceHistoryFilterValue = {
        equipmentType: 'PUMP',
        equipmentTypeDescription: 'Blood Pump',
        equipmentId: 'EQ001',
        equipmentReference: 'REF123'
      };

      const result = ServiceHistoryFilterChipsUtils.removeFilterByChipKey(filters, 'equipmentType');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: ServiceHistoryFilterValue = {
        equipmentType: 'PUMP',
        equipmentId: 'EQ001'
      };

      ServiceHistoryFilterChipsUtils.removeFilterByChipKey(filters, 'equipmentType');
      expect(filters.equipmentType).toBe('PUMP');
      expect(filters.equipmentId).toBe('EQ001');
    });
  });
});
