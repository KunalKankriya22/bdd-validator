import { InternalContractFilterChipsUtils } from './filter-chips.utils';
import { InternalContractFilterValue } from '../internal-contract-filter-panel/internal-contract-filter-panel.component';
import moment from 'moment';

describe('InternalContractFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(InternalContractFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when no filters are set', () => {
      const filters = {} as InternalContractFilterValue;
      expect(InternalContractFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for effectiveDate with Before period showing ≤ symbol', () => {
      const testDate = moment('2024-04-15');
      const filters = {
        effectiveDate: testDate,
        effectivePeriod: 'Before',
      } as InternalContractFilterValue;
      const result = InternalContractFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date');
      expect(result[0].label).toContain('≤');
      expect(result[0].label).toContain('15-APR-2024');
    });

    it('should create chip for effectiveDate with After period showing ≥ symbol', () => {
      const testDate = moment('2024-04-15');
      const filters = {
        effectiveDate: testDate,
        effectivePeriod: 'After',
      } as InternalContractFilterValue;
      const result = InternalContractFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].label).toContain('≥');
    });

    it('should not create chip for effectiveDate when effectivePeriod is missing', () => {
      const filters = {
        effectiveDate: moment('2024-04-15'),
      } as InternalContractFilterValue;
      const result = InternalContractFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should not create chip for effectiveDate when date is missing', () => {
      const filters = {
        effectivePeriod: 'Before',
      } as InternalContractFilterValue;
      const result = InternalContractFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should create chip for terminationDate with Before period showing ≤ symbol', () => {
      const testDate = moment('2025-12-31');
      const filters = {
        terminationDate: testDate,
        terminationPeriod: 'Before',
      } as InternalContractFilterValue;
      const result = InternalContractFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date');
      expect(result[0].label).toContain('≤');
      expect(result[0].label).toContain('31-DEC-2025');
    });

    it('should create chip for terminationDate with After period showing ≥ symbol', () => {
      const testDate = moment('2025-12-31');
      const filters = {
        terminationDate: testDate,
        terminationPeriod: 'After',
      } as InternalContractFilterValue;
      const result = InternalContractFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].label).toContain('≥');
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        effectiveDate: moment('2024-01-01'),
        effectivePeriod: 'After',
        terminationDate: moment('2025-12-31'),
        terminationPeriod: 'Before',
      } as InternalContractFilterValue;
      const result = InternalContractFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(2);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[1].key).toBe('terminationDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(InternalContractFilterChipsUtils.removeFilterByChipKey(null, 'effectiveDate')).toBeNull();
    });

    it('should delete effectiveDate and effectivePeriod when removing effectiveDate chip', () => {
      const filters = {
        effectiveDate: moment('2024-01-01'),
        effectivePeriod: 'After',
        terminationDate: moment('2025-12-31'),
        terminationPeriod: 'Before',
      } as InternalContractFilterValue;
      const result = InternalContractFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeUndefined();
      expect(result!.effectivePeriod).toBeUndefined();
      expect(result!.terminationDate).toBeTruthy();
    });

    it('should delete terminationDate and terminationPeriod when removing terminationDate chip', () => {
      const filters = {
        effectiveDate: moment('2024-01-01'),
        effectivePeriod: 'After',
        terminationDate: moment('2025-12-31'),
        terminationPeriod: 'Before',
      } as InternalContractFilterValue;
      const result = InternalContractFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeUndefined();
      expect(result!.terminationPeriod).toBeUndefined();
      expect(result!.effectiveDate).toBeTruthy();
    });

    it('should return null when removing last filter leaves no active values', () => {
      const filters = {
        effectiveDate: moment('2024-01-01'),
        effectivePeriod: 'After',
      } as InternalContractFilterValue;
      const result = InternalContractFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).toBeNull();
    });

    it('should not mutate original filters', () => {
      const originalDate = moment('2024-01-01');
      const filters = {
        effectiveDate: originalDate,
        effectivePeriod: 'After',
        terminationDate: moment('2025-12-31'),
        terminationPeriod: 'Before',
      } as InternalContractFilterValue;
      InternalContractFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(filters.effectiveDate).toBe(originalDate);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(InternalContractFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when filters object is empty', () => {
      expect(InternalContractFilterChipsUtils.hasActiveFilters({} as InternalContractFilterValue)).toBe(false);
    });

    it('should return true when effectiveDate is set', () => {
      const filters = {
        effectiveDate: moment('2024-01-01'),
        effectivePeriod: 'After',
      } as InternalContractFilterValue;
      expect(InternalContractFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when terminationDate is set', () => {
      const filters = {
        terminationDate: moment('2025-12-31'),
        terminationPeriod: 'Before',
      } as InternalContractFilterValue;
      expect(InternalContractFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when all values are null or undefined', () => {
      const filters = {
        effectiveDate: null,
        effectivePeriod: null,
        terminationDate: undefined,
        terminationPeriod: undefined,
      } as unknown as InternalContractFilterValue;
      expect(InternalContractFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
