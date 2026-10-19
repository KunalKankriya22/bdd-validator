import { TemporaryDriveQueryFilterChipsUtils } from './filter-chips.utils';
import { TemporaryDriveFilterValue } from '../models/temporary-drive-query.model';

describe('TemporaryDriveQueryFilterChipsUtils', () => {
  const emptyFilters: TemporaryDriveFilterValue = {
    status: null,
    recruiterName: null,
    sponsorName: null
  };

  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = TemporaryDriveQueryFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const chips = TemporaryDriveQueryFilterChipsUtils.convertFiltersToChips(emptyFilters);
      expect(chips).toEqual([]);
    });

    it('should convert status "U" to chip with label "Used"', () => {
      const filters: TemporaryDriveFilterValue = { ...emptyFilters, status: 'U' };

      const chips = TemporaryDriveQueryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('status');
      expect(chips[0].label).toBe('Status: Used');
      expect(chips[0].value).toBe('U');
    });

    it('should convert status "D" to chip with label "Deleted"', () => {
      const filters: TemporaryDriveFilterValue = { ...emptyFilters, status: 'D' };

      const chips = TemporaryDriveQueryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Status: Deleted');
    });

    it('should use raw status code when code is not recognized', () => {
      const filters: TemporaryDriveFilterValue = { ...emptyFilters, status: 'X' };

      const chips = TemporaryDriveQueryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Status: X');
    });

    it('should convert recruiterName filter to chip', () => {
      const filters: TemporaryDriveFilterValue = { ...emptyFilters, recruiterName: 'John Doe' };

      const chips = TemporaryDriveQueryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('recruiterName');
      expect(chips[0].label).toBe('Recruiter: John Doe');
      expect(chips[0].value).toBe('John Doe');
    });

    it('should convert sponsorName filter to chip', () => {
      const filters: TemporaryDriveFilterValue = { ...emptyFilters, sponsorName: 'ACME Corp' };

      const chips = TemporaryDriveQueryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('sponsorName');
      expect(chips[0].label).toBe('Sponsor: ACME Corp');
      expect(chips[0].value).toBe('ACME Corp');
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: TemporaryDriveFilterValue = {
        status: 'U',
        recruiterName: 'John Doe',
        sponsorName: 'ACME Corp'
      };

      const chips = TemporaryDriveQueryFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('status');
      expect(chips[1].key).toBe('recruiterName');
      expect(chips[2].key).toBe('sponsorName');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = TemporaryDriveQueryFilterChipsUtils.removeFilterByChipKey(null, 'status');
      expect(result).toBeNull();
    });

    it('should remove status filter', () => {
      const filters: TemporaryDriveFilterValue = {
        status: 'U',
        recruiterName: 'John Doe',
        sponsorName: null
      };

      const result = TemporaryDriveQueryFilterChipsUtils.removeFilterByChipKey(filters, 'status');
      expect(result).not.toBeNull();
      expect(result!.status).toBeNull();
      expect(result!.recruiterName).toBe('John Doe');
    });

    it('should remove recruiterName filter', () => {
      const filters: TemporaryDriveFilterValue = {
        status: 'U',
        recruiterName: 'John Doe',
        sponsorName: null
      };

      const result = TemporaryDriveQueryFilterChipsUtils.removeFilterByChipKey(filters, 'recruiterName');
      expect(result).not.toBeNull();
      expect(result!.recruiterName).toBeNull();
      expect(result!.status).toBe('U');
    });

    it('should remove sponsorName filter', () => {
      const filters: TemporaryDriveFilterValue = {
        status: null,
        recruiterName: null,
        sponsorName: 'ACME Corp'
      };

      const result = TemporaryDriveQueryFilterChipsUtils.removeFilterByChipKey(filters, 'sponsorName');
      expect(result).toBeNull();
    });

    it('should return null when removing the last active filter', () => {
      const filters: TemporaryDriveFilterValue = {
        status: 'U',
        recruiterName: null,
        sponsorName: null
      };

      const result = TemporaryDriveQueryFilterChipsUtils.removeFilterByChipKey(filters, 'status');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: TemporaryDriveFilterValue = {
        status: 'U',
        recruiterName: 'John Doe',
        sponsorName: null
      };

      TemporaryDriveQueryFilterChipsUtils.removeFilterByChipKey(filters, 'status');
      expect(filters.status).toBe('U');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(TemporaryDriveQueryFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      expect(TemporaryDriveQueryFilterChipsUtils.hasActiveFilters(emptyFilters)).toBe(false);
    });

    it('should return true when status is set', () => {
      const filters: TemporaryDriveFilterValue = { ...emptyFilters, status: 'U' };
      expect(TemporaryDriveQueryFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when recruiterName is set', () => {
      const filters: TemporaryDriveFilterValue = { ...emptyFilters, recruiterName: 'John Doe' };
      expect(TemporaryDriveQueryFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when sponsorName is set', () => {
      const filters: TemporaryDriveFilterValue = { ...emptyFilters, sponsorName: 'ACME Corp' };
      expect(TemporaryDriveQueryFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when multiple filters are active', () => {
      const filters: TemporaryDriveFilterValue = {
        status: 'U',
        recruiterName: 'John Doe',
        sponsorName: 'ACME Corp'
      };
      expect(TemporaryDriveQueryFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
