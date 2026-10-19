import { CheckInBatchFilterChipsUtils } from './filter-chips.utils';
import { CheckInBatchFilterValue } from '../models/modify-check-in-batch.model';
import moment from 'moment';

describe('CheckInBatchFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(CheckInBatchFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when no filters are set', () => {
      const filters = {} as CheckInBatchFilterValue;
      expect(CheckInBatchFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for productType', () => {
      const filters = { productType: 'RBC' } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'productType',
        label: 'Product Type: RBC',
        value: 'RBC',
      });
    });

    it('should create chip for checkInUserId', () => {
      const filters = { checkInUserId: 'USER01' } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'checkInUserId',
        label: 'Check-In User: USER01',
        value: 'USER01',
      });
    });

    it('should create chip for shippedDate when both date and period are set', () => {
      const testDate = moment('2024-01-15');
      const filters = {
        shippedDate: testDate,
        shippedDatePeriod: 'Before',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('shippedDate');
      expect(result[0].label).toContain('Shipped Date');
      expect(result[0].label).toContain('Before');
      expect(result[0].label).toContain('15-JAN-2024');
    });

    it('should not create chip for shippedDate when period is missing', () => {
      const filters = {
        shippedDate: moment('2024-01-15'),
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should create chip for receivedDate when both date and period are set', () => {
      const testDate = moment('2024-03-20');
      const filters = {
        receivedDate: testDate,
        receivedDatePeriod: 'After',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('receivedDate');
      expect(result[0].label).toContain('Received Date');
      expect(result[0].label).toContain('After');
      expect(result[0].label).toContain('20-MAR-2024');
    });

    it('should create chip for qcDate when both date and period are set', () => {
      const testDate = moment('2024-06-10');
      const filters = {
        qcDate: testDate,
        qcDatePeriod: 'Before',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('qcDate');
      expect(result[0].label).toContain('QC Date');
    });

    it('should create chip for batchDate when both date and period are set', () => {
      const testDate = moment('2024-12-25');
      const filters = {
        batchDate: testDate,
        batchDatePeriod: 'After',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('batchDate');
      expect(result[0].label).toContain('Batch Date');
      expect(result[0].label).toContain('25-DEC-2024');
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        productType: 'RBC',
        checkInUserId: 'USER01',
        shippedDate: moment('2024-01-15'),
        shippedDatePeriod: 'Before',
        receivedDate: moment('2024-03-20'),
        receivedDatePeriod: 'After',
        qcDate: moment('2024-06-10'),
        qcDatePeriod: 'Before',
        batchDate: moment('2024-12-25'),
        batchDatePeriod: 'After',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(6);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(CheckInBatchFilterChipsUtils.removeFilterByChipKey(null, 'productType')).toBeNull();
    });

    it('should delete productType when removing productType chip', () => {
      const filters = {
        productType: 'RBC',
        checkInUserId: 'USER01',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.removeFilterByChipKey(filters, 'productType');

      expect(result).not.toBeNull();
      expect(result!.productType).toBeUndefined();
      expect(result!.checkInUserId).toBe('USER01');
    });

    it('should delete checkInUserId when removing checkInUserId chip', () => {
      const filters = {
        productType: 'RBC',
        checkInUserId: 'USER01',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.removeFilterByChipKey(filters, 'checkInUserId');

      expect(result).not.toBeNull();
      expect(result!.checkInUserId).toBeUndefined();
    });

    it('should delete both shippedDate and shippedDatePeriod when removing shippedDate chip', () => {
      const filters = {
        productType: 'RBC',
        shippedDate: moment('2024-01-15'),
        shippedDatePeriod: 'Before',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.removeFilterByChipKey(filters, 'shippedDate');

      expect(result).not.toBeNull();
      expect(result!.shippedDate).toBeUndefined();
      expect(result!.shippedDatePeriod).toBeUndefined();
    });

    it('should delete both receivedDate and receivedDatePeriod when removing receivedDate chip', () => {
      const filters = {
        productType: 'RBC',
        receivedDate: moment('2024-03-20'),
        receivedDatePeriod: 'After',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.removeFilterByChipKey(filters, 'receivedDate');

      expect(result).not.toBeNull();
      expect(result!.receivedDate).toBeUndefined();
      expect(result!.receivedDatePeriod).toBeUndefined();
    });

    it('should delete both qcDate and qcDatePeriod when removing qcDate chip', () => {
      const filters = {
        productType: 'RBC',
        qcDate: moment('2024-06-10'),
        qcDatePeriod: 'Before',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.removeFilterByChipKey(filters, 'qcDate');

      expect(result!.qcDate).toBeUndefined();
      expect(result!.qcDatePeriod).toBeUndefined();
    });

    it('should delete both batchDate and batchDatePeriod when removing batchDate chip', () => {
      const filters = {
        productType: 'RBC',
        batchDate: moment('2024-12-25'),
        batchDatePeriod: 'After',
      } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.removeFilterByChipKey(filters, 'batchDate');

      expect(result!.batchDate).toBeUndefined();
      expect(result!.batchDatePeriod).toBeUndefined();
    });

    it('should return null when removing last filter', () => {
      const filters = { productType: 'RBC' } as CheckInBatchFilterValue;
      const result = CheckInBatchFilterChipsUtils.removeFilterByChipKey(filters, 'productType');

      expect(result).toBeNull();
    });

    it('should not mutate original filters', () => {
      const filters = {
        productType: 'RBC',
        checkInUserId: 'USER01',
      } as CheckInBatchFilterValue;
      CheckInBatchFilterChipsUtils.removeFilterByChipKey(filters, 'productType');

      expect(filters.productType).toBe('RBC');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(CheckInBatchFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when filters object is empty', () => {
      expect(CheckInBatchFilterChipsUtils.hasActiveFilters({} as CheckInBatchFilterValue)).toBe(false);
    });

    it('should return true when any filter key exists', () => {
      const filters = { productType: 'RBC' } as CheckInBatchFilterValue;
      expect(CheckInBatchFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
