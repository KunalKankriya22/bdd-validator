import { ValidRemoteTestingLabsFilterChipsUtils } from './filter-chips.utils';
import { ValidRemoteTestingLabFilterValue } from '../models/valid-remote-testing-labs.model';

describe('ValidRemoteTestingLabsFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when no filters are set', () => {
      const filters = {} as ValidRemoteTestingLabFilterValue;
      expect(ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for effectiveDate with AFTER period showing >= symbol', () => {
      const testDate = '2024-03-15';
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDate: testDate,
      } as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date');
      expect(result[0].label).toContain('≥');
    });

    it('should create chip for effectiveDate with Before period showing <= symbol', () => {
      const testDate = '2024-03-15';
      const filters = {
        effectiveDatePeriod: 'Before',
        effectiveDate: testDate,
      } as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].label).toContain('≤');
    });

    it('should not create chip for effectiveDate when period is missing', () => {
      const filters = {
        effectiveDate: '2024-03-15',
      } as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should not create chip for effectiveDate when date is missing', () => {
      const filters = {
        effectiveDatePeriod: 'After',
      } as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should create chip for terminationDate with AFTER period showing >= symbol', () => {
      const testDate = '2025-06-30';
      const filters = {
        terminationDatePeriod: 'AFTER',
        terminationDate: testDate,
      } as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date');
      expect(result[0].label).toContain('≥');
    });

    it('should create chip for terminationDate with Before period showing <= symbol', () => {
      const testDate = '2025-06-30';
      const filters = {
        terminationDatePeriod: 'Before',
        terminationDate: testDate,
      } as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].label).toContain('≤');
    });

    it('should include both period and date in chip value for effectiveDate', () => {
      const testDate = '2024-03-15';
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDate: testDate,
      } as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].value).toEqual({
        period: 'After',
        date: testDate,
      });
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31',
      } as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(2);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[1].key).toBe('terminationDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(ValidRemoteTestingLabsFilterChipsUtils.removeFilterByChipKey(null, 'effectiveDate')).toBeNull();
    });

    it('should set effectiveDate and effectiveDatePeriod to null when removing effectiveDate chip', () => {
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31',
      } as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectiveDatePeriod).toBeNull();
      expect(result!.terminationDate).toBe('2025-12-31');
    });

    it('should set terminationDate and terminationDatePeriod to null when removing terminationDate chip', () => {
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31',
      } as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationDatePeriod).toBeNull();
      expect(result!.effectiveDate).toBe('2024-01-01');
    });

    it('should return null when removing last active filter', () => {
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: null,
        terminationDate: null,
      } as unknown as ValidRemoteTestingLabFilterValue;
      const result = ValidRemoteTestingLabsFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).toBeNull();
    });

    it('should not mutate original filters', () => {
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31',
      } as ValidRemoteTestingLabFilterValue;
      ValidRemoteTestingLabsFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(filters.effectiveDate).toBe('2024-01-01');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(ValidRemoteTestingLabsFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      } as unknown as ValidRemoteTestingLabFilterValue;
      expect(ValidRemoteTestingLabsFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effectiveDate pair is set', () => {
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDate: '2024-01-01',
      } as ValidRemoteTestingLabFilterValue;
      expect(ValidRemoteTestingLabsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when terminationDate pair is set', () => {
      const filters = {
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31',
      } as ValidRemoteTestingLabFilterValue;
      expect(ValidRemoteTestingLabsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only period is set without date', () => {
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDate: null,
      } as unknown as ValidRemoteTestingLabFilterValue;
      expect(ValidRemoteTestingLabsFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
