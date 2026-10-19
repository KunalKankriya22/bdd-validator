import { ValidReagentSupplierCodeFilterChipsUtils } from './filter-chips.utils';
import { ValidReagentSupplierCodeFilterValue } from '../filter-panel/valid-reagent-supplier-code-filter-panel';
import moment from 'moment';

describe('ValidReagentSupplierCodeFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when no filters are set', () => {
      const filters = {} as ValidReagentSupplierCodeFilterValue;
      expect(ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for showTerminated with Y value', () => {
      const filters = { showTerminated: 'Y' } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'showTerminated',
        label: 'Show Terminated: Yes',
        value: 'Y',
      });
    });

    it('should create chip for showTerminated with N value', () => {
      const filters = { showTerminated: 'N' } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].label).toBe('Show Terminated: No');
    });

    it('should not create chip for showTerminated when undefined', () => {
      const filters = { showTerminated: undefined } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should not create chip for showTerminated when null', () => {
      const filters = { showTerminated: null } as unknown as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should create chip for effectiveDate with After period showing >= symbol', () => {
      const testDate = moment('2024-05-20');
      const filters = {
        effectiveDate: testDate,
        effectiveDatePeriod: 'After',
      } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date');
      expect(result[0].label).toContain('≥');
      expect(result[0].label).toContain('20-MAY-2024');
    });

    it('should create chip for effectiveDate with Before period showing <= symbol', () => {
      const testDate = moment('2024-05-20');
      const filters = {
        effectiveDate: testDate,
        effectiveDatePeriod: 'Before',
      } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should not create chip for effectiveDate when period is missing', () => {
      const filters = {
        effectiveDate: moment('2024-05-20'),
      } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

      const effChip = result.find(c => c.key === 'effectiveDate');
      expect(effChip).toBeUndefined();
    });

    it('should create chip for terminationDate with After period', () => {
      const testDate = moment('2025-11-30');
      const filters = {
        terminationDate: testDate,
        terminationDatePeriod: 'After',
      } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date');
      expect(result[0].label).toContain('≥');
    });

    it('should create chip for terminationDate with Before period', () => {
      const testDate = moment('2025-11-30');
      const filters = {
        terminationDate: testDate,
        terminationDatePeriod: 'Before',
      } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        showTerminated: 'Y',
        effectiveDate: moment('2024-01-01'),
        effectiveDatePeriod: 'After',
        terminationDate: moment('2025-12-31'),
        terminationDatePeriod: 'Before',
      } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(3);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(ValidReagentSupplierCodeFilterChipsUtils.removeFilterByChipKey(null, 'showTerminated')).toBeNull();
    });

    it('should set showTerminated to undefined when removing showTerminated chip', () => {
      const filters = {
        showTerminated: 'Y',
        effectiveDate: moment('2024-01-01'),
        effectiveDatePeriod: 'After',
      } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.removeFilterByChipKey(filters, 'showTerminated');

      expect(result).not.toBeNull();
      expect(result!.showTerminated).toBeUndefined();
    });

    it('should set effectiveDate fields to undefined when removing effectiveDate chip', () => {
      const filters = {
        showTerminated: 'Y',
        effectiveDate: moment('2024-01-01'),
        effectiveDatePeriod: 'After',
      } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeUndefined();
      expect(result!.effectiveDatePeriod).toBeUndefined();
    });

    it('should set terminationDate fields to undefined when removing terminationDate chip', () => {
      const filters = {
        showTerminated: 'Y',
        terminationDate: moment('2025-12-31'),
        terminationDatePeriod: 'Before',
      } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeUndefined();
      expect(result!.terminationDatePeriod).toBeUndefined();
    });

    it('should return null when removing last active filter', () => {
      const filters = {
        showTerminated: 'Y',
      } as ValidReagentSupplierCodeFilterValue;
      const result = ValidReagentSupplierCodeFilterChipsUtils.removeFilterByChipKey(filters, 'showTerminated');

      expect(result).toBeNull();
    });

    it('should not mutate original filters', () => {
      const filters = {
        showTerminated: 'Y',
        effectiveDate: moment('2024-01-01'),
        effectiveDatePeriod: 'After',
      } as ValidReagentSupplierCodeFilterValue;
      ValidReagentSupplierCodeFilterChipsUtils.removeFilterByChipKey(filters, 'showTerminated');

      expect(filters.showTerminated).toBe('Y');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(ValidReagentSupplierCodeFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters = {
        showTerminated: undefined,
        effectiveDate: undefined,
        terminationDate: undefined,
      } as ValidReagentSupplierCodeFilterValue;
      expect(ValidReagentSupplierCodeFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when showTerminated is set (not null/undefined)', () => {
      const filters = { showTerminated: 'N' } as ValidReagentSupplierCodeFilterValue;
      expect(ValidReagentSupplierCodeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDate is set', () => {
      const filters = {
        effectiveDate: moment('2024-01-01'),
        effectiveDatePeriod: 'After',
      } as ValidReagentSupplierCodeFilterValue;
      expect(ValidReagentSupplierCodeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when terminationDate is set', () => {
      const filters = {
        terminationDate: moment('2025-12-31'),
        terminationDatePeriod: 'Before',
      } as ValidReagentSupplierCodeFilterValue;
      expect(ValidReagentSupplierCodeFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when showTerminated is null', () => {
      const filters = {
        showTerminated: null,
      } as unknown as ValidReagentSupplierCodeFilterValue;
      expect(ValidReagentSupplierCodeFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
