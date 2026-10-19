import { MultipleDriveFilterChipsUtils } from './filter-chips.utils';
import {
  MultipleDriveFilterRequest,
  MultipleDriveSelectionLookups
} from '../models/multiple-drive-selection-query.model';

describe('MultipleDriveFilterChipsUtils', () => {
  const lookups: MultipleDriveSelectionLookups = {
    select: [{ code: 'COL1', description: 'Column One' }],
    facility: [{ code: 'F1', description: 'Fac One' }],
    status: [{ code: 'S1', description: 'Status One' }],
    sponsors: [{ code: 'SP1', description: 'Sponsor One' }],
    zipCode: [{ code: 'Z1', description: 'Zip 1' }],
    sponsorCategory: [{ code: 'CAT', description: 'Category A' }],
    territory: [{ code: 'T1', description: 'Terr 1' }],
    procedure: [{ code: 'P1', description: 'Proc 1' }],
    driveCategory: [{ code: 'D1', description: 'Drive Cat 1' }],
    fixedDrive: [{ code: 'I', description: 'Include' }]
  };

  const baseFilters: MultipleDriveFilterRequest = {
    fromDate: '2026-01-01T00:00:00',
    toDate: '2026-01-31T00:00:00'
  };

  describe('convertFiltersToChips', () => {
    it('should return empty array when lookups is null', () => {
      expect(MultipleDriveFilterChipsUtils.convertFiltersToChips(baseFilters, null)).toEqual([]);
    });

    it('should create select chip', () => {
      const filters = { ...baseFilters, select: ['COL1'] };
      const chips = MultipleDriveFilterChipsUtils.convertFiltersToChips(filters, lookups);
      expect(chips.some((c) => c.key === 'select' && c.label.includes('Column One'))).toBeTrue();
    });

    it('should create facility, status, sponsors chips', () => {
      const filters: MultipleDriveFilterRequest = {
        ...baseFilters,
        facility: ['F1'],
        status: ['S1'],
        sponsors: ['SP1']
      };
      const chips = MultipleDriveFilterChipsUtils.convertFiltersToChips(filters, lookups);
      expect(chips.find((c) => c.key === 'facility')?.label).toContain('Fac One');
      expect(chips.find((c) => c.key === 'status')?.label).toContain('Status One');
      expect(chips.find((c) => c.key === 'sponsors')?.label).toContain('Sponsor One');
    });

    it('should split zip codes into up to 3 chips plus more chip', () => {
      const filters: MultipleDriveFilterRequest = {
        ...baseFilters,
        zipCode: ['Z1', 'Z2', 'Z3', 'Z4']
      };
      const zipLookups: MultipleDriveSelectionLookups = {
        ...lookups,
        zipCode: [
          { code: 'Z1', description: 'Zip 1' },
          { code: 'Z2', description: 'Zip 2' },
          { code: 'Z3', description: 'Zip 3' },
          { code: 'Z4', description: 'Zip 4' }
        ]
      };
      const chips = MultipleDriveFilterChipsUtils.convertFiltersToChips(filters, zipLookups);
      expect(chips.filter((c) => c.key.startsWith('zipCode_')).length).toBe(4);
      expect(chips.find((c) => c.key === 'zipCode_more')?.label).toContain('+1');
    });

    it('should create projected draw chip when min or max set', () => {
      const filters: MultipleDriveFilterRequest = {
        ...baseFilters,
        minimumProjectDraw: 1,
        maximumProjectDraw: 10
      };
      const chips = MultipleDriveFilterChipsUtils.convertFiltersToChips(filters, lookups);
      const chip = chips.find((c) => c.key === 'projectedDraw');
      expect(chip?.label).toContain('1');
      expect(chip?.label).toContain('10');
    });

    it('should create travel time chip when min or max set', () => {
      const filters: MultipleDriveFilterRequest = {
        ...baseFilters,
        minimumTravelTime: 5,
        maximumTravelTime: 30
      };
      const chips = MultipleDriveFilterChipsUtils.convertFiltersToChips(filters, lookups);
      expect(chips.find((c) => c.key === 'travelTime')).toBeDefined();
    });

    it('should create drive start time chip when all four fields set', () => {
      const filters: MultipleDriveFilterRequest = {
        ...baseFilters,
        minimumDriveStartTimeEnterTime: '09:00',
        minimumDriveStartTimeAMorPM: 'AM',
        maximumDriveStartTimeEnterTime: '05:00',
        maximumDriveStartTimeAMorPM: 'PM'
      };
      const chips = MultipleDriveFilterChipsUtils.convertFiltersToChips(filters, lookups);
      expect(chips.find((c) => c.key === 'driveStartTime')).toBeDefined();
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should remove single zip code by indexed key', () => {
      const filters: MultipleDriveFilterRequest = {
        ...baseFilters,
        zipCode: ['A', 'B']
      };
      const updated = MultipleDriveFilterChipsUtils.removeFilterByChipKey(filters, 'zipCode_0', 'A');
      expect(updated.zipCode).toEqual(['B']);
    });

    it('should clear all zip codes for zipCode_more', () => {
      const filters: MultipleDriveFilterRequest = {
        ...baseFilters,
        zipCode: ['A', 'B', 'C', 'D']
      };
      const updated = MultipleDriveFilterChipsUtils.removeFilterByChipKey(filters, 'zipCode_more');
      expect(updated.zipCode).toEqual([]);
    });


    it('should reset projected draw and travel time', () => {
      const filters: MultipleDriveFilterRequest = {
        ...baseFilters,
        minimumProjectDraw: 1,
        maximumProjectDraw: 2,
        minimumTravelTime: 1,
        maximumTravelTime: 2
      };
      let u = MultipleDriveFilterChipsUtils.removeFilterByChipKey(filters, 'projectedDraw');
      expect(u.minimumProjectDraw).toBeUndefined();
      expect(u.maximumProjectDraw).toBeUndefined();
      u = MultipleDriveFilterChipsUtils.removeFilterByChipKey(filters, 'travelTime');
      expect(u.minimumTravelTime).toBeUndefined();
      expect(u.maximumTravelTime).toBeUndefined();
    });

  });

  describe('hasActiveFilters', () => {
    it('should return false when only dates would be set (no optional filters)', () => {
      expect(MultipleDriveFilterChipsUtils.hasActiveFilters(baseFilters)).toBeFalse();
    });

    it('should return true when select has values', () => {
      expect(
        MultipleDriveFilterChipsUtils.hasActiveFilters({ ...baseFilters, select: ['a'] })
      ).toBeTrue();
    });

    it('should return true when travel time set', () => {
      expect(
        MultipleDriveFilterChipsUtils.hasActiveFilters({ ...baseFilters, minimumTravelTime: 0 })
      ).toBeTrue();
    });

    it('should return true when drive duration fields are set', () => {
      expect(
        MultipleDriveFilterChipsUtils.hasActiveFilters({
          ...baseFilters,
          minimumDriveDurationHour: 1,
          maximumDriveDurationHour: 2
        })
      ).toBeTrue();
    });
  });
});
