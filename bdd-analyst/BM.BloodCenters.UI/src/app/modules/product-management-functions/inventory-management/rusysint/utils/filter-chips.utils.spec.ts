import { ReleaseProductQuarantineFilterChipsUtils } from './filter-chips.utils';
import { FilterValue, ProductCodeLOV, BloodTypeLOV, WarehouseLOV } from '../models/release-product-quarantine.model';
import moment from 'moment';

describe('ReleaseProductQuarantineFilterChipsUtils', () => {
  const mockProductCodeOptions: ProductCodeLOV[] = [
    { productCode: 'RBC', productDesc: 'Red Blood Cells' },
    { productCode: 'PLT', productDesc: 'Platelets' }
  ];

  const mockBloodTypeOptions: BloodTypeLOV[] = [
    { bloodType: 'O', aboDesc: 'O Positive' },
    { bloodType: 'A', aboDesc: 'A Positive' }
  ];

  const mockWarehouseOptions: WarehouseLOV[] = [
    { warehouseId: 'W01', warehouseDesc: 'Main Warehouse' },
    { warehouseId: 'W02', warehouseDesc: 'Secondary Warehouse' }
  ];

  describe('createFilterChips', () => {
    it('should create chips for all filter values', () => {
      const filters: FilterValue = {
        productCode: 'RBC',
        bloodType: 'O',
        warehouseId: 'W01',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31')
      };

      const chips = ReleaseProductQuarantineFilterChipsUtils.createFilterChips(
        filters,
        mockProductCodeOptions,
        mockBloodTypeOptions,
        mockWarehouseOptions
      );

      expect(chips.length).toBe(5);
      expect(chips[0].label).toBe('Product Code');
      expect(chips[0].value).toBe('RBC - Red Blood Cells');
      expect(chips[1].label).toBe('Blood Type');
      expect(chips[1].value).toBe('O - O Positive');
      expect(chips[2].label).toBe('Warehouse');
      expect(chips[2].value).toBe('W01 - Main Warehouse');
      expect(chips[3].label).toBe('From Date');
      expect(chips[4].label).toBe('To Date');
    });

    it('should create chip for product code only', () => {
      const filters: FilterValue = {
        productCode: 'RBC'
      };

      const chips = ReleaseProductQuarantineFilterChipsUtils.createFilterChips(
        filters,
        mockProductCodeOptions,
        mockBloodTypeOptions,
        mockWarehouseOptions
      );

      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Product Code');
      expect(chips[0].key).toBe('productCode');
    });

    it('should format dates correctly in DD-MMM-YYYY format', () => {
      const filters: FilterValue = {
        fromDate: new Date('2024-03-15'),
        toDate: new Date('2024-06-20')
      };

      const chips = ReleaseProductQuarantineFilterChipsUtils.createFilterChips(
        filters,
        mockProductCodeOptions,
        mockBloodTypeOptions,
        mockWarehouseOptions
      );

      expect(chips.length).toBe(2);
      expect(chips[0].value).toBe('15-MAR-2024');
      expect(chips[1].value).toBe('20-JUN-2024');
    });


    it('should return empty array for empty filters', () => {
      const filters: FilterValue = {};

      const chips = ReleaseProductQuarantineFilterChipsUtils.createFilterChips(
        filters,
        mockProductCodeOptions,
        mockBloodTypeOptions,
        mockWarehouseOptions
      );

      expect(chips.length).toBe(0);
    });

  });

  describe('removeFilter', () => {



    it('should remove from date filter', () => {
      const filters: FilterValue = {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31')
      };

      const newFilters = ReleaseProductQuarantineFilterChipsUtils.removeFilter(filters, 'fromDate');

      expect(newFilters.fromDate).toBeUndefined();
      expect(newFilters.toDate).toBeDefined();
    });

    it('should remove to date filter', () => {
      const filters: FilterValue = {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31')
      };

      const newFilters = ReleaseProductQuarantineFilterChipsUtils.removeFilter(filters, 'toDate');

      expect(newFilters.toDate).toBeUndefined();
      expect(newFilters.fromDate).toBeDefined();
    });

  });
});
