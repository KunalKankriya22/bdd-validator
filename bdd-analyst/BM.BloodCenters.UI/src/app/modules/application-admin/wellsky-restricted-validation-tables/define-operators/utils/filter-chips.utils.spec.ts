import { DefineOperatorsFilterChipsUtils } from './filter-chips.utils';
import { ValidOperatorFilterValue } from '../models/define-operators.model';

describe('DefineOperatorsFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array for filters with all null values', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineOperatorsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create chip for valueStyle with display label', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: 'S',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineOperatorsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('valueStyle');
      expect(result[0].label).toBe('Values: Single');
      expect(result[0].value).toBe('S');
    });

    it('should map all value style codes to display labels', () => {
      const codes = ['S', 'R', 'M', 'X'];
      const labels = ['Single', 'Range', 'Multiple', 'Mixed'];

      codes.forEach((code, index) => {
        const filters: ValidOperatorFilterValue = {
          valueStyle: code,
          effectiveDate: null,
          effectiveDatePeriod: null,
          terminationDate: null,
          terminationDatePeriod: null
        };

        const result = DefineOperatorsFilterChipsUtils.convertFiltersToChips(filters);
        expect(result[0].label).toBe(`Values: ${labels[index]}`);
      });
    });

    it('should create chip for effectiveDate with Before period', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: null,
        effectiveDate: '2028-01-15T00:00:00Z',
        effectiveDatePeriod: 'BEFORE',
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineOperatorsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date ≤');
      expect(result[0].value).toBe('2028-01-15T00:00:00Z');
    });

    it('should create chip for effectiveDate with After period', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: null,
        effectiveDate: '2028-06-01T00:00:00Z',
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineOperatorsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date ≥');
    });

    it('should NOT create chip for effectiveDate without period', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: null,
        effectiveDate: '2028-01-15T00:00:00Z',
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineOperatorsFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

    it('should create chip for terminationDate with period', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: '2028-12-31T00:00:00Z',
        terminationDatePeriod: 'BEFORE'
      };

      const result = DefineOperatorsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date ≤');
    });

    it('should create chips for all active filters', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: 'R',
        effectiveDate: '2028-01-01T00:00:00Z',
        effectiveDatePeriod: 'AFTER',
        terminationDate: '2028-12-31T00:00:00Z',
        terminationDatePeriod: 'BEFORE'
      };

      const result = DefineOperatorsFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(3);
      expect(result[0].key).toBe('valueStyle');
      expect(result[1].key).toBe('effectiveDate');
      expect(result[2].key).toBe('terminationDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should remove valueStyle filter', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: 'S',
        effectiveDate: '2028-01-01T00:00:00Z',
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineOperatorsFilterChipsUtils.removeFilterByChipKey(filters, 'valueStyle');

      expect(result?.valueStyle).toBeNull();
      expect(result?.effectiveDate).toBe('2028-01-01T00:00:00Z');
      expect(result?.effectiveDatePeriod).toBe('AFTER');
    });

    it('should remove effectiveDate and effectiveDatePeriod together', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: 'R',
        effectiveDate: '2028-01-01T00:00:00Z',
        effectiveDatePeriod: 'BEFORE',
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = DefineOperatorsFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result?.effectiveDate).toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
      expect(result?.valueStyle).toBe('R');
    });

    it('should remove terminationDate and terminationDatePeriod together', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: 'S',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: '2028-12-31T00:00:00Z',
        terminationDatePeriod: 'AFTER'
      };

      const result = DefineOperatorsFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result?.terminationDate).toBeNull();
      expect(result?.terminationDatePeriod).toBeNull();
      expect(result?.valueStyle).toBe('S');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false for all null values', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      expect(DefineOperatorsFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when valueStyle has value', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: 'S',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      expect(DefineOperatorsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDate and period have values', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: null,
        effectiveDate: '2028-01-01T00:00:00Z',
        effectiveDatePeriod: 'BEFORE',
        terminationDate: null,
        terminationDatePeriod: null
      };

      expect(DefineOperatorsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work correctly in a filter -> chip -> remove flow', () => {
      const filters: ValidOperatorFilterValue = {
        valueStyle: 'S',
        effectiveDate: '2028-06-01T00:00:00Z',
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null
      };

      const chips = DefineOperatorsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(2);

      const updatedFilters = DefineOperatorsFilterChipsUtils.removeFilterByChipKey(filters, 'valueStyle');
      const updatedChips = DefineOperatorsFilterChipsUtils.convertFiltersToChips(updatedFilters);
      expect(updatedChips.length).toBe(1);
      expect(updatedChips[0].key).toBe('effectiveDate');
    });

    it('should correctly identify when all filters are cleared', () => {
      let filters: ValidOperatorFilterValue | null = {
        valueStyle: 'R',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      expect(DefineOperatorsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      filters = DefineOperatorsFilterChipsUtils.removeFilterByChipKey(filters, 'valueStyle');

      expect(filters).toBeNull();
      expect(DefineOperatorsFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
