import { CustomerConsigneeProductDetailsFilterChipsUtils } from './filter-chips.utils';
import { FilterValue } from '../models/customer-consignee-product-details.model';

describe('CustomerConsigneeProductDetailsFilterChipsUtils', () => {

  describe('createFilterChips', () => {

    it('should return empty array when filters are empty', () => {
      const filters: FilterValue = {};
      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips).toEqual([]);
    });

    it('should return effective date chip with >= symbol for After period', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2025-01-15'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].value).toBe('2025-01-15');
    });

    it('should return effective date chip with <= symbol for Before period', () => {
      const filters: FilterValue = {
        effectivePeriod: 'Before',
        effectiveDate: '2025-03-20'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≤');
      expect(chips[0].value).toBe('2025-03-20');
    });

    it('should return termination date chip with >= symbol for After period', () => {
      const filters: FilterValue = {
        terminationPeriod: 'After',
        terminationDate: '2025-06-30'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≥');
      expect(chips[0].value).toBe('2025-06-30');
    });

    it('should return termination date chip with <= symbol for Before period', () => {
      const filters: FilterValue = {
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≤');
      expect(chips[0].value).toBe('2025-12-31');
    });

    it('should return both chips when both effective and termination filters are present', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2025-01-01',
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[1].key).toBe('terminationDate');
    });

    it('should not create chip when effective date is present but period is missing', () => {
      const filters: FilterValue = {
        effectiveDate: '2025-01-15'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip when effective period is present but date is missing', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip when termination date is present but period is missing', () => {
      const filters: FilterValue = {
        terminationDate: '2025-12-31'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip when termination period is present but date is missing', () => {
      const filters: FilterValue = {
        terminationPeriod: 'Before'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should format date in chip label as DD-MON-YYYY', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2025-01-15'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips[0].label).toContain('15-JAN-2025');
    });

    it('should pad single-digit days with leading zero in chip label', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2025-01-05'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips[0].label).toContain('05-JAN-2025');
    });

    it('should not create chips when effective date is null', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After',
        effectiveDate: null
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chips when termination date is null', () => {
      const filters: FilterValue = {
        terminationPeriod: 'Before',
        terminationDate: null
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chips when effective period is null', () => {
      const filters: FilterValue = {
        effectivePeriod: null,
        effectiveDate: '2025-01-15'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chips when termination period is null', () => {
      const filters: FilterValue = {
        terminationPeriod: null,
        terminationDate: '2025-12-31'
      };

      const chips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(filters);
      expect(chips.length).toBe(0);
    });
  });

  describe('removeFilter', () => {

    it('should remove effectiveDate and effectivePeriod when key is effectiveDate', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2025-01-15',
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };

      const result = CustomerConsigneeProductDetailsFilterChipsUtils.removeFilter(filters, 'effectiveDate');
      expect(result.effectiveDate).toBeUndefined();
      expect(result.effectivePeriod).toBeUndefined();
    });

    it('should remove terminationDate and terminationPeriod when key is terminationDate', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2025-01-15',
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };

      const result = CustomerConsigneeProductDetailsFilterChipsUtils.removeFilter(filters, 'terminationDate');
      expect(result.terminationDate).toBeUndefined();
      expect(result.terminationPeriod).toBeUndefined();
    });



    it('should return a new object and not mutate the original', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2025-01-15'
      };

      const result = CustomerConsigneeProductDetailsFilterChipsUtils.removeFilter(filters, 'effectiveDate');
      expect(result).not.toBe(filters);
      expect(filters.effectivePeriod).toBe('After');
      expect(filters.effectiveDate).toBe('2025-01-15');
    });

    it('should handle unknown key without modifying any filters', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2025-01-15',
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };

      const result = CustomerConsigneeProductDetailsFilterChipsUtils.removeFilter(filters, 'unknownKey');
      expect(result.effectivePeriod).toBe('After');
      expect(result.effectiveDate).toBe('2025-01-15');
      expect(result.terminationPeriod).toBe('Before');
      expect(result.terminationDate).toBe('2025-12-31');
    });

    it('should return a new object even for unknown key', () => {
      const filters: FilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2025-01-15'
      };

      const result = CustomerConsigneeProductDetailsFilterChipsUtils.removeFilter(filters, 'unknownKey');
      expect(result).not.toBe(filters);
    });
  });

  describe('clearAllFilters', () => {

    it('should return an empty object', () => {
      const result = CustomerConsigneeProductDetailsFilterChipsUtils.clearAllFilters();
      expect(result).toEqual({});
    });

    it('should return a new object on each call', () => {
      const result1 = CustomerConsigneeProductDetailsFilterChipsUtils.clearAllFilters();
      const result2 = CustomerConsigneeProductDetailsFilterChipsUtils.clearAllFilters();
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });
});
