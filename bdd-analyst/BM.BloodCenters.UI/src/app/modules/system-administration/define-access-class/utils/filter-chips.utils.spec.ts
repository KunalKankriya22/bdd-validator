import { DefineAccessClassFilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

describe('DefineAccessClassFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return an empty array when filters is null', () => {
      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(null);

      expect(result).toEqual([]);
    });

    it('should return an empty array when all filter fields are null', () => {
      const filters = {
        type: null,
        code: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
        status: null
      } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated filters', () => {
      const filters = {
        type: 'Admin',
        code: 'AC001',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: '2025-01-15',
        terminationDatePeriod: 'AFTER',
        terminationDate: '2025-06-30',
        status: 'Active'
      } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ key: 'type', label: 'Type: Admin', value: 'Admin' });
      expect(result[1]).toEqual({ key: 'code', label: 'Code: AC001', value: 'AC001' });
      expect(result[2].key).toBe('effectiveDate');
      expect(result[2].label).toContain('≥');
      expect(result[3].key).toBe('terminationDate');
      expect(result[3].label).toContain('≥');
      expect(result[4]).toEqual({ key: 'status', label: 'Status: Active', value: 'Active' });
    });

    it('should create type chip when set', () => {
      const filters = { type: 'User' } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('type');
      expect(result[0].label).toBe('Type: User');
    });

    it('should create code chip when set', () => {
      const filters = { code: 'X01' } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('code');
      expect(result[0].label).toBe('Code: X01');
    });

    it('should create status chip when set', () => {
      const filters = { status: 'Inactive' } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('status');
      expect(result[0].label).toBe('Status: Inactive');
    });

    it('should not create effectiveDate chip when effectiveDatePeriod is null', () => {
      const filters = { effectiveDate: '2025-01-01', effectiveDatePeriod: null } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create effectiveDate chip when effectiveDate is null', () => {
      const filters = { effectiveDatePeriod: 'AFTER', effectiveDate: null } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should use >= operator for AFTER period', () => {
      const filters = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: '2025-03-15'
      } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
      expect(result[0].label).toContain(moment('2025-03-15').format('DD-MMM-YYYY').toUpperCase());
    });

    it('should use <= operator for non-AFTER period (BEFORE)', () => {
      const filters = {
        terminationDatePeriod: 'BEFORE',
        terminationDate: '2025-12-31'
      } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should not create terminationDate chip when terminationDatePeriod is null', () => {
      const filters = { terminationDate: '2025-12-31', terminationDatePeriod: null } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should format date value for chip value field', () => {
      const filters = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: '2025-03-15'
      } as any;

      const result = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].value).toBe(moment('2025-03-15').format('DD-MMM-YYYY').toUpperCase());
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = DefineAccessClassFilterChipsUtils.removeFilterByChipKey(null, 'type');

      expect(result).toBeNull();
    });

    it('should clear type', () => {
      const filters = { type: 'Admin', code: 'X01' } as any;

      const result = DefineAccessClassFilterChipsUtils.removeFilterByChipKey(filters, 'type');

      expect(result).not.toBeNull();
      expect(result!.type).toBeNull();
      expect(result!.code).toBe('X01');
    });

    it('should clear code', () => {
      const filters = { code: 'X01', type: 'Admin' } as any;

      const result = DefineAccessClassFilterChipsUtils.removeFilterByChipKey(filters, 'code');

      expect(result).not.toBeNull();
      expect(result!.code).toBeNull();
    });

    it('should clear status', () => {
      const filters = { status: 'Active', type: 'Admin' } as any;

      const result = DefineAccessClassFilterChipsUtils.removeFilterByChipKey(filters, 'status');

      expect(result).not.toBeNull();
      expect(result!.status).toBeNull();
    });

    it('should clear effectiveDate and effectiveDatePeriod together', () => {
      const filters = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: '2025-01-01',
        type: 'Admin'
      } as any;

      const result = DefineAccessClassFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectiveDatePeriod).toBeNull();
    });

    it('should clear terminationDate and terminationDatePeriod together', () => {
      const filters = {
        terminationDatePeriod: 'BEFORE',
        terminationDate: '2025-12-31',
        type: 'Admin'
      } as any;

      const result = DefineAccessClassFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationDatePeriod).toBeNull();
    });

    it('should return null when all filters are cleared', () => {
      const filters = { type: 'Admin' } as any;

      const result = DefineAccessClassFilterChipsUtils.removeFilterByChipKey(filters, 'type');

      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters = { type: 'Admin', code: 'X01' } as any;
      const original = { ...filters };

      DefineAccessClassFilterChipsUtils.removeFilterByChipKey(filters, 'type');

      expect(filters).toEqual(original);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(DefineAccessClassFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when all fields are null/falsy', () => {
      const filters = {
        type: null,
        code: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
        status: null
      } as any;

      expect(DefineAccessClassFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when type is set', () => {
      expect(DefineAccessClassFilterChipsUtils.hasActiveFilters({ type: 'Admin' } as any)).toBe(true);
    });

    it('should return true when code is set', () => {
      expect(DefineAccessClassFilterChipsUtils.hasActiveFilters({ code: 'X01' } as any)).toBe(true);
    });

    it('should return true when status is set', () => {
      expect(DefineAccessClassFilterChipsUtils.hasActiveFilters({ status: 'Active' } as any)).toBe(true);
    });

    it('should return true when effectiveDate pair is complete', () => {
      expect(DefineAccessClassFilterChipsUtils.hasActiveFilters({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: '2025-01-01'
      } as any)).toBe(true);
    });

    it('should return false when only effectiveDatePeriod is set without effectiveDate', () => {
      expect(DefineAccessClassFilterChipsUtils.hasActiveFilters({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null
      } as any)).toBe(false);
    });

    it('should return true when terminationDate pair is complete', () => {
      expect(DefineAccessClassFilterChipsUtils.hasActiveFilters({
        terminationDatePeriod: 'BEFORE',
        terminationDate: '2025-12-31'
      } as any)).toBe(true);
    });
  });
});
