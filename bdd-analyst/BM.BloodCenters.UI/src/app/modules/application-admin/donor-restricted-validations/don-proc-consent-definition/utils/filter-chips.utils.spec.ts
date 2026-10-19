import { DonProcConsentDefinitionFilterChipsUtils } from './filter-chips.utils';
import { DonProcConsentDefinitionFilterValue } from '../models/don-proc-consent-definition.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

describe('DonProcConsentDefinitionFilterChipsUtils', () => {
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  describe('convertFiltersToChips', () => {

    it('should return empty array for filters with all null values', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);
      expect(result).toEqual([]);
    });

    it('should create chip for donationType', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: 'AL',
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('donationType');
      expect(result[0].label).toBe('Donation Type: AL');
      expect(result[0].value).toBe('AL');
    });

    it('should create chip for procedureCode', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: 'DP',
        consentCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('procedureCode');
      expect(result[0].label).toBe('Procedure Code: DP');
      expect(result[0].value).toBe('DP');
    });

    it('should create chip for consentCode', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: 'DCONGEN',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('consentCode');
      expect(result[0].label).toBe('Consent Code: DCONGEN');
      expect(result[0].value).toBe('DCONGEN');
    });

    it('should create chip for effectiveDate with formatted date', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15T00:00:00.000Z',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date ≥');
      expect(result[0].label).toContain('15-01-2025');
    });

    it('should create chip for terminationDate with formatted date', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31T00:00:00.000Z'
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date ≤');
      expect(result[0].label).toContain('31-12-2025');
    });


    it('should create chips in correct order', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01T00:00:00.000Z',
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31T00:00:00.000Z'
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);

      expect(result[0].key).toBe('donationType');
      expect(result[1].key).toBe('procedureCode');
      expect(result[2].key).toBe('consentCode');
      expect(result[3].key).toBe('effectiveDate');
      expect(result[4].key).toBe('terminationDate');
    });


    it('should format date with leading zeros', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-03-05T00:00:00.000Z',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);

      expect(result[0].label).toContain('05-03-2025');
    });
  });

  describe('removeFilterByChipKey', () => {




    it('should remove effectiveDate filter', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: 'AL',
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01T00:00:00.000Z',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result?.donationType).toBe('AL');
      expect(result?.effectiveDate).toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
    });






    it('should return updated filters when some filters remain', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01T00:00:00.000Z',
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31T00:00:00.000Z'
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      expect(result).not.toBeNull();
      expect(result?.donationType).toBeNull();
      expect(result?.procedureCode).toBe('DP');
      expect(result?.consentCode).toBe('DCONGEN');
      expect(result?.effectiveDate).toBeTruthy();
      expect(result?.terminationDate).toBeTruthy();
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false for filters with all null values', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when donationType has value', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: 'AL',
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when procedureCode has value', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: 'DP',
        consentCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when consentCode has value', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: 'DCONGEN',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when effectiveDate has value', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01T00:00:00.000Z',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when terminationDate has value', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31T00:00:00.000Z'
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });


    it('should return true when some filters have values', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: 'AL',
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31T00:00:00.000Z'
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

  });

  describe('formatDate (private method through convertFiltersToChips)', () => {
    it('should format date with leading zeros for single-digit day', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-05T00:00:00.000Z',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);
      expect(result[0].label).toContain('05-01-2025');
    });

    it('should format date with leading zeros for single-digit month', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-03-15T00:00:00.000Z',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);
      expect(result[0].label).toContain('15-03-2025');
    });

    it('should format date correctly for double-digit day and month', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-12-25T00:00:00.000Z',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);
      expect(result[0].label).toContain('25-12-2025');
    });

    it('should preserve original date string in chip value', () => {
      const testDate = '2025-01-15T00:00:00.000Z';
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: null,
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: testDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);
      expect(result[0].value).toBe(testDate);
    });
  });

  describe('Edge Cases', () => {
    it('should handle filters with undefined values gracefully', () => {
      const filters = {
        donationType: undefined as any,
        procedureCode: undefined as any,
        consentCode: undefined as any,
        effectiveDatePeriod: undefined as any,
        effectiveDate: undefined as any,
        terminationDatePeriod: undefined as any,
        terminationDate: undefined as any
      };

      const result = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);
      expect(result).toEqual([]);
    });


  });

  describe('Integration Scenarios', () => {
    it('should work correctly in a typical filter -> chip -> remove flow', () => {
      const filters: DonProcConsentDefinitionFilterValue = {
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01T00:00:00.000Z',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(filters, formatDate);
      expect(chips.length).toBe(3);

      const updatedFilters = DonProcConsentDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      const updatedChips = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(updatedFilters, formatDate);
      expect(updatedChips.length).toBe(2);
      expect(updatedChips.find(c => c.key === 'donationType')).toBeUndefined();
    });

    it('should correctly identify when all filters are cleared', () => {
      let filters: DonProcConsentDefinitionFilterValue | null = {
        donationType: 'AL',
        procedureCode: null,
        consentCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(DonProcConsentDefinitionFilterChipsUtils.hasActiveFilters(filters)).toBe(true);

      filters = DonProcConsentDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');

      expect(filters).toBeNull();
      expect(DonProcConsentDefinitionFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
