import { DonorTestsFilterChipsUtils } from './filter-chips.utils';
import { DonorTestResultFilterValue } from '../models/donor-tests.model';

describe('DonorTestsFilterChipsUtils', () => {

  describe('convertFiltersToChips', () => {

    it('should return empty array when no filters are active', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should create chip for interdiction', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('interdiction');
      expect(chips[0].label).toBe('Interdiction: D01');
      expect(chips[0].removable).toBe(true);
    });

    it('should create chip for effective date with After period as ≥', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('15-JUN-2024');
    });

    it('should create chip for effective date with Before period as ≤', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toContain('Effective Date ≤');
    });

    it('should not create effective date chip without period', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create chip for termination date with Before period as ≤', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const chips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≤');
      expect(chips[0].label).toContain('31-DEC-2025');
    });

    it('should create chip for termination date with After period as ≥', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'After',
        terminationDate: new Date('2025-12-31')
      };

      const chips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toContain('Termination Date ≥');
    });

    it('should not create termination date chip without period', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: new Date('2025-12-31')
      };

      const chips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create multiple chips when multiple filters are active', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const chips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(chips.map(c => c.key)).toEqual([
        'interdiction', 'effectiveDate', 'terminationDate'
      ]);
    });

    it('should set all chips as removable', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const chips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);
      chips.forEach(chip => {
        expect(chip.removable).toBe(true);
      });
    });
  });

  describe('removeFilterByChipKey', () => {


    it('should remove effective date and period together', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = DonorTestsFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result?.effectiveDate).toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
      expect(result?.interdiction).toBe('D01');
    });

    it('should remove termination date and period together', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      const result = DonorTestsFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');
      expect(result?.terminationDate).toBeNull();
      expect(result?.terminationDatePeriod).toBeNull();
    });


    it('should not mutate the original filters', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      DonorTestsFilterChipsUtils.removeFilterByChipKey(filters, 'interdiction');
      expect(filters.interdiction).toBe('D01');
    });
  });

  describe('hasActiveFilters', () => {


    it('should return true when interdiction is set', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(DonorTestsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });



    it('should return true when multiple filters are active', () => {
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(DonorTestsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
