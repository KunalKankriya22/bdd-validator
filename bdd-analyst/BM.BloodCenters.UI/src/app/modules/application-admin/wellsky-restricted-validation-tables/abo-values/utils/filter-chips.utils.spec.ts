import { AboValuesFilterChipsUtils } from './filter-chips.utils';
import { AboValuesFilterValue } from '../models/abo-values.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('AboValuesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert intendedUse filter to chip', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: 'Transfusion',
        unitScheme: null,
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'intendedUse',
        label: 'Intended Use: Transfusion',
        value: 'Transfusion',
        removable: true
      });
    });

    it('should convert unitScheme filter to chip', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: null,
        unitScheme: 'Component',
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'unitScheme',
        label: 'Unit Scheme: Component',
        value: 'Component',
        removable: true
      });
    });

    it('should convert transfusionStatus filter to chip', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: null,
        unitScheme: null,
        transfusionStatus: 'Eligible',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'transfusionStatus',
        label: 'Transfusion Status: Eligible',
        value: 'Eligible',
        removable: true
      });
    });

    it('should convert effectiveDate filter to chip when both date and period are present', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: null,
        unitScheme: null,
        transfusionStatus: null,
        effectiveDatePeriod: 'On or After',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'effectiveDate',
        label: 'Effective Date ≥ 01-JAN-2024',
        value: '2024-01-01',
        removable: true
      });
    });

    it('should not convert effectiveDate filter when period is missing', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: null,
        unitScheme: null,
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: '2024-01-01',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should convert terminationDate filter to chip when both date and period are present', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: null,
        unitScheme: null,
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'On or Before',
        terminationDate: '2024-12-31'
      };

      const result = AboValuesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'terminationDate',
        label: 'Termination Date ≤ 31-DEC-2024',
        value: '2024-12-31',
        removable: true
      });
    });



  });

  describe('removeFilterByChipKey', () => {

    it('should remove intendedUse filter', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.removeFilterByChipKey(filters, 'intendedUse');

      expect(result).not.toBeNull();
      expect(result?.intendedUse).toBeNull();
      expect(result?.unitScheme).toBe('Component');
    });

    it('should remove unitScheme filter', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.removeFilterByChipKey(filters, 'unitScheme');

      expect(result).not.toBeNull();
      expect(result?.unitScheme).toBeNull();
      expect(result?.intendedUse).toBe('Transfusion');
    });


    it('should remove effectiveDate and effectiveDatePeriod', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: 'Transfusion',
        unitScheme: null,
        transfusionStatus: null,
        effectiveDatePeriod: 'On or After',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result?.effectiveDate).toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
      expect(result?.intendedUse).toBe('Transfusion');
    });

    it('should remove terminationDate and terminationDatePeriod', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: 'Transfusion',
        unitScheme: null,
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'On or Before',
        terminationDate: '2024-12-31'
      };

      const result = AboValuesFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result?.terminationDate).toBeNull();
      expect(result?.terminationDatePeriod).toBeNull();
      expect(result?.intendedUse).toBe('Transfusion');
    });

  });

  describe('hasActiveFilters', () => {


    it('should return true when intendedUse is set', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: 'Transfusion',
        unitScheme: null,
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when unitScheme is set', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: null,
        unitScheme: 'Component',
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when transfusionStatus is set', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: null,
        unitScheme: null,
        transfusionStatus: 'Eligible',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = AboValuesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });



  });
});
