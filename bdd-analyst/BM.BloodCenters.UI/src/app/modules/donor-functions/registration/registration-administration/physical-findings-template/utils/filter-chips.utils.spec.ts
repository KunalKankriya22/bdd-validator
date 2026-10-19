import { PhysicalFindingsTemplateFilterChipsUtils } from './filter-chips.utils';
import { PhysicalFindingsTemplateFilterValue } from '../models/physical-findings-template.model';

describe('PhysicalFindingsTemplateFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert showInactive filter to chip', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('showInactive');
      expect(chips[0].label).toBe('Show inactive templates');
      expect(chips[0].value).toBe('Yes');
      expect(chips[0].removable).toBe(true);
    });

    it('should not create chip when showInactive is false', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert donationType filter to chip', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: 'Whole Blood',
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('donationType');
      expect(chips[0].label).toBe('Donation Type: Whole Blood');
      expect(chips[0].value).toBe('Whole Blood');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert procedureCode filter to chip', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: 'PROC01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('procedureCode');
      expect(chips[0].label).toBe('Procedure Code: PROC01');
      expect(chips[0].value).toBe('PROC01');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert effective date with "after" period to chip using >= symbol', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert effective date with "before" period to chip using <= symbol', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: 'before',
        effectiveDate: new Date('2025-03-20'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≤');
    });

    it('should handle effective date as string', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: '2025-06-15',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≥');
    });

    it('should not create effective date chip when date is set but period is null', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create effective date chip when period is set but date is null', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert termination date with "after" period to chip using >= symbol', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: new Date('2025-12-31')
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert termination date with "before" period to chip using <= symbol', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-06-30')
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should handle termination date as string', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: '2025-09-01'
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
    });

    it('should not create termination date chip when date is set but period is null', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: new Date('2025-12-31')
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: 'Whole Blood',
        procedureCode: 'PROC01',
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };

      const chips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(5);
      expect(chips[0].key).toBe('showInactive');
      expect(chips[1].key).toBe('donationType');
      expect(chips[2].key).toBe('procedureCode');
      expect(chips[3].key).toBe('effectiveDate');
      expect(chips[4].key).toBe('terminationDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = PhysicalFindingsTemplateFilterChipsUtils.removeFilterByChipKey(null, 'showInactive');
      expect(result).toBeNull();
    });

    it('should remove showInactive filter', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: 'WB',
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = PhysicalFindingsTemplateFilterChipsUtils.removeFilterByChipKey(filters, 'showInactive');
      expect(result).not.toBeNull();
      expect(result!.showInactive).toBe(false);
      expect(result!.donationType).toBe('WB');
    });

    it('should remove donationType and also clear procedureCode', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: 'WB',
        procedureCode: 'PROC01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = PhysicalFindingsTemplateFilterChipsUtils.removeFilterByChipKey(filters, 'donationType');
      expect(result).not.toBeNull();
      expect(result!.donationType).toBeNull();
      expect(result!.procedureCode).toBeNull();
      expect(result!.showInactive).toBe(true);
    });

    it('should remove procedureCode filter', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: 'WB',
        procedureCode: 'PROC01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = PhysicalFindingsTemplateFilterChipsUtils.removeFilterByChipKey(filters, 'procedureCode');
      expect(result).not.toBeNull();
      expect(result!.procedureCode).toBeNull();
      expect(result!.donationType).toBe('WB');
    });

    it('should remove effectiveDate and effectiveDatePeriod', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = PhysicalFindingsTemplateFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectiveDatePeriod).toBeNull();
    });

    it('should remove terminationDate and terminationDatePeriod', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };

      const result = PhysicalFindingsTemplateFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');
      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationDatePeriod).toBeNull();
    });

    it('should return null when removing the last active filter', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = PhysicalFindingsTemplateFilterChipsUtils.removeFilterByChipKey(filters, 'showInactive');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: 'WB',
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      PhysicalFindingsTemplateFilterChipsUtils.removeFilterByChipKey(filters, 'showInactive');
      expect(filters.showInactive).toBe(true);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(PhysicalFindingsTemplateFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(PhysicalFindingsTemplateFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when showInactive is true', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(PhysicalFindingsTemplateFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when donationType is set', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: 'WB',
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(PhysicalFindingsTemplateFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when procedureCode is set', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: 'PROC01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(PhysicalFindingsTemplateFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effectiveDate is set', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(PhysicalFindingsTemplateFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when terminationDate is set', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: false,
        donationType: null,
        procedureCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: new Date('2025-12-31')
      };
      expect(PhysicalFindingsTemplateFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when multiple filters are active', () => {
      const filters: PhysicalFindingsTemplateFilterValue = {
        showInactive: true,
        donationType: 'WB',
        procedureCode: 'PROC01',
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };
      expect(PhysicalFindingsTemplateFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
