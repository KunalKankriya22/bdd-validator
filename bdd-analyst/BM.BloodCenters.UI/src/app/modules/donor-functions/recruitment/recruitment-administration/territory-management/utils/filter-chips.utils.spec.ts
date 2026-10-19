import { buildTerritoryFilterChips } from './filter-chips.utils';
import { TerritoryFilterValue } from '../models/territory.model';

describe('buildTerritoryFilterChips', () => {
  const emptyFilters: TerritoryFilterValue = {
    showTerminated: false,
    territoryGroup: null,
    territoryType: null,
    effDatePeriod: null,
    effDate: null,
    termDatePeriod: null,
    termDate: null,
  };

  it('should return empty array when all filter fields are default/null', () => {
    const result = buildTerritoryFilterChips(emptyFilters);
    expect(result).toEqual([]);
  });

  describe('showTerminated filter', () => {
    it('should create chip when showTerminated is true', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        showTerminated: true,
      };

      const chips = buildTerritoryFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('showTerminated');
      expect(chips[0].label).toBe('Show Terminated');
      expect(chips[0].value).toBe(true);
      expect(chips[0].removable).toBe(true);
    });

    it('should not create chip when showTerminated is false', () => {
      const chips = buildTerritoryFilterChips(emptyFilters);
      expect(chips.filter(c => c.key === 'showTerminated').length).toBe(0);
    });
  });

  describe('territoryGroup filter', () => {
    it('should create chip when territoryGroup is set', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        territoryGroup: 'Group A',
      };

      const chips = buildTerritoryFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('territoryGroup');
      expect(chips[0].label).toBe('Group: Group A');
      expect(chips[0].value).toBe('Group A');
      expect(chips[0].removable).toBe(true);
    });

    it('should not create chip when territoryGroup is null', () => {
      const chips = buildTerritoryFilterChips(emptyFilters);
      expect(chips.filter(c => c.key === 'territoryGroup').length).toBe(0);
    });
  });

  describe('territoryType filter', () => {
    it('should create chip when territoryType is set', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        territoryType: 'Region',
      };

      const chips = buildTerritoryFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('territoryType');
      expect(chips[0].label).toBe('Type: Region');
      expect(chips[0].value).toBe('Region');
      expect(chips[0].removable).toBe(true);
    });

    it('should not create chip when territoryType is null', () => {
      const chips = buildTerritoryFilterChips(emptyFilters);
      expect(chips.filter(c => c.key === 'territoryType').length).toBe(0);
    });
  });

  describe('effDate filter', () => {
    it('should create chip with >= operator when period is "after"', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        effDatePeriod: 'after',
        effDate: new Date('2025-03-15'),
      };

      const chips = buildTerritoryFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('15-MAR-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should create chip with <= operator when period is "before"', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        effDatePeriod: 'before',
        effDate: new Date('2025-06-20'),
      };

      const chips = buildTerritoryFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Effective Date ≤');
    });

    it('should create chip with = operator when period is unknown', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        effDatePeriod: 'on',
        effDate: new Date('2025-01-01'),
      };

      const chips = buildTerritoryFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Effective Date = ');
    });

    it('should not create chip when date is set but period is null', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        effDate: new Date('2025-03-15'),
      };

      const chips = buildTerritoryFilterChips(filters);
      expect(chips.filter(c => c.key === 'effDate').length).toBe(0);
    });

    it('should not create chip when period is set but date is null', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        effDatePeriod: 'after',
      };

      const chips = buildTerritoryFilterChips(filters);
      expect(chips.filter(c => c.key === 'effDate').length).toBe(0);
    });
  });

  describe('termDate filter', () => {
    it('should create chip with >= operator when period is "after"', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        termDatePeriod: 'after',
        termDate: new Date('2025-12-31'),
      };

      const chips = buildTerritoryFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('Termination Date ≥');
      expect(chips[0].label).toContain('31-DEC-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should create chip with <= operator when period is "before"', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        termDatePeriod: 'before',
        termDate: new Date('2025-01-01'),
      };

      const chips = buildTerritoryFilterChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Termination Date ≤');
    });

    it('should not create chip when terminationDate is null', () => {
      const filters: TerritoryFilterValue = {
        ...emptyFilters,
        termDatePeriod: 'after',
      };

      const chips = buildTerritoryFilterChips(filters);
      expect(chips.filter(c => c.key === 'termDate').length).toBe(0);
    });
  });

  describe('all filters populated', () => {
    it('should create chips for all active filters', () => {
      const filters: TerritoryFilterValue = {
        showTerminated: true,
        territoryGroup: 'Group A',
        territoryType: 'Region',
        effDatePeriod: 'after',
        effDate: new Date('2025-01-01'),
        termDatePeriod: 'before',
        termDate: new Date('2025-12-31'),
      };

      const chips = buildTerritoryFilterChips(filters);

      expect(chips.length).toBe(5);
      expect(chips.map(c => c.key)).toEqual([
        'showTerminated', 'territoryGroup', 'territoryType', 'effDate', 'termDate'
      ]);
    });
  });
});
