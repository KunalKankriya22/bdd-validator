import { FilterChipsUtils } from './filter-chips.utils';
import { DonorDecisionCodeFilterValue } from '../models/donor-decision-codes.model';

describe('FilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert barcode filter to chip', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: 'BC123',
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('barcode');
      expect(chips[0].label).toBe('Barcode: BC123');
      expect(chips[0].value).toBe('BC123');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert donorDecisionCode filter to chip', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: 'DDC456',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('donorDecisionCode');
      expect(chips[0].label).toBe('Donor Decision Code: DDC456');
      expect(chips[0].value).toBe('DDC456');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert effective date filter with "After" period to chip', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('15-JAN-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert effective date filter with "Before" period to chip', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2025-03-20'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≤');
      expect(chips[0].label).toContain('20-MAR-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert termination date filter with "After" period to chip', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'After',
        terminationDate: new Date('2025-06-30')
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≥');
      expect(chips[0].label).toContain('30-JUN-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert termination date filter with "Before" period to chip', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≤');
      expect(chips[0].label).toContain('31-DEC-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should not create chip when effective date is set but period is null', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create chip when termination date is set but period is null', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: new Date('2025-12-31')
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert all filters to chips', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: 'BC789',
        donorDecisionCode: 'DDC999',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(4);
      expect(chips[0].key).toBe('barcode');
      expect(chips[1].key).toBe('donorDecisionCode');
      expect(chips[2].key).toBe('effectiveDate');
      expect(chips[3].key).toBe('terminationDate');
    });

    it('should use custom formatDate function when provided', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const customFormatter = (date: Date | null) => {
        if (!date) return 'N/A';
        return '**CUSTOM**';
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters, customFormatter);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('**CUSTOM**');
    });

    it('should handle date formatting with single-digit days', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-05'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = FilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toContain('05-JAN-2025');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return empty filters object when filters are null', () => {
      const result = FilterChipsUtils.removeFilterByChipKey(null, 'barcode');
      expect(result).toEqual({
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
    });



    it('should remove effectiveDate filter and its period', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result.effectiveDate).toBeNull();
      expect(result.effectiveDatePeriod).toBeNull();
      expect(result.terminationDate).toEqual(new Date('2025-12-31'));
      expect(result.terminationDatePeriod).toBe('Before');
    });

    it('should remove terminationDate filter and its period', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');
      expect(result.terminationDate).toBeNull();
      expect(result.terminationDatePeriod).toBeNull();
      expect(result.effectiveDate).toEqual(new Date('2025-01-15'));
      expect(result.effectiveDatePeriod).toBe('After');
    });

    it('should keep other filters when removing one', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: 'BC123',
        donorDecisionCode: 'DDC456',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const result = FilterChipsUtils.removeFilterByChipKey(filters, 'barcode');
      expect(result.barcode).toBeNull();
      expect(result.donorDecisionCode).toBe('DDC456');
      expect(result.effectiveDatePeriod).toBe('After');
      expect(result.effectiveDate).toEqual(new Date('2025-01-15'));
      expect(result.terminationDatePeriod).toBe('Before');
      expect(result.terminationDate).toEqual(new Date('2025-12-31'));
    });

  });

  describe('hasActiveFilters', () => {


    it('should return true when barcode filter is active', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: 'BC123',
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when donorDecisionCode filter is active', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: 'DDC456',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDate filter is active with both date and period', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only effectiveDate is set without period', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when only effectiveDatePeriod is set without date', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when terminationDate filter is active with both date and period', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only terminationDate is set without period', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: new Date('2025-12-31')
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when only terminationDatePeriod is set without date', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: null
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when multiple filters are active', () => {
      const filters: DonorDecisionCodeFilterValue = {
        barcode: 'BC123',
        donorDecisionCode: 'DDC456',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(FilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('getEmptyFilters', () => {
    it('should return empty filter object with all properties null', () => {
      const result = FilterChipsUtils.getEmptyFilters();
      expect(result).toEqual({
        barcode: null,
        donorDecisionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
    });

    it('should return a new object on each call', () => {
      const result1 = FilterChipsUtils.getEmptyFilters();
      const result2 = FilterChipsUtils.getEmptyFilters();
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });
});
