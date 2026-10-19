import { DefineDonationTypesFilterChipsUtils } from './filter-chips.utils';
import { DefineDonationTypesFilterFormValue } from '../define-donation-types-filter-panel/define-donation-types-filter-panel';

describe('DefineDonationTypesFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert donation type code filter to chip', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: 'CODE1',
        sequence: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('donationTypeCode');
      expect(chips[0].label).toBe('Donation Type Code: CODE1');
      expect(chips[0].value).toBe('CODE1');
    });

    it('should convert sequence filter to chip', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: 5,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('sequence');
      expect(chips[0].label).toBe('Sequence: 5');
    });

    it('should convert effective date filter to chip with period symbol (After = ≥)', () => {
      const effectiveDate = new Date('2024-01-15');

      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: 'after',
        effectiveDate: effectiveDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('JAN');
      expect(chips[0].label).toContain('15');
      expect(chips[0].label).toContain('2024');
    });

    it('should convert termination date filter to chip with period symbol (Before = ≤)', () => {
      const terminationDate = new Date('2024-12-31');

      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: terminationDate
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≤');
      expect(chips[0].label).toContain('DEC');
      expect(chips[0].label).toContain('31');
      expect(chips[0].label).toContain('2024');
    });

    it('should convert all filters to chips', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: 'CODE1',
        sequence: 3,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(4);
    });

    it('should not create date chip if period is missing', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });

    it('should not create date chip if date is missing', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove donation type code filter', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: 'CODE1',
        sequence: 3,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DefineDonationTypesFilterChipsUtils.removeFilterByChipKey(filters, 'donationTypeCode');

      expect(result).not.toBeNull();
      expect(result?.donationTypeCode).toBeNull();
      expect(result?.sequence).toBe(3);
    });

    it('should remove sequence filter', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: 'CODE1',
        sequence: 3,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DefineDonationTypesFilterChipsUtils.removeFilterByChipKey(filters, 'sequence');

      expect(result).not.toBeNull();
      expect(result?.sequence).toBeNull();
      expect(result?.donationTypeCode).toBe('CODE1');
    });



  });

  describe('hasActiveFilters', () => {


    it('should return true when donation type code is set', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: 'CODE1',
        sequence: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(DefineDonationTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when sequence filter is set', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: 5,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(DefineDonationTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effective date and period are set', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(DefineDonationTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termination date and period are set', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      };

      expect(DefineDonationTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when effective date is set but period is missing', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(DefineDonationTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when period is set but date is missing', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(DefineDonationTypesFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });

  describe('Period symbol conversion', () => {
    it('should use ≥ symbol for After period with effective date', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).not.toContain('after');
    });

    it('should use ≤ symbol for Before period with effective date', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: 'before',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).not.toContain('before');
    });

    it('should use ≥ symbol for After period with termination date', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: new Date('2024-12-31')
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).not.toContain('after');
    });

    it('should use ≤ symbol for Before period with termination date', () => {
      const filters: DefineDonationTypesFilterFormValue = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      };

      const chips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).not.toContain('before');
    });
  });
});
