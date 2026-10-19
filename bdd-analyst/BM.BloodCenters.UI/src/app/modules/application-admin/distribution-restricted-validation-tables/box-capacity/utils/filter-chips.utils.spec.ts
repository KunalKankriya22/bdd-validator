import { BoxCapacityFilterChipsUtils } from './filter-chips.utils';
import { BoxCapacityFilterValue } from '../models/box-capacity.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

describe('BoxCapacityFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array when filters is empty', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should convert box type filter to chip', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: '26',
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'boxType',
          label: 'Box Type: 26',
          value: '26'
        }
      ]);
    });

    it('should convert inventory product type filter to chip', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: 'CRYO',
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'inventoryProductType',
          label: 'Inventory Product Type: CRYO',
          value: 'CRYO'
        }
      ]);
    });

    it('should convert capacity over filter to chip', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: 'Over',
        capacity: 20,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'capacity',
          label: 'Capacity ≥ 20',
          value: '20'
        }
      ]);
    });

    it('should convert capacity under filter to chip', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: 'Under',
        capacity: 50,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'capacity',
          label: 'Capacity ≤ 50',
          value: '50'
        }
      ]);
    });

    it('should not create capacity chip when capacity is null', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: 'Over',
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should convert effective date after filter to chip', () => {
      const date = new Date('2024-01-15');
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: 'After',
        effectiveDate: date,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'effectiveDate',
          label: 'Effective Date ≥ 15-JAN-2024',
          value: '15-JAN-2024'
        }
      ]);
    });

    it('should convert effective date before filter to chip', () => {
      const date = new Date('2024-12-31');
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: date,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'effectiveDate',
          label: 'Effective Date ≤ 31-DEC-2024',
          value: '31-DEC-2024'
        }
      ]);
    });

    it('should not create effective date chip when date is null', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });

    it('should convert termination date after filter to chip', () => {
      const date = new Date('2025-06-30');
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'After',
        terminationDate: date
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'terminationDate',
          label: 'Termination Date ≥ 30-JUN-2025',
          value: '30-JUN-2025'
        }
      ]);
    });

    it('should convert termination date before filter to chip', () => {
      const date = new Date('2025-03-15');
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: date
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'terminationDate',
          label: 'Termination Date ≤ 15-MAR-2025',
          value: '15-MAR-2025'
        }
      ]);
    });

    it('should not create termination date chip when date is null', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'After',
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([]);
    });


    it('should handle capacity value of 0', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: 'Over',
        capacity: 0,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(result).toEqual([
        {
          key: 'capacity',
          label: 'Capacity ≥ 0',
          value: '0'
        }
      ]);
    });
  });

  describe('removeFilterByChipKey', () => {







    it('should keep other filters when removing one', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacityRange: 'Over',
        capacity: 20,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.removeFilterByChipKey(filters, 'capacity');

      expect(result).toEqual({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
    });


  });

  describe('hasActiveFilters', () => {


    it('should return true when box type filter is set', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: '26',
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });

    it('should return true when inventory product type filter is set', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: 'CRYO',
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });

    it('should return true when capacity filter is set', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: 'Over',
        capacity: 20,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });

    it('should return false when capacity range is set but capacity is null', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: 'Over',
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeFalse();
    });

    it('should return true when capacity is 0', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: 'Over',
        capacity: 0,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });

    it('should return true when effective date filter is set', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = BoxCapacityFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });


    it('should return true when termination date filter is set', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const result = BoxCapacityFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });


  });

  describe('Edge Cases', () => {
    it('should handle empty string for box type', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: '',
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);
      const hasActive = BoxCapacityFilterChipsUtils.hasActiveFilters(filters);

      expect(chips.length).toBe(0);
      expect(hasActive).toBeFalse();
    });

    it('should handle negative capacity value', () => {
      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: 'Over',
        capacity: -10,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].value).toBe('-10');
    });

  });
});
