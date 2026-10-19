import { DefineOrderChargesFilterChipsUtils } from './filter-chips.utils';
import { OrderChargesFilterFormValue } from '../models/define-order-charges.model';

describe('DefineOrderChargesFilterChipsUtils', () => {

  describe('convertFiltersToChips', () => {

    it('should convert service code filter to chip', () => {
      const filters: OrderChargesFilterFormValue = { serviceCode: 'TEST001' };
      const chips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('serviceCode');
      expect(chips[0].label).toBe('Service Code: TEST001');
      expect(chips[0].value).toBe('TEST001');
    });

    it('should convert effective date AFTER filter to chip', () => {
      const filters: OrderChargesFilterFormValue = {
        effectiveDate: '2025-01-15',
        effectiveDatePeriod: 'AFTER'
      };
      const chips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date After:');
      expect(chips[0].value).toBe('2025-01-15');
    });

    it('should convert effective date BEFORE filter to chip', () => {
      const filters: OrderChargesFilterFormValue = {
        effectiveDate: '2025-06-30',
        effectiveDatePeriod: 'BEFORE'
      };
      const chips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date Before:');
    });

    it('should convert termination date AFTER filter to chip', () => {
      const filters: OrderChargesFilterFormValue = {
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'AFTER'
      };
      const chips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date After:');
      expect(chips[0].value).toBe('2025-12-31');
    });

    it('should convert termination date BEFORE filter to chip', () => {
      const filters: OrderChargesFilterFormValue = {
        terminationDate: '2025-03-15',
        terminationDatePeriod: 'BEFORE'
      };
      const chips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date Before:');
    });

    it('should convert all three filters to chips', () => {
      const filters: OrderChargesFilterFormValue = {
        serviceCode: 'SVC01',
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'AFTER',
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'BEFORE'
      };
      const chips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('serviceCode');
      expect(chips[1].key).toBe('effectiveDate');
      expect(chips[2].key).toBe('terminationDate');
    });

    it('should not create date chip when date has no period', () => {
      const filters: OrderChargesFilterFormValue = {
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: null
      };
      const chips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });

    it('should not create date chip when period has no date', () => {
      const filters: OrderChargesFilterFormValue = {
        effectiveDate: null,
        effectiveDatePeriod: 'AFTER'
      };
      const chips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });

    it('should format date as DD-MMM-YYYY in chip label', () => {
      const filters: OrderChargesFilterFormValue = {
        effectiveDate: '2025-05-15',
        effectiveDatePeriod: 'AFTER'
      };
      const chips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('15-MAY-2025');
    });

    it('should return empty array for empty filter object', () => {
      const chips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips({});
      expect(chips).toEqual([]);
    });
  });

  describe('removeFilterByChipKey', () => {


    it('should remove serviceCode and keep other filters', () => {
      const filters: OrderChargesFilterFormValue = {
        serviceCode: 'TEST001',
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'AFTER'
      };
      const result = DefineOrderChargesFilterChipsUtils.removeFilterByChipKey(filters, 'serviceCode');

      expect(result).toBeTruthy();
      expect(result!.serviceCode).toBeUndefined();
      expect(result!.effectiveDate).toBe('2025-01-01');
      expect(result!.effectiveDatePeriod).toBe('AFTER');
    });

    it('should remove effectiveDate and effectiveDatePeriod together', () => {
      const filters: OrderChargesFilterFormValue = {
        serviceCode: 'TEST001',
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'AFTER'
      };
      const result = DefineOrderChargesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).toBeTruthy();
      expect(result!.effectiveDate).toBeUndefined();
      expect(result!.effectiveDatePeriod).toBeUndefined();
      expect(result!.serviceCode).toBe('TEST001');
    });

    it('should remove terminationDate and terminationDatePeriod together', () => {
      const filters: OrderChargesFilterFormValue = {
        serviceCode: 'TEST001',
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'BEFORE'
      };
      const result = DefineOrderChargesFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).toBeTruthy();
      expect(result!.terminationDate).toBeUndefined();
      expect(result!.terminationDatePeriod).toBeUndefined();
      expect(result!.serviceCode).toBe('TEST001');
    });

    it('should return original filters for unknown chip key', () => {
      const filters: OrderChargesFilterFormValue = { serviceCode: 'TEST001' };
      const result = DefineOrderChargesFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).toBeTruthy();
      expect(result!.serviceCode).toBe('TEST001');
    });

  });

  describe('hasActiveFilters', () => {

    it('should return false for empty filter object', () => {
      expect(DefineOrderChargesFilterChipsUtils.hasActiveFilters({})).toBe(false);
    });

    it('should return true when serviceCode is set', () => {
      expect(DefineOrderChargesFilterChipsUtils.hasActiveFilters({ serviceCode: 'TEST001' })).toBe(true);
    });



    it('should return false when only period is set without date', () => {
      expect(DefineOrderChargesFilterChipsUtils.hasActiveFilters({ effectiveDatePeriod: 'AFTER' })).toBe(false);
    });
  });
});
