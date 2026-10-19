import { SetupInventoryLevelsFilterChipsUtils } from './filter-chips.utils';
import { FilterValue, SetInventoryLevelDisplay } from '../models/setup-inventory-levels.model';

describe('SetupInventoryLevelsFilterChipsUtils', () => {
  const mockTableData: SetInventoryLevelDisplay[] = [
    {
      chapterId: 'CH1',
      customerId: 'C1',
      inventoryClass: 'WB',
      inventoryType: 'MI',
      productType: 'PT01',
      productTypeDesc: 'Product One',
      bloodType: 'A+',
      bloodTypeDesc: 'A Positive',
      attribGroup: 'AG1',
      attribCode: 'AC1',
      tier: null,
      qty: 10,
      effDate: '2025-01-15',
      termDate: null,
      lastModifiedDate: null,
      effDateDisplay: '15-JAN-2025',
      termDateDisplay: null,
      lastModifiedDateDisplay: null
    },
    {
      chapterId: 'CH1',
      customerId: 'C1',
      inventoryClass: 'WB',
      inventoryType: 'OP',
      productType: 'PT02',
      productTypeDesc: 'Product Two',
      bloodType: 'B-',
      bloodTypeDesc: 'B Negative',
      attribGroup: null,
      attribCode: null,
      tier: null,
      qty: 20,
      effDate: '2025-02-01',
      termDate: '2025-12-31',
      lastModifiedDate: null,
      effDateDisplay: '01-FEB-2025',
      termDateDisplay: '31-DEC-2025',
      lastModifiedDateDisplay: null
    }
  ];

  describe('createFilterChips', () => {
    it('should create product type chip with description', () => {
      const filters: FilterValue = { productType: 'PT01' };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters, mockTableData);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('productType');
      expect(chips[0].label).toContain('Product Type: PT01');
      expect(chips[0].label).toContain('Product One');
    });

    it('should create ABORh chip with description', () => {
      const filters: FilterValue = { aborh: 'A+' };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters, mockTableData);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('aborh');
      expect(chips[0].label).toContain('ABORh: A+');
      expect(chips[0].label).toContain('A Positive');
    });

    it('should create attribute chip with group info', () => {
      const filters: FilterValue = { attribute: 'AC1' };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters, mockTableData);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('attribute');
      expect(chips[0].label).toContain('Attribute: AC1');
      expect(chips[0].label).toContain('AG1');
    });

    it('should create effective date chip with After operator', () => {
      const filters: FilterValue = {
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15'
      };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≥');
    });

    it('should create termination date chip with Before operator', () => {
      const filters: FilterValue = {
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31'
      };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('≤');
    });

    it('should create multiple chips for multiple filters', () => {
      const filters: FilterValue = {
        productType: 'PT01',
        aborh: 'A+',
        attribute: 'AC1'
      };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters, mockTableData);
      expect(chips.length).toBe(3);
    });

    it('should return empty array for empty filters', () => {
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips({});
      expect(chips).toEqual([]);
    });

    it('should not create date chip when only period is set without date', () => {
      const filters: FilterValue = { effectiveDatePeriod: 'After' };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create date chip when only date is set without period', () => {
      const filters: FilterValue = { effectiveDate: '2025-01-01' };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should handle product type without table data', () => {
      const filters: FilterValue = { productType: 'PT01' };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips[0].label).toBe('Product Type: PT01');
    });

    it('should handle ABORh without table data', () => {
      const filters: FilterValue = { aborh: 'O+' };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips[0].label).toBe('ABORh: O+');
    });

    it('should handle attribute without matching table data', () => {
      const filters: FilterValue = { attribute: 'UNKNOWN' };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters, mockTableData);
      expect(chips[0].label).toBe('Attribute: UNKNOWN');
    });

    it('should handle attribute without table data', () => {
      const filters: FilterValue = { attribute: 'AC1' };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips[0].label).toBe('Attribute: AC1');
    });
  });

  describe('removeFilter', () => {
    it('should remove productType filter', () => {
      const filters: FilterValue = { productType: 'PT01', aborh: 'A+' };
      const result = SetupInventoryLevelsFilterChipsUtils.removeFilter(filters, 'productType');
      expect(result.productType).toBeUndefined();
      expect(result.aborh).toBe('A+');
    });

    it('should remove aborh filter', () => {
      const filters: FilterValue = { productType: 'PT01', aborh: 'A+' };
      const result = SetupInventoryLevelsFilterChipsUtils.removeFilter(filters, 'aborh');
      expect(result.aborh).toBeUndefined();
      expect(result.productType).toBe('PT01');
    });

    it('should remove attribute filter', () => {
      const filters: FilterValue = { attribute: 'AC1' };
      const result = SetupInventoryLevelsFilterChipsUtils.removeFilter(filters, 'attribute');
      expect(result.attribute).toBeUndefined();
    });

    it('should remove effectiveDate and effectiveDatePeriod together', () => {
      const filters: FilterValue = {
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'After',
        productType: 'PT01'
      };
      const result = SetupInventoryLevelsFilterChipsUtils.removeFilter(filters, 'effectiveDate');
      expect(result.effectiveDate).toBeUndefined();
      expect(result.effectiveDatePeriod).toBeUndefined();
      expect(result.productType).toBe('PT01');
    });

    it('should remove terminationDate and terminationDatePeriod together', () => {
      const filters: FilterValue = {
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'Before'
      };
      const result = SetupInventoryLevelsFilterChipsUtils.removeFilter(filters, 'terminationDate');
      expect(result.terminationDate).toBeUndefined();
      expect(result.terminationDatePeriod).toBeUndefined();
    });

    it('should not modify original filters', () => {
      const filters: FilterValue = { productType: 'PT01' };
      SetupInventoryLevelsFilterChipsUtils.removeFilter(filters, 'productType');
      expect(filters.productType).toBe('PT01');
    });

    it('should handle unknown chip key gracefully', () => {
      const filters: FilterValue = { productType: 'PT01' };
      const result = SetupInventoryLevelsFilterChipsUtils.removeFilter(filters, 'unknown');
      expect(result.productType).toBe('PT01');
    });
  });

  describe('clearAllFilters', () => {
    it('should return empty object', () => {
      const result = SetupInventoryLevelsFilterChipsUtils.clearAllFilters();
      expect(result).toEqual({});
    });
  });

  describe('getDatePeriodSymbol edge cases', () => {
    it('should return ≤ for Before period (via chip label)', () => {
      const filters: FilterValue = {
        effectiveDatePeriod: 'Before',
        effectiveDate: '2025-06-15'
      };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips[0].label).toContain('≤');
    });

    it('should return ≥ for After period (via chip label)', () => {
      const filters: FilterValue = {
        terminationDatePeriod: 'After',
        terminationDate: '2025-06-15'
      };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips[0].label).toContain('≥');
    });
  });

  describe('formatDate edge cases', () => {
    it('should return dash for null date (via chip with null effective date)', () => {
      const filters: FilterValue = {
        effectiveDatePeriod: 'After',
        effectiveDate: null as any
      };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should return dash for invalid date string', () => {
      const filters: FilterValue = {
        effectiveDatePeriod: 'After',
        effectiveDate: 'not-a-date'
      };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('-');
    });
  });

  describe('findAttributeDesc with row with no attribGroup', () => {
    it('should return empty string for attribute with row that has no attribGroup', () => {
      const dataNoGroup: SetInventoryLevelDisplay[] = [{
        ...mockTableData[0],
        attribGroup: null,
        attribCode: 'AC1'
      }];
      const filters: FilterValue = { attribute: 'AC1' };
      const chips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(filters, dataNoGroup);
      expect(chips[0].label).toBe('Attribute: AC1');
    });
  });
});
