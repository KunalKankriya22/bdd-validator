import { buildStrongReactivityFilterChips } from './filter-chips.utils';
import { StrongReactivityFilterValue } from '../models/strong-reactivity.model';
import moment from 'moment';

describe('buildStrongReactivityFilterChips', () => {
  const emptyFilters: StrongReactivityFilterValue = {
    epitopeId1: null,
    epitopeId2: null,
    bound: null,
    effectivePeriod: null,
    effectiveDate: null,
    terminationPeriod: null,
    terminationDate: null,
  };

  it('should return empty array when all filter fields are null', () => {
    const result = buildStrongReactivityFilterChips(emptyFilters);
    expect(result).toEqual([]);
  });

  describe('bound filter', () => {
    it('should create chip with label "Strong" when bound is "S"', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        bound: 'S',
      };

      const chips = buildStrongReactivityFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('bound');
      expect(chips[0].label).toBe('Bond: Strong');
      expect(chips[0].value).toBe('S');
      expect(chips[0].removable).toBe(true);
    });

    it('should create chip with label "Cross" when bound is "C"', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        bound: 'C',
      };

      const chips = buildStrongReactivityFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Bond: Cross');
    });

    it('should use raw value when bound is neither S nor C', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        bound: 'X',
      };

      const chips = buildStrongReactivityFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Bond: X');
    });

    it('should not create bound chip when bound is null', () => {
      const chips = buildStrongReactivityFilterChips(emptyFilters);

      const boundChips = chips.filter(c => c.key === 'bound');
      expect(boundChips.length).toBe(0);
    });
  });

  describe('effectiveDate filter', () => {
    it('should create chip with >= operator when period is "after"', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        effectivePeriod: 'after',
        effectiveDate: new Date('2025-03-15'),
      };

      const chips = buildStrongReactivityFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('15-MAR-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should create chip with <= operator when period is "before"', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        effectivePeriod: 'before',
        effectiveDate: new Date('2025-06-20'),
      };

      const chips = buildStrongReactivityFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Effective Date ≤');
      expect(chips[0].label).toContain('20-JUN-2025');
    });

    it('should create chip with = operator when period is unknown', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        effectivePeriod: 'on',
        effectiveDate: new Date('2025-01-01'),
      };

      const chips = buildStrongReactivityFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Effective Date = ');
    });

    it('should not create chip when effectiveDate is set but period is null', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        effectiveDate: new Date('2025-03-15'),
      };

      const chips = buildStrongReactivityFilterChips(filters);
      expect(chips.filter(c => c.key === 'effectiveDate').length).toBe(0);
    });

    it('should not create chip when period is set but date is null', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        effectivePeriod: 'after',
      };

      const chips = buildStrongReactivityFilterChips(filters);
      expect(chips.filter(c => c.key === 'effectiveDate').length).toBe(0);
    });
  });

  describe('terminationDate filter', () => {
    it('should create chip with >= operator when period is "after"', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        terminationPeriod: 'after',
        terminationDate: new Date('2025-12-31'),
      };

      const chips = buildStrongReactivityFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date ≥');
      expect(chips[0].label).toContain('31-DEC-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should create chip with <= operator when period is "before"', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        terminationPeriod: 'before',
        terminationDate: new Date('2025-01-01'),
      };

      const chips = buildStrongReactivityFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Termination Date ≤');
    });

    it('should not create chip when terminationDate is null', () => {
      const filters: StrongReactivityFilterValue = {
        ...emptyFilters,
        terminationPeriod: 'after',
      };

      const chips = buildStrongReactivityFilterChips(filters);
      expect(chips.filter(c => c.key === 'terminationDate').length).toBe(0);
    });
  });

  describe('all filters populated', () => {
    it('should create chips for all active filters', () => {
      const filters: StrongReactivityFilterValue = {
        epitopeId1: 'E001',
        epitopeId2: 'E002',
        bound: 'S',
        effectivePeriod: 'after',
        effectiveDate: new Date('2025-01-01'),
        terminationPeriod: 'before',
        terminationDate: new Date('2025-12-31'),
      };

      const chips = buildStrongReactivityFilterChips(filters);

      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('bound');
      expect(chips[1].key).toBe('effectiveDate');
      expect(chips[2].key).toBe('terminationDate');
    });
  });
});
