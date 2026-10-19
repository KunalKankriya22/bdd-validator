import { buildEmfFilterChips } from './filter-chips.utils';
import { ProcessCodesFilterValue } from '../emf-processes';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

describe('filter-chips.utils (EMF Processes)', () => {
  describe('buildEmfFilterChips', () => {
    it('should return an empty array when no date filters are set', () => {
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = buildEmfFilterChips(filters);

      expect(result).toEqual([]);
    });

    it('should return chips for all populated filters', () => {
      const effDate = new Date(2025, 0, 15);
      const termDate = new Date(2025, 5, 30);
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: effDate,
        terminationDatePeriod: 'before',
        terminationDate: termDate
      };

      const result = buildEmfFilterChips(filters);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        key: 'effectiveDate',
        label: `Effective Date ≥ ${moment(effDate).format('DD-MMM-YYYY').toUpperCase()}`,
        value: effDate,
        removable: true
      });
      expect(result[1]).toEqual({
        key: 'terminationDate',
        label: `Termination Date ≤ ${moment(termDate).format('DD-MMM-YYYY').toUpperCase()}`,
        value: termDate,
        removable: true
      });
    });

    it('should return only effectiveDate chip when terminationDate is not set', () => {
      const effDate = new Date(2025, 3, 10);
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: 'before',
        effectiveDate: effDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = buildEmfFilterChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('≤');
    });

    it('should return only terminationDate chip when effectiveDate is not set', () => {
      const termDate = new Date(2025, 11, 25);
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: termDate
      };

      const result = buildEmfFilterChips(filters);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('≥');
    });

    it('should not create chip when effectiveDate is set but effectiveDatePeriod is null', () => {
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: new Date(2025, 0, 1),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = buildEmfFilterChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create chip when effectiveDatePeriod is set but effectiveDate is null', () => {
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = buildEmfFilterChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create chip when terminationDate is set but terminationDatePeriod is null', () => {
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: new Date(2025, 5, 1)
      };

      const result = buildEmfFilterChips(filters);

      expect(result).toEqual([]);
    });

    it('should not create chip when terminationDatePeriod is set but terminationDate is null', () => {
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: null
      };

      const result = buildEmfFilterChips(filters);

      expect(result).toEqual([]);
    });
  });

  describe('periodToOperator (tested indirectly)', () => {
    it('should use >= operator for "after" period', () => {
      const date = new Date(2025, 0, 1);
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: date,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = buildEmfFilterChips(filters);

      expect(result[0].label).toContain('≥');
    });

    it('should use <= operator for "before" period', () => {
      const date = new Date(2025, 0, 1);
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: 'before',
        effectiveDate: date,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = buildEmfFilterChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should use = operator for unknown period values', () => {
      const date = new Date(2025, 0, 1);
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: 'exact',
        effectiveDate: date,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = buildEmfFilterChips(filters);

      expect(result[0].label).toContain('Effective Date =');
    });

    it('should handle case-insensitive period values (uppercase "After")', () => {
      const date = new Date(2025, 0, 1);
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: 'After',
        effectiveDate: date,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = buildEmfFilterChips(filters);

      expect(result[0].label).toContain('≥');
    });
  });
});
