import { AuditHoldFilterChipsUtils } from './filter-chips.utils';
import { AuditHoldFilterValue } from '../models/release-audit-holds.model';

describe('AuditHoldFilterChipsUtils', () => {

  /* -------------------------------- convertFiltersToChips -------------------------------- */

  describe('convertFiltersToChips', () => {

    it('should return empty array when filters is null', () => {
      const result = AuditHoldFilterChipsUtils.convertFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty filters', () => {
      const result = AuditHoldFilterChipsUtils.convertFiltersToChips({});
      expect(result).toEqual([]);
    });

    it('should create chip for donationType', () => {
      const result = AuditHoldFilterChipsUtils.convertFiltersToChips({ donationType: 'AL' });

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('donationType');
      expect(result[0].label).toBe('Donation Type: AL');
      expect(result[0].value).toBe('AL');
      expect(result[0].removable).toBe(true);
    });

    it('should create chip for donationProcedure', () => {
      const result = AuditHoldFilterChipsUtils.convertFiltersToChips({ donationProcedure: 'PP' });

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('donationProcedure');
      expect(result[0].label).toBe('Donation Procedure: PP');
      expect(result[0].value).toBe('PP');
    });

    it('should create chip for auditHoldType', () => {
      const result = AuditHoldFilterChipsUtils.convertFiltersToChips({ auditHoldType: 'BHOLD' });

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('auditHoldType');
      expect(result[0].label).toBe('Audit Hold Type: BHOLD');
      expect(result[0].value).toBe('BHOLD');
    });

    it('should create chip for collectionDate', () => {
      const result = AuditHoldFilterChipsUtils.convertFiltersToChips({ collectionDate: '15-JAN-2026' });

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('collectionDate');
      expect(result[0].label).toBe('Collection Date: 15-JAN-2026');
      expect(result[0].value).toBe('15-JAN-2026');
    });

    it('should create multiple chips for multiple filters', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'AL',
        donationProcedure: 'PP',
        auditHoldType: 'BHOLD',
        collectionDate: '15-JAN-2026'
      };

      const result = AuditHoldFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(4);
      const keys = result.map(c => c.key);
      expect(keys).toContain('donationType');
      expect(keys).toContain('donationProcedure');
      expect(keys).toContain('auditHoldType');
      expect(keys).toContain('collectionDate');
    });

    it('should only create chips for filters that have values', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'WB',
        auditHoldType: 'QHOLD'
      };

      const result = AuditHoldFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(2);
      const keys = result.map(c => c.key);
      expect(keys).toContain('donationType');
      expect(keys).toContain('auditHoldType');
      expect(keys).not.toContain('donationProcedure');
      expect(keys).not.toContain('collectionDate');
    });

    it('should set removable to true on all chips', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'AL',
        donationProcedure: 'PP',
        auditHoldType: 'BHOLD',
        collectionDate: '01-FEB-2026'
      };

      const result = AuditHoldFilterChipsUtils.convertFiltersToChips(filters);

      result.forEach(chip => {
        expect(chip.removable).toBe(true);
      });
    });

    it('should preserve the order: donationType, donationProcedure, auditHoldType, collectionDate', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'AL',
        donationProcedure: 'PP',
        auditHoldType: 'BHOLD',
        collectionDate: '15-JAN-2026'
      };

      const result = AuditHoldFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].key).toBe('donationType');
      expect(result[1].key).toBe('donationProcedure');
      expect(result[2].key).toBe('auditHoldType');
      expect(result[3].key).toBe('collectionDate');
    });

  });

  /* -------------------------------- removeFilterByChipKey -------------------------------- */

  describe('removeFilterByChipKey', () => {

    it('should return null when filters is null', () => {
      const result = AuditHoldFilterChipsUtils.removeFilterByChipKey(null, 'donationType');
      expect(result).toBeNull();
    });

    it('should remove donationType and return remaining filters', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'AL',
        donationProcedure: 'PP'
      };

      const result = AuditHoldFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      expect(result).not.toBeNull();
      expect(result!.donationType).toBeUndefined();
      expect(result!.donationProcedure).toBe('PP');
    });

    it('should remove donationProcedure and return remaining filters', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'WB',
        donationProcedure: 'PP'
      };

      const result = AuditHoldFilterChipsUtils.removeFilterByChipKey(filters, 'donationProcedure');

      expect(result).not.toBeNull();
      expect(result!.donationProcedure).toBeUndefined();
      expect(result!.donationType).toBe('WB');
    });

    it('should remove auditHoldType and return remaining filters', () => {
      const filters: AuditHoldFilterValue = {
        auditHoldType: 'BHOLD',
        collectionDate: '15-JAN-2026'
      };

      const result = AuditHoldFilterChipsUtils.removeFilterByChipKey(filters, 'auditHoldType');

      expect(result).not.toBeNull();
      expect(result!.auditHoldType).toBeUndefined();
      expect(result!.collectionDate).toBe('15-JAN-2026');
    });

    it('should remove collectionDate and return remaining filters', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'AL',
        collectionDate: '15-JAN-2026'
      };

      const result = AuditHoldFilterChipsUtils.removeFilterByChipKey(filters, 'collectionDate');

      expect(result).not.toBeNull();
      expect(result!.collectionDate).toBeUndefined();
      expect(result!.donationType).toBe('AL');
    });

    it('should return null when removing the last remaining filter', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'AL'
      };

      const result = AuditHoldFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      expect(result).toBeNull();
    });

    it('should not modify the original filters object', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'AL',
        donationProcedure: 'PP'
      };

      AuditHoldFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      expect(filters.donationType).toBe('AL');
      expect(filters.donationProcedure).toBe('PP');
    });

    it('should not remove any filter for an unknown chip key', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'AL',
        donationProcedure: 'PP'
      };

      const result = AuditHoldFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.donationType).toBe('AL');
      expect(result!.donationProcedure).toBe('PP');
    });

    it('should return null when removing the only filter (each key)', () => {
      const keys: Array<{ key: string; filter: AuditHoldFilterValue }> = [
        { key: 'donationType', filter: { donationType: 'WB' } },
        { key: 'donationProcedure', filter: { donationProcedure: 'PP' } },
        { key: 'auditHoldType', filter: { auditHoldType: 'QHOLD' } },
        { key: 'collectionDate', filter: { collectionDate: '01-MAR-2026' } }
      ];

      keys.forEach(({ key, filter }) => {
        const result = AuditHoldFilterChipsUtils.removeFilterByChipKey(filter, key);
        expect(result).toBeNull();
      });
    });

    it('should handle removing from a fully-populated filter object', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'AL',
        donationProcedure: 'PP',
        auditHoldType: 'BHOLD',
        collectionDate: '15-JAN-2026'
      };

      const result = AuditHoldFilterChipsUtils.removeFilterByChipKey(filters, 'auditHoldType');

      expect(result).not.toBeNull();
      expect(result!.donationType).toBe('AL');
      expect(result!.donationProcedure).toBe('PP');
      expect(result!.auditHoldType).toBeUndefined();
      expect(result!.collectionDate).toBe('15-JAN-2026');
    });

  });
});
