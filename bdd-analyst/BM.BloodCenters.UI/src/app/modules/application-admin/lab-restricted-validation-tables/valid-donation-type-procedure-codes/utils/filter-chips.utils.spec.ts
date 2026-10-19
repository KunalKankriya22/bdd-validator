import { ValidDonationTypeProcedureCodesFilterChipsUtils } from './filter-chips.utils';
import { ValidDonationTypeProcedureCodesFilterValue } from '../models/valid-donation-type-procedure-codes.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('ValidDonationTypeProcedureCodesFilterChipsUtils', () => {
  /* ===============================
     CONVERT FILTERS TO CHIPS
  =============================== */
  describe('convertFiltersToChips', () => {

    it('should return empty array when all filters are null', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips).toEqual([]);
    });

    it('should create chip for donation type filter', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: 'WB',
        procedureCode: null,
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('donationType');
      expect(chips[0].label).toBe('Donation Type: WB');
      expect(chips[0].value).toBe('WB');
    });

    it('should create chip for procedure code filter', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: 'WBL',
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('procedureCode');
      expect(chips[0].label).toBe('Procedure Code: WBL');
      expect(chips[0].value).toBe('WBL');
    });

    it('should create chip for attribute group filter', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: 'PROC',
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('attributeGroup');
      expect(chips[0].label).toBe('Attribute Group: PROC');
      expect(chips[0].value).toBe('PROC');
    });

    it('should create chip for effective date filter with After period', () => {
      const effectiveDate = new Date('2024-01-15');
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        periodType1: 'After',
        effectiveDate: effectiveDate,
        periodType2: null,
        terminationDate: null
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('Jan');
      expect(chips[0].label).toContain('15');
      expect(chips[0].label).toContain('2024');
      expect(chips[0].value).toEqual(effectiveDate);
    });

    it('should create chip for effective date filter with Before period', () => {
      const effectiveDate = new Date('2024-12-31');
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        periodType1: 'Before',
        effectiveDate: effectiveDate,
        periodType2: null,
        terminationDate: null
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≤');
      expect(chips[0].label).toContain('Dec');
      expect(chips[0].label).toContain('31');
      expect(chips[0].label).toContain('2024');
    });

    it('should not create chip for effective date if period type is missing', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        periodType1: null,
        effectiveDate: new Date('2024-01-15'),
        periodType2: null,
        terminationDate: null
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });

    it('should create chip for termination date filter with Before period', () => {
      const terminationDate = new Date('2024-12-31');
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: 'Before',
        terminationDate: terminationDate
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≤');
      expect(chips[0].value).toEqual(terminationDate);
    });

    it('should create multiple chips when multiple filters are applied', () => {
      const effectiveDate = new Date('2024-01-01');
      const terminationDate = new Date('2024-12-31');
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        periodType1: 'After',
        effectiveDate: effectiveDate,
        periodType2: 'Before',
        terminationDate: terminationDate
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(5);

      const chipKeys = chips.map(chip => chip.key);
      expect(chipKeys).toContain('donationType');
      expect(chipKeys).toContain('procedureCode');
      expect(chipKeys).toContain('attributeGroup');
      expect(chipKeys).toContain('effectiveDate');
      expect(chipKeys).toContain('terminationDate');
    });

    it('should format date correctly in chip label', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        periodType1: 'After',
        effectiveDate: new Date('2024-03-25'),
        periodType2: null,
        terminationDate: null
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('Mar');
      expect(chips[0].label).toContain('25');
      expect(chips[0].label).toContain('2024');
    });
  });

  /* ===============================
     REMOVE FILTER BY CHIP KEY
  =============================== */
  describe('removeFilterByChipKey', () => {

    it('should remove donation type filter', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      const result = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      expect(result).toBeDefined();
      expect(result?.donationType).toBeNull();
      expect(result?.procedureCode).toBe('WBL'); // Other filters remain
    });

    it('should remove procedure code filter', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      const result = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(filters, 'procedureCode');

      expect(result).toBeDefined();
      expect(result?.procedureCode).toBeNull();
      expect(result?.donationType).toBe('WB'); // Other filters remain
    });


    it('should remove effective date and its period type', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: 'WB',
        procedureCode: null,
        attributeGroup: null,
        periodType1: 'After',
        effectiveDate: new Date('2024-01-01'),
        periodType2: null,
        terminationDate: null
      };

      const result = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).toBeDefined();
      expect(result?.effectiveDate).toBeNull();
      expect(result?.periodType1).toBeNull();
      expect(result?.donationType).toBe('WB'); // Other filters remain
    });



    it('should preserve other filters when removing one', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        periodType1: 'After',
        effectiveDate: new Date('2024-01-01'),
        periodType2: null,
        terminationDate: null
      };

      const result = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(filters, 'procedureCode');

      expect(result).toBeDefined();
      expect(result?.procedureCode).toBeNull();
      expect(result?.donationType).toBe('WB');
      expect(result?.attributeGroup).toBe('PROC');
      expect(result?.effectiveDate).toEqual(filters.effectiveDate);
      expect(result?.periodType1).toBe('After');
    });

  });

  /* ===============================
     HAS ACTIVE FILTERS
  =============================== */
  describe('hasActiveFilters', () => {


    it('should return true when donation type filter is set', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: 'WB',
        procedureCode: null,
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      const result = ValidDonationTypeProcedureCodesFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });

    it('should return true when procedure code filter is set', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: 'WBL',
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      const result = ValidDonationTypeProcedureCodesFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });

    it('should return true when attribute group filter is set', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: 'PROC',
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      const result = ValidDonationTypeProcedureCodesFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });

    it('should return true when effective date and period type are set', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        periodType1: 'After',
        effectiveDate: new Date('2024-01-01'),
        periodType2: null,
        terminationDate: null
      };

      const result = ValidDonationTypeProcedureCodesFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });


    it('should return true when termination date and period type are set', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: 'Before',
        terminationDate: new Date('2024-12-31')
      };

      const result = ValidDonationTypeProcedureCodesFilterChipsUtils.hasActiveFilters(filters);

      expect(result).toBeTrue();
    });


  });

  /* ===============================
     DATE FORMATTING
  =============================== */
  describe('Date Formatting (private method)', () => {
    it('should format dates in chips using US locale', () => {
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        periodType1: 'After',
        effectiveDate: new Date('2024-06-15'),
        periodType2: null,
        terminationDate: null
      };

      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

      // Format should include month abbreviation, day, and year
      expect(chips[0].label).toMatch(/Jun/);
      expect(chips[0].label).toMatch(/15/);
      expect(chips[0].label).toMatch(/2024/);
    });

    it('should handle different months correctly', () => {
      const testDates = [
        { date: new Date('2024-01-01'), month: 'Jan' },
        { date: new Date('2024-02-15'), month: 'Feb' },
        { date: new Date('2024-03-20'), month: 'Mar' },
        { date: new Date('2024-12-31'), month: 'Dec' }
      ];

      testDates.forEach(({ date, month }) => {
        const filters: ValidDonationTypeProcedureCodesFilterValue = {
          donationType: null,
          procedureCode: null,
          attributeGroup: null,
          periodType1: 'After',
          effectiveDate: date,
          periodType2: null,
          terminationDate: null
        };

        const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

        expect(chips[0].label).toContain(month);
      });
    });
  });

  /* ===============================
     INTEGRATION TESTS
  =============================== */
  describe('Integration Tests', () => {
    it('should create chips, remove one, and update has active filters correctly', () => {
      // Start with multiple filters
      let filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      // Should have active filters
      expect(ValidDonationTypeProcedureCodesFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();

      // Should create 2 chips
      let chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(2);

      // Remove one filter
      filters = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(filters, 'donationType')!;

      // Should still have active filters
      expect(ValidDonationTypeProcedureCodesFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();

      // Should create 1 chip
      chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);

      // Remove last filter
      filters = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(filters, 'procedureCode')!;

      // Should be null when no active filters
      expect(filters).toBeNull();
    });

    it('should handle complete filter lifecycle', () => {
      // Create filters
      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        periodType1: 'After',
        effectiveDate: new Date('2024-01-01'),
        periodType2: 'Before',
        terminationDate: new Date('2024-12-31')
      };

      // Convert to chips
      const chips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(5);

      // Verify has active filters
      expect(ValidDonationTypeProcedureCodesFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();

      // Remove each chip one by one
      let updatedFilters = filters;

      updatedFilters = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(updatedFilters, 'donationType')!;
      expect(updatedFilters).not.toBeNull();

      updatedFilters = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(updatedFilters, 'procedureCode')!;
      expect(updatedFilters).not.toBeNull();

      updatedFilters = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(updatedFilters, 'attributeGroup')!;
      expect(updatedFilters).not.toBeNull();

      updatedFilters = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(updatedFilters, 'effectiveDate')!;
      expect(updatedFilters).not.toBeNull();

      // Last removal should return null
      updatedFilters = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(updatedFilters, 'terminationDate')!;
      expect(updatedFilters).toBeNull();
    });
  });
});
