import { TemporaryDriveFilterChipsUtils } from './filter-chips.utils';
import { TemporaryDriveFilterValue } from '../models/temporary-drive-filter.model';

describe('TemporaryDriveFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = TemporaryDriveFilterChipsUtils.convertFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when all filter fields are null', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: null,
        driveCategory: null,
      };

      const result = TemporaryDriveFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create driveDate chip when driveDate is set', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: new Date('2025-07-04'),
        sponsorId: null,
        driveType: null,
        driveCategory: null,
      };

      const chips = TemporaryDriveFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('driveDate');
      expect(chips[0].label).toBe('Drive Date');
      expect(chips[0].removable).toBe(true);
    });

    it('should create sponsorId chip when both sponsorId and sponsorName are provided', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: 'SP001',
        driveType: null,
        driveCategory: null,
      };

      const chips = TemporaryDriveFilterChipsUtils.convertFiltersToChips(filters, 'Red Cross');

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('sponsorId');
      expect(chips[0].label).toBe('Sponsor');
      expect(chips[0].value).toBe('Red Cross');
      expect(chips[0].removable).toBe(true);
    });

    it('should not create sponsorId chip when sponsorId is set but sponsorName is missing', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: 'SP001',
        driveType: null,
        driveCategory: null,
      };

      const chips = TemporaryDriveFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.filter(c => c.key === 'sponsorId').length).toBe(0);
    });

    it('should not create sponsorId chip when sponsorName is provided but sponsorId is null', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: null,
        driveCategory: null,
      };

      const chips = TemporaryDriveFilterChipsUtils.convertFiltersToChips(filters, 'Red Cross');
      expect(chips.filter(c => c.key === 'sponsorId').length).toBe(0);
    });

    it('should create driveType chip when driveType is set', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: 'Mobile',
        driveCategory: null,
      };

      const chips = TemporaryDriveFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('driveType');
      expect(chips[0].label).toBe('Drive Type');
      expect(chips[0].value).toBe('Mobile');
      expect(chips[0].removable).toBe(true);
    });

    it('should create driveCategory chip when driveCategory is set', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: null,
        driveCategory: 'Community',
      };

      const chips = TemporaryDriveFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('driveCategory');
      expect(chips[0].label).toBe('Category');
      expect(chips[0].value).toBe('Community');
      expect(chips[0].removable).toBe(true);
    });

    it('should create all chips when all filters are populated with sponsorName', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: new Date('2025-07-04'),
        sponsorId: 'SP001',
        driveType: 'Mobile',
        driveCategory: 'Community',
      };

      const chips = TemporaryDriveFilterChipsUtils.convertFiltersToChips(filters, 'Red Cross');

      expect(chips.length).toBe(4);
      expect(chips.map(c => c.key)).toEqual([
        'driveDate', 'sponsorId', 'driveType', 'driveCategory'
      ]);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = TemporaryDriveFilterChipsUtils.removeFilterByChipKey(null, 'driveDate');
      expect(result).toBeNull();
    });

    it('should remove driveDate filter and return null when no other filters remain', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: new Date('2025-07-04'),
        sponsorId: null,
        driveType: null,
        driveCategory: null,
      };

      const result = TemporaryDriveFilterChipsUtils.removeFilterByChipKey(filters, 'driveDate');
      expect(result).toBeNull();
    });

    it('should remove driveDate filter and preserve others', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: new Date('2025-07-04'),
        sponsorId: 'SP001',
        driveType: null,
        driveCategory: null,
      };

      const result = TemporaryDriveFilterChipsUtils.removeFilterByChipKey(filters, 'driveDate');

      expect(result).not.toBeNull();
      expect(result!.driveDate).toBeNull();
      expect(result!.sponsorId).toBe('SP001');
    });

    it('should remove sponsorId filter', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: new Date('2025-07-04'),
        sponsorId: 'SP001',
        driveType: null,
        driveCategory: null,
      };

      const result = TemporaryDriveFilterChipsUtils.removeFilterByChipKey(filters, 'sponsorId');

      expect(result).not.toBeNull();
      expect(result!.sponsorId).toBeNull();
    });

    it('should remove driveType filter', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: 'Mobile',
        driveCategory: 'Community',
      };

      const result = TemporaryDriveFilterChipsUtils.removeFilterByChipKey(filters, 'driveType');

      expect(result).not.toBeNull();
      expect(result!.driveType).toBeNull();
      expect(result!.driveCategory).toBe('Community');
    });

    it('should remove driveCategory filter', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: 'Mobile',
        driveCategory: 'Community',
      };

      const result = TemporaryDriveFilterChipsUtils.removeFilterByChipKey(filters, 'driveCategory');

      expect(result).not.toBeNull();
      expect(result!.driveCategory).toBeNull();
    });

    it('should return null when removing the last active filter', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: 'Mobile',
        driveCategory: null,
      };

      const result = TemporaryDriveFilterChipsUtils.removeFilterByChipKey(filters, 'driveType');
      expect(result).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(TemporaryDriveFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are null', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: null,
        driveCategory: null,
      };
      expect(TemporaryDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when driveDate is set', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: new Date('2025-07-04'),
        sponsorId: null,
        driveType: null,
        driveCategory: null,
      };
      expect(TemporaryDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when sponsorId is set', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: 'SP001',
        driveType: null,
        driveCategory: null,
      };
      expect(TemporaryDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when driveType is set', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: 'Mobile',
        driveCategory: null,
      };
      expect(TemporaryDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when driveCategory is set', () => {
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: null,
        driveCategory: 'Community',
      };
      expect(TemporaryDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
