import { LabTestsFilterChipsUtils } from './filter-chips.utils';
import { LabTestFilterValue } from '../models/lab-tests.model';

describe('LabTestsFilterChipsUtils', () => {

  describe('convertFiltersToChips', () => {

    it('should return empty array when no filters are active', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = LabTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should create chip for initialRepeat I as Initial', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = LabTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('initialRepeat');
      expect(chips[0].label).toBe('Initial/Repeat: Initial');
      expect(chips[0].removable).toBe(true);
    });

    it('should create chip for initialRepeat R as Repeat', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'R',
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = LabTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toBe('Initial/Repeat: Repeat');
    });

    it('should create chip for interdiction code', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: null,
        interdictionCode: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = LabTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('interdictionCode');
      expect(chips[0].label).toBe('Interdiction Code: D01');
    });

    it('should create chip for effective date with period', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: null,
        interdictionCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = LabTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('15-JUN-2024');
    });

    it('should not create effective date chip without period', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = LabTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create chip for termination date with period', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const chips = LabTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≤');
      expect(chips[0].label).toContain('31-DEC-2025');
    });

    it('should create multiple chips when multiple filters are active', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const chips = LabTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(4);
      expect(chips.map(c => c.key)).toEqual([
        'initialRepeat', 'interdictionCode', 'effectiveDate', 'terminationDate'
      ]);
    });

    it('should set all chips as removable', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = LabTestsFilterChipsUtils.convertFiltersToChips(filters);
      chips.forEach(chip => {
        expect(chip.removable).toBe(true);
      });
    });
  });

  describe('removeFilterByChipKey', () => {



    it('should remove effective date and period together', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = LabTestsFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result?.effectiveDate).toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
      expect(result?.initialRepeat).toBe('I');
    });

    it('should remove termination date and period together', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const result = LabTestsFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');
      expect(result?.terminationDate).toBeNull();
      expect(result?.terminationDatePeriod).toBeNull();
    });


    it('should not mutate the original filters', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      LabTestsFilterChipsUtils.removeFilterByChipKey(filters, 'initialRepeat');
      expect(filters.initialRepeat).toBe('I');
    });
  });

  describe('hasActiveFilters', () => {


    it('should return true when initialRepeat is set', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(LabTestsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when interdictionCode is set', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: null,
        interdictionCode: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(LabTestsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });



    it('should return true when multiple filters are active', () => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(LabTestsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
