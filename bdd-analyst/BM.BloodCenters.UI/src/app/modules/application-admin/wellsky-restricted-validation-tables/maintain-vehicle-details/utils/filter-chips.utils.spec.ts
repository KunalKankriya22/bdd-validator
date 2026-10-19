import { VehicleDetailsFilterChipsUtils } from './filter-chips.utils';
import { VehicleDetailsFilterValue } from '../models/vehicle-details.model';

describe('VehicleDetailsFilterChipsUtils', () => {
  const emptyFilters: VehicleDetailsFilterValue = {
    vehicleId: null,
    vehicleType: null,
    showTerminated: false,
    effectiveDate: null,
    effectiveDatePeriod: null,
    terminationDate: null,
    terminationDatePeriod: null
  };

  describe('toFilterChips', () => {
    it('should return empty array for empty filters', () => {
      expect(VehicleDetailsFilterChipsUtils.toFilterChips(emptyFilters)).toEqual([]);
    });

    it('should create chip for vehicleId', () => {
      const filters = { ...emptyFilters, vehicleId: 'V001' };
      const chips = VehicleDetailsFilterChipsUtils.toFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('vehicleId');
      expect(chips[0].label).toContain('V001');
    });

    it('should create chip for vehicleType', () => {
      const filters = { ...emptyFilters, vehicleType: 'VAN' };
      const chips = VehicleDetailsFilterChipsUtils.toFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('vehicleType');
      expect(chips[0].label).toContain('VAN');
    });

    it('should create chip for showTerminated', () => {
      const filters = { ...emptyFilters, showTerminated: true };
      const chips = VehicleDetailsFilterChipsUtils.toFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('showTerminated');
      expect(chips[0].label).toContain('Yes');
    });

    it('should create chip for effectiveDate with period', () => {
      const filters = {
        ...emptyFilters,
        effectiveDate: '2025-03-14T00:00:00Z',
        effectiveDatePeriod: 'Before' as const
      };
      const chips = VehicleDetailsFilterChipsUtils.toFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Before');
    });

    it('should not create chip for effectiveDate without period', () => {
      const filters = { ...emptyFilters, effectiveDate: '2025-03-14T00:00:00Z' };
      const chips = VehicleDetailsFilterChipsUtils.toFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create chip for terminationDate with period', () => {
      const filters = {
        ...emptyFilters,
        terminationDate: '2025-06-01T00:00:00Z',
        terminationDatePeriod: 'After' as const
      };
      const chips = VehicleDetailsFilterChipsUtils.toFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('After');
    });

    it('should create multiple chips for multiple filters', () => {
      const filters: VehicleDetailsFilterValue = {
        vehicleId: 'V001',
        vehicleType: 'VAN',
        showTerminated: true,
        effectiveDate: '2025-03-14T00:00:00Z',
        effectiveDatePeriod: 'Before',
        terminationDate: '2025-06-01T00:00:00Z',
        terminationDatePeriod: 'After'
      };
      const chips = VehicleDetailsFilterChipsUtils.toFilterChips(filters);
      expect(chips.length).toBe(5);
    });
  });

  describe('removeFilter', () => {


    it('should remove showTerminated filter', () => {
      const filters = { ...emptyFilters, showTerminated: true };
      const result = VehicleDetailsFilterChipsUtils.removeFilter(filters, 'showTerminated');
      expect(result.showTerminated).toBeFalse();
    });



    it('should not modify other filters when removing one', () => {
      const filters = { ...emptyFilters, vehicleId: 'V001', vehicleType: 'VAN' };
      const result = VehicleDetailsFilterChipsUtils.removeFilter(filters, 'vehicleId');
      expect(result.vehicleType).toBe('VAN');
    });
  });

  describe('clearAll', () => {
    it('should return empty filter values', () => {
      const result = VehicleDetailsFilterChipsUtils.clearAll();
      expect(result.vehicleId).toBeNull();
      expect(result.vehicleType).toBeNull();
      expect(result.showTerminated).toBeFalse();
      expect(result.effectiveDate).toBeNull();
      expect(result.effectiveDatePeriod).toBeNull();
      expect(result.terminationDate).toBeNull();
      expect(result.terminationDatePeriod).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {

    it('should return true when vehicleId is set', () => {
      expect(VehicleDetailsFilterChipsUtils.hasActiveFilters({ ...emptyFilters, vehicleId: 'V001' })).toBeTrue();
    });

    it('should return true when vehicleType is set', () => {
      expect(VehicleDetailsFilterChipsUtils.hasActiveFilters({ ...emptyFilters, vehicleType: 'VAN' })).toBeTrue();
    });

    it('should return true when showTerminated is true', () => {
      expect(VehicleDetailsFilterChipsUtils.hasActiveFilters({ ...emptyFilters, showTerminated: true })).toBeTrue();
    });


  });
});
