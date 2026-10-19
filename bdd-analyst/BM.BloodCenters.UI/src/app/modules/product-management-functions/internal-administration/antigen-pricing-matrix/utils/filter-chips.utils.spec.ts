import { AntigenPricingMatrixFilterChipsUtils } from './filter-chips.utils';
import { AntigenPricingMatrixFilterValue } from '../models/antigen-pricing-matrix.model';

jest.mock('src/app/modules/system-administration/application-sequence-numbers/utils/table-display.util', () => ({
  formatTableDate: jest.fn((date: any) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }),
}));

describe('AntigenPricingMatrixFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when no filters are set', () => {
      const filters = {} as AntigenPricingMatrixFilterValue;
      expect(AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for serviceCode', () => {
      const filters = { serviceCode: 'SVC100' } as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'serviceCode',
        label: 'Service Code: SVC100',
        value: 'SVC100',
      });
    });

    it('should create chip for effDate with before period showing <= symbol', () => {
      const testDate = new Date(2024, 2, 15);
      const filters = {
        effDate: testDate,
        effDatePeriod: 'before',
      } as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effDate');
      expect(result[0].label).toContain('Effective Date');
      expect(result[0].label).toContain('≤');
    });

    it('should create chip for effDate with after period showing >= symbol', () => {
      const testDate = new Date(2024, 2, 15);
      const filters = {
        effDate: testDate,
        effDatePeriod: 'after',
      } as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
    });

    it('should not create chip for effDate when period is missing', () => {
      const filters = {
        effDate: new Date(2024, 2, 15),
      } as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(filters);

      const effChip = result.find(c => c.key === 'effDate');
      expect(effChip).toBeUndefined();
    });

    it('should create chip for termDate with before period showing <= symbol', () => {
      const testDate = new Date(2025, 11, 31);
      const filters = {
        termDate: testDate,
        termDatePeriod: 'before',
      } as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('termDate');
      expect(result[0].label).toContain('Termination Date');
      expect(result[0].label).toContain('≤');
    });

    it('should create chip for termDate with after period showing >= symbol', () => {
      const testDate = new Date(2025, 11, 31);
      const filters = {
        termDate: testDate,
        termDatePeriod: 'after',
      } as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        serviceCode: 'SVC100',
        effDate: new Date(2024, 0, 1),
        effDatePeriod: 'after',
        termDate: new Date(2025, 11, 31),
        termDatePeriod: 'before',
      } as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(3);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(AntigenPricingMatrixFilterChipsUtils.removeFilterByChipKey(null, 'serviceCode')).toBeNull();
    });

    it('should set serviceCode to null when removing serviceCode chip', () => {
      const filters = {
        serviceCode: 'SVC100',
        effDate: new Date(2024, 0, 1),
        effDatePeriod: 'after',
      } as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'serviceCode');

      expect(result).not.toBeNull();
      expect(result!.serviceCode).toBeNull();
    });

    it('should set effDate and effDatePeriod to null when removing effDate chip', () => {
      const filters = {
        serviceCode: 'SVC100',
        effDate: new Date(2024, 0, 1),
        effDatePeriod: 'after',
      } as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');

      expect(result).not.toBeNull();
      expect(result!.effDate).toBeNull();
      expect(result!.effDatePeriod).toBeNull();
    });

    it('should set termDate and termDatePeriod to null when removing termDate chip', () => {
      const filters = {
        serviceCode: 'SVC100',
        termDate: new Date(2025, 11, 31),
        termDatePeriod: 'before',
      } as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');

      expect(result).not.toBeNull();
      expect(result!.termDate).toBeNull();
      expect(result!.termDatePeriod).toBeNull();
    });

    it('should return null when removing last active filter', () => {
      const filters = {
        serviceCode: 'SVC100',
        effDate: null,
        effDatePeriod: null,
        termDate: null,
        termDatePeriod: null,
      } as unknown as AntigenPricingMatrixFilterValue;
      const result = AntigenPricingMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'serviceCode');

      expect(result).toBeNull();
    });

    it('should not mutate original filters', () => {
      const filters = {
        serviceCode: 'SVC100',
        effDate: new Date(2024, 0, 1),
        effDatePeriod: 'after',
      } as AntigenPricingMatrixFilterValue;
      AntigenPricingMatrixFilterChipsUtils.removeFilterByChipKey(filters, 'serviceCode');

      expect(filters.serviceCode).toBe('SVC100');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(AntigenPricingMatrixFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters = {
        serviceCode: null,
        effDate: null,
        effDatePeriod: null,
        termDate: null,
        termDatePeriod: null,
      } as unknown as AntigenPricingMatrixFilterValue;
      expect(AntigenPricingMatrixFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when serviceCode is set', () => {
      const filters = { serviceCode: 'SVC100' } as AntigenPricingMatrixFilterValue;
      expect(AntigenPricingMatrixFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effDate and effDatePeriod pair is set', () => {
      const filters = {
        effDate: new Date(2024, 0, 1),
        effDatePeriod: 'after',
      } as AntigenPricingMatrixFilterValue;
      expect(AntigenPricingMatrixFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termDate and termDatePeriod pair is set', () => {
      const filters = {
        termDate: new Date(2025, 11, 31),
        termDatePeriod: 'before',
      } as AntigenPricingMatrixFilterValue;
      expect(AntigenPricingMatrixFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only effDate is set without period', () => {
      const filters = {
        effDate: new Date(2024, 0, 1),
      } as AntigenPricingMatrixFilterValue;
      expect(AntigenPricingMatrixFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
