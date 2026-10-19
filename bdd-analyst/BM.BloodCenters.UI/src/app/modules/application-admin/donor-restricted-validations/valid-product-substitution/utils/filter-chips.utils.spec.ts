import { ValidProductSubstitutionFilterChipsUtils } from './filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidProductSubstitutionFilterValue } from '../models/valid-product-substitution.model';
import moment from 'moment';

describe('ValidProductSubstitutionFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert requestProductType filter to chip', () => {
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: 'WRBC',
        compatibleProductType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'requestProductType',
        label: 'Requested: WRBC',
        value: 'WRBC'
      });
    });

    it('should convert compatibleProductType filter to chip', () => {
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: null,
        compatibleProductType: 'LRBC',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'compatibleProductType',
        label: 'Compatible: LRBC',
        value: 'LRBC'
      });
    });

    it('should NOT convert effectiveDate filter to chip without period', () => {
      const tomorrow = moment().add(1, 'day').toDate();
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: null,
        compatibleProductType: null,
        effectiveDatePeriod: null,
        effectiveDate: tomorrow,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should convert effectiveDate filter to chip with period', () => {
      const tomorrow = moment().add(1, 'day').toDate();
      const expectedDateStr = moment(tomorrow).format('DD-MMM-YYYY');
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: null,
        compatibleProductType: null,
        effectiveDatePeriod: 'After',
        effectiveDate: tomorrow,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date ≥');
      expect(result[0].label).toContain(expectedDateStr);
    });

    it('should NOT convert terminationDate filter to chip without period', () => {
      const nextMonth = moment().add(1, 'month').toDate();
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: null,
        compatibleProductType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: nextMonth
      };

      const result = ValidProductSubstitutionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should convert terminationDate filter to chip with period', () => {
      const nextMonth = moment().add(1, 'month').toDate();
      const expectedDateStr = moment(nextMonth).format('DD-MMM-YYYY');
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: null,
        compatibleProductType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: nextMonth
      };

      const result = ValidProductSubstitutionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date ≤');
      expect(result[0].label).toContain(expectedDateStr);
    });


    it('should handle null date in effectiveDate filter', () => {
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: null,
        compatibleProductType: null,
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove requestProductType filter', () => {
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.removeFilterByChipKey(filters, 'requestProductType');

      expect(result).not.toBeNull();
      expect(result!.requestProductType).toBeNull();
      expect(result!.compatibleProductType).toBe('LRBC');
    });

    it('should remove compatibleProductType filter', () => {
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.removeFilterByChipKey(filters, 'compatibleProductType');

      expect(result).not.toBeNull();
      expect(result!.requestProductType).toBe('WRBC');
      expect(result!.compatibleProductType).toBeNull();
    });

    it('should remove effectiveDate and effectiveDatePeriod filters', () => {
      const tomorrow = moment().add(1, 'day').toDate();
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: 'WRBC',
        compatibleProductType: null,
        effectiveDatePeriod: 'After',
        effectiveDate: tomorrow,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectiveDatePeriod).toBeNull();
      expect(result!.requestProductType).toBe('WRBC');
    });

    it('should remove terminationDate and terminationDatePeriod filters', () => {
      const nextMonth = moment().add(1, 'month').toDate();
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: null,
        compatibleProductType: 'LRBC',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: nextMonth
      };

      const result = ValidProductSubstitutionFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationDatePeriod).toBeNull();
      expect(result!.compatibleProductType).toBe('LRBC');
    });


    it('should preserve other filters when removing one', () => {
      const tomorrow = moment().add(1, 'day').toDate();
      const nextMonth = moment().add(1, 'month').toDate();
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDatePeriod: 'After',
        effectiveDate: tomorrow,
        terminationDatePeriod: 'Before',
        terminationDate: nextMonth
      };

      const result = ValidProductSubstitutionFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.requestProductType).toBe('WRBC');
      expect(result!.compatibleProductType).toBe('LRBC');
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectiveDatePeriod).toBeNull();
      expect(result!.terminationDate).toEqual(filters.terminationDate);
      expect(result!.terminationDatePeriod).toBe('Before');
    });
  });

  describe('hasActiveFilters', () => {


    it('should return true when requestProductType is set', () => {
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: 'WRBC',
        compatibleProductType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when compatibleProductType is set', () => {
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: null,
        compatibleProductType: 'LRBC',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when effectiveDatePeriod is set', () => {
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: null,
        compatibleProductType: null,
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });


    it('should return true when terminationDatePeriod is set', () => {
      const filters: ValidProductSubstitutionFilterValue = {
        requestProductType: null,
        compatibleProductType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: null
      };

      const result = ValidProductSubstitutionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });


  });
});
