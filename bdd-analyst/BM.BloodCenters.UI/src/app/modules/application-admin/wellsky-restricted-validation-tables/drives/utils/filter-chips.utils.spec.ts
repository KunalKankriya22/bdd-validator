import { DrivesFilterChipsUtils } from './filter-chips.utils';
import { DrivesFilterValue } from '../models/drives.model';

describe('DrivesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert type filter to chip', () => {
      const filters: DrivesFilterValue = {
        type: 'F - Fixed site drives',
        drive: null,
        siteId: null,
        period: null,
        scheduledDate: null
      };

      const result = DrivesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('type');
      expect(result[0].label).toContain('Type:');
    });

  });
  describe('hasActiveFilters', () => {

    it('should return true when type is set', () => {
      const filters: DrivesFilterValue = {
        type: 'F - Fixed site drives',
        drive: null,
        siteId: null,
        period: null,
        scheduledDate: null
      };

      expect(DrivesFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();
    });


    it('should return true when drive is set', () => {
      const filters: DrivesFilterValue = {
        type: null,
        drive: '001',
        siteId: null,
        period: null,
        scheduledDate: null
      };

      expect(DrivesFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when siteId is set', () => {
      const filters: DrivesFilterValue = {
        type: null,
        drive: null,
        siteId: '1000',
        period: null,
        scheduledDate: null
      };

      expect(DrivesFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when scheduledDate is set', () => {
      const filters: DrivesFilterValue = {
        type: null,
        drive: null,
        siteId: null,
        period: 'After',
        scheduledDate: new Date()
      };

      expect(DrivesFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();
    });
  });

  describe('edge cases', () => {
    it('should handle removing drive filter', () => {
      const filters: DrivesFilterValue = {
        type: null,
        drive: '001',
        siteId: '1000',
        period: null,
        scheduledDate: null
      };

      const result = DrivesFilterChipsUtils.removeFilterByChipKey(filters, 'drive');
      expect(result?.drive).toBeNull();
      expect(result?.siteId).toBe('1000');
    });


    it('should convert period filter to chip', () => {
      const filters: DrivesFilterValue = {
        type: null,
        drive: null,
        siteId: null,
        period: 'After',
        scheduledDate: new Date('2026-02-28')
      };

      const result = DrivesFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
