import { SpecialDriveFilterChipsUtils } from './filter-chips.utils';
import { SpecialDriveFilterValue } from '../special-drive-filter-panel/special-drive-filter-panel';

describe('SpecialDriveFilterChipsUtils (manage-special-drive)', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = SpecialDriveFilterChipsUtils.convertFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when all filter fields are null', () => {
      const filters: SpecialDriveFilterValue = {
        driveId: null,
        sponsorId: null,
        driveType: null,
        category: null,
        driveDate: null,
      };

      const result = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create driveId chip when driveId is set', () => {
      const filters: SpecialDriveFilterValue = {
        driveId: 'DR001',
      };

      const chips = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('driveId');
      expect(chips[0].label).toBe('Drive ID: DR001');
      expect(chips[0].value).toBe('DR001');
    });

    it('should create sponsorId chip when sponsorId is set', () => {
      const filters: SpecialDriveFilterValue = {
        sponsorId: 'SP001',
      };

      const chips = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('sponsorId');
      expect(chips[0].label).toBe('Sponsor ID: SP001');
    });

    it('should create driveType chip with "Fixed" label when type is "F"', () => {
      const filters: SpecialDriveFilterValue = {
        driveType: 'F',
      };

      const chips = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('driveType');
      expect(chips[0].label).toBe('Drive Type: Fixed');
      expect(chips[0].value).toBe('F');
    });

    it('should create driveType chip with "Inside" label when type is "I"', () => {
      const filters: SpecialDriveFilterValue = {
        driveType: 'I',
      };

      const chips = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toBe('Drive Type: Inside');
    });

    it('should create driveType chip with "Coach" label when type is "C"', () => {
      const filters: SpecialDriveFilterValue = {
        driveType: 'C',
      };

      const chips = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toBe('Drive Type: Coach');
    });

    it('should use raw driveType value when type is unknown', () => {
      const filters: SpecialDriveFilterValue = {
        driveType: 'X',
      };

      const chips = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toBe('Drive Type: X');
    });

    it('should create category chip when category is set', () => {
      const filters: SpecialDriveFilterValue = {
        category: 'Blood Drive',
      };

      const chips = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('category');
      expect(chips[0].label).toBe('Category: Blood Drive');
    });

    it('should create driveDate chip with formatted date', () => {
      const filters: SpecialDriveFilterValue = {
        driveDate: new Date('2025-07-04'),
      };

      const chips = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('driveDate');
      expect(chips[0].label).toContain('Drive Date:');
    });

    it('should create all chips when all filters are populated', () => {
      const filters: SpecialDriveFilterValue = {
        driveId: 'DR001',
        sponsorId: 'SP001',
        driveType: 'F',
        category: 'Blood Drive',
        driveDate: new Date('2025-07-04'),
      };

      const chips = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(5);
      expect(chips.map(c => c.key)).toEqual([
        'driveId', 'sponsorId', 'driveType', 'category', 'driveDate'
      ]);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when currentFilters is null', () => {
      const result = SpecialDriveFilterChipsUtils.removeFilterByChipKey(null, 'driveId');
      expect(result).toBeNull();
    });

    it('should remove driveId filter and return null when no other filters remain', () => {
      const filters: SpecialDriveFilterValue = {
        driveId: 'DR001',
      };

      const result = SpecialDriveFilterChipsUtils.removeFilterByChipKey(filters, 'driveId');
      expect(result).toBeNull();
    });

    it('should remove driveId filter and preserve other filters', () => {
      const filters: SpecialDriveFilterValue = {
        driveId: 'DR001',
        sponsorId: 'SP001',
      };

      const result = SpecialDriveFilterChipsUtils.removeFilterByChipKey(filters, 'driveId');

      expect(result).not.toBeNull();
      expect(result!.driveId).toBeNull();
      expect(result!.sponsorId).toBe('SP001');
    });

    it('should remove sponsorId filter', () => {
      const filters: SpecialDriveFilterValue = {
        sponsorId: 'SP001',
        category: 'Test',
      };

      const result = SpecialDriveFilterChipsUtils.removeFilterByChipKey(filters, 'sponsorId');

      expect(result).not.toBeNull();
      expect(result!.sponsorId).toBeNull();
    });

    it('should remove driveType filter', () => {
      const filters: SpecialDriveFilterValue = {
        driveType: 'F',
        driveId: 'DR001',
      };

      const result = SpecialDriveFilterChipsUtils.removeFilterByChipKey(filters, 'driveType');

      expect(result).not.toBeNull();
      expect(result!.driveType).toBeNull();
    });

    it('should remove category filter', () => {
      const filters: SpecialDriveFilterValue = {
        category: 'Blood Drive',
        driveId: 'DR001',
      };

      const result = SpecialDriveFilterChipsUtils.removeFilterByChipKey(filters, 'category');

      expect(result).not.toBeNull();
      expect(result!.category).toBeNull();
    });

    it('should remove driveDate filter', () => {
      const filters: SpecialDriveFilterValue = {
        driveDate: new Date('2025-07-04'),
        driveId: 'DR001',
      };

      const result = SpecialDriveFilterChipsUtils.removeFilterByChipKey(filters, 'driveDate');

      expect(result).not.toBeNull();
      expect(result!.driveDate).toBeNull();
    });

    it('should not modify filters when unknown chip key is provided', () => {
      const filters: SpecialDriveFilterValue = {
        driveId: 'DR001',
      };

      const result = SpecialDriveFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.driveId).toBe('DR001');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(SpecialDriveFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are null', () => {
      const filters: SpecialDriveFilterValue = {
        driveId: null,
        sponsorId: null,
        driveType: null,
        category: null,
        driveDate: null,
      };
      expect(SpecialDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when driveId is set', () => {
      const filters: SpecialDriveFilterValue = { driveId: 'DR001' };
      expect(SpecialDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when sponsorId is set', () => {
      const filters: SpecialDriveFilterValue = { sponsorId: 'SP001' };
      expect(SpecialDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when driveType is set', () => {
      const filters: SpecialDriveFilterValue = { driveType: 'F' };
      expect(SpecialDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when category is set', () => {
      const filters: SpecialDriveFilterValue = { category: 'Blood Drive' };
      expect(SpecialDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when driveDate is set', () => {
      const filters: SpecialDriveFilterValue = { driveDate: new Date('2025-07-04') };
      expect(SpecialDriveFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
