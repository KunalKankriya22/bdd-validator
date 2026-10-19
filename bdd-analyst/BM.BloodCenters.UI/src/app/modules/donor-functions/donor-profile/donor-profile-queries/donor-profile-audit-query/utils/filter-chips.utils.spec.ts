import { DonorProfileAuditQueryFilterChipsUtils } from './filter-chips.utils';
import { AuditFilterCriteria } from '../models/donor-profile-audit-query.model';

describe('DonorProfileAuditQueryFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = DonorProfileAuditQueryFilterChipsUtils.convertFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when no filter criteria are set', () => {
      const filters: AuditFilterCriteria = {};

      const result = DonorProfileAuditQueryFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create fromDate chip when fromDate is set', () => {
      const filters: AuditFilterCriteria = {
        fromDate: '2025-01-15',
      };

      const chips = DonorProfileAuditQueryFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('fromDate');
      expect(chips[0].label).toContain('From:');
      expect(chips[0].label).toContain('15-JAN-2025');
      expect(chips[0].value).toBe('2025-01-15');
      expect(chips[0].removable).toBe(true);
    });

    it('should create toDate chip when toDate is set', () => {
      const filters: AuditFilterCriteria = {
        toDate: '2025-12-31',
      };

      const chips = DonorProfileAuditQueryFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('toDate');
      expect(chips[0].label).toContain('To:');
      expect(chips[0].label).toContain('31-DEC-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should create insertedUser chip when insertedUser is set', () => {
      const filters: AuditFilterCriteria = {
        insertedUser: 'JSMITH',
      };

      const chips = DonorProfileAuditQueryFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('insertedUser');
      expect(chips[0].label).toBe('User: JSMITH');
      expect(chips[0].value).toBe('JSMITH');
      expect(chips[0].removable).toBe(true);
    });

    it('should create all chips when all filter criteria are set', () => {
      const filters: AuditFilterCriteria = {
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
        insertedUser: 'ADMIN',
      };

      const chips = DonorProfileAuditQueryFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('fromDate');
      expect(chips[1].key).toBe('toDate');
      expect(chips[2].key).toBe('insertedUser');
    });

    it('should format date in DD-MMM-YYYY uppercase format', () => {
      const filters: AuditFilterCriteria = {
        fromDate: '2025-07-04',
      };

      const chips = DonorProfileAuditQueryFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('04-JUL-2025');
    });

    it('should use raw date string for invalid date', () => {
      const filters: AuditFilterCriteria = {
        fromDate: 'invalid-date',
      };

      const chips = DonorProfileAuditQueryFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('invalid-date');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when currentFilters is null', () => {
      const result = DonorProfileAuditQueryFilterChipsUtils.removeFilterByChipKey(null, 'fromDate');
      expect(result).toBeNull();
    });

    it('should remove fromDate filter and return null when no other filters remain', () => {
      const filters: AuditFilterCriteria = {
        fromDate: '2025-01-01',
      };

      const result = DonorProfileAuditQueryFilterChipsUtils.removeFilterByChipKey(filters, 'fromDate');
      expect(result).toBeNull();
    });

    it('should remove fromDate filter and preserve other filters', () => {
      const filters: AuditFilterCriteria = {
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      };

      const result = DonorProfileAuditQueryFilterChipsUtils.removeFilterByChipKey(filters, 'fromDate');

      expect(result).not.toBeNull();
      expect(result!.fromDate).toBeUndefined();
      expect(result!.toDate).toBe('2025-12-31');
    });

    it('should remove toDate filter', () => {
      const filters: AuditFilterCriteria = {
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      };

      const result = DonorProfileAuditQueryFilterChipsUtils.removeFilterByChipKey(filters, 'toDate');

      expect(result).not.toBeNull();
      expect(result!.toDate).toBeUndefined();
      expect(result!.fromDate).toBe('2025-01-01');
    });

    it('should remove insertedUser filter', () => {
      const filters: AuditFilterCriteria = {
        insertedUser: 'ADMIN',
        fromDate: '2025-01-01',
      };

      const result = DonorProfileAuditQueryFilterChipsUtils.removeFilterByChipKey(filters, 'insertedUser');

      expect(result).not.toBeNull();
      expect(result!.insertedUser).toBeUndefined();
      expect(result!.fromDate).toBe('2025-01-01');
    });

    it('should return null when removing the last remaining filter', () => {
      const filters: AuditFilterCriteria = {
        insertedUser: 'ADMIN',
      };

      const result = DonorProfileAuditQueryFilterChipsUtils.removeFilterByChipKey(filters, 'insertedUser');
      expect(result).toBeNull();
    });

    it('should not modify filters when unknown chip key is provided', () => {
      const filters: AuditFilterCriteria = {
        fromDate: '2025-01-01',
      };

      const result = DonorProfileAuditQueryFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.fromDate).toBe('2025-01-01');
    });
  });
});
