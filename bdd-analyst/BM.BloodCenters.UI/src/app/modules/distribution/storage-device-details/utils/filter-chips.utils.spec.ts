import { StorageDeviceFilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

describe('StorageDeviceFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = StorageDeviceFilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when all filter fields are null', () => {
      const filters = {
        deviceType: null,
        statusCode: null,
        effectiveDate: null,
        effectivePeriod: null,
        terminationDate: null,
        terminationPeriod: null
      } as any;

      const result = StorageDeviceFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated filters', () => {
      const effDate = new Date(2025, 0, 15);
      const termDate = new Date(2025, 5, 30);
      const filters = {
        deviceType: 'FRIDGE',
        statusCode: 'ACTIVE',
        effectiveDate: effDate,
        effectivePeriod: 'After',
        terminationDate: termDate,
        terminationPeriod: 'Before'
      } as any;

      const result = StorageDeviceFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ key: 'deviceType', label: 'Device Type: FRIDGE', value: 'FRIDGE' });
      expect(result[1]).toEqual({ key: 'statusCode', label: 'Status Code: ACTIVE', value: 'ACTIVE' });
      expect(result[2].key).toBe('effectiveDate');
      expect(result[2].label).toContain('≥');
      expect(result[3].key).toBe('terminationDate');
      expect(result[3].label).toContain('≤');
    });

    it('should create deviceType chip when set', () => {
      const filters = { deviceType: 'FREEZER' } as any;

      const result = StorageDeviceFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('deviceType');
      expect(result[0].label).toBe('Device Type: FREEZER');
    });

    it('should create statusCode chip when set', () => {
      const filters = { statusCode: 'INACTIVE' } as any;

      const result = StorageDeviceFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('statusCode');
      expect(result[0].label).toBe('Status Code: INACTIVE');
    });

    it('should not create effectiveDate chip when effectivePeriod is null', () => {
      const filters = { effectiveDate: new Date(2025, 0, 1), effectivePeriod: null } as any;

      const result = StorageDeviceFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create effectiveDate chip when effectiveDate is null', () => {
      const filters = { effectiveDate: null, effectivePeriod: 'After' } as any;

      const result = StorageDeviceFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should use >= for After period on effectiveDate', () => {
      const effDate = new Date(2025, 2, 10);
      const filters = { effectiveDate: effDate, effectivePeriod: 'After' } as any;

      const result = StorageDeviceFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
      expect(result[0].label).toContain(moment(effDate).format('DD-MMM-YYYY').toUpperCase());
    });

    it('should use <= for Before period on terminationDate', () => {
      const filters = { terminationDate: new Date(2025, 11, 31), terminationPeriod: 'Before' } as any;

      const result = StorageDeviceFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should not create terminationDate chip when terminationPeriod is null', () => {
      const filters = { terminationDate: new Date(2025, 5, 1), terminationPeriod: null } as any;

      const result = StorageDeviceFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = StorageDeviceFilterChipsUtils.removeFilterByChipKey(null, 'deviceType');

      expect(result).toBeNull();
    });

    it('should clear deviceType', () => {
      const filters = { deviceType: 'FRIDGE', statusCode: 'ACTIVE' } as any;

      const result = StorageDeviceFilterChipsUtils.removeFilterByChipKey(filters, 'deviceType');

      expect(result).not.toBeNull();
      expect(result!.deviceType).toBeNull();
      expect(result!.statusCode).toBe('ACTIVE');
    });

    it('should clear statusCode', () => {
      const filters = { statusCode: 'ACTIVE', deviceType: 'FRIDGE' } as any;

      const result = StorageDeviceFilterChipsUtils.removeFilterByChipKey(filters, 'statusCode');

      expect(result).not.toBeNull();
      expect(result!.statusCode).toBeNull();
    });

    it('should clear effectiveDate and effectivePeriod together', () => {
      const filters = {
        effectiveDate: new Date(2025, 0, 1),
        effectivePeriod: 'After',
        deviceType: 'FRIDGE'
      } as any;

      const result = StorageDeviceFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectivePeriod).toBeNull();
    });

    it('should clear terminationDate and terminationPeriod together', () => {
      const filters = {
        terminationDate: new Date(2025, 11, 31),
        terminationPeriod: 'Before',
        deviceType: 'FRIDGE'
      } as any;

      const result = StorageDeviceFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationPeriod).toBeNull();
    });

    it('should return null when removing the last active filter', () => {
      const filters = { deviceType: 'FRIDGE' } as any;

      const result = StorageDeviceFilterChipsUtils.removeFilterByChipKey(filters, 'deviceType');

      expect(result).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(StorageDeviceFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are null/falsy', () => {
      const filters = {
        deviceType: null,
        statusCode: null,
        effectiveDate: null,
        terminationDate: null
      } as any;

      expect(StorageDeviceFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when deviceType is set', () => {
      expect(StorageDeviceFilterChipsUtils.hasActiveFilters({ deviceType: 'FRIDGE' } as any)).toBe(true);
    });

    it('should return true when statusCode is set', () => {
      expect(StorageDeviceFilterChipsUtils.hasActiveFilters({ statusCode: 'ACTIVE' } as any)).toBe(true);
    });

    it('should return true when effectiveDate is set', () => {
      expect(StorageDeviceFilterChipsUtils.hasActiveFilters({ effectiveDate: new Date() } as any)).toBe(true);
    });

    it('should return true when terminationDate is set', () => {
      expect(StorageDeviceFilterChipsUtils.hasActiveFilters({ terminationDate: new Date() } as any)).toBe(true);
    });
  });
});
