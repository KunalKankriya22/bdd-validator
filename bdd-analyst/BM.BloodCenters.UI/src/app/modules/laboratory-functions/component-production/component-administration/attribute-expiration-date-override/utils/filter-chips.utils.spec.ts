import { AttributeExpirationDateOverrideFilterChipsUtils } from './filter-chips.utils';
import { AttributeExpirationDateOverrideFilterValue } from '../models/attribute-expiration-date-override.model';
import { formatTableDate } from 'src/app/modules/system-administration/application-sequence-numbers/utils/table-display.util';

jest.mock('src/app/modules/system-administration/application-sequence-numbers/utils/table-display.util', () => ({
  formatTableDate: jest.fn((date: string) => {
    const d = new Date(date);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  })
}));

describe('AttributeExpirationDateOverrideFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {};

      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert overrideAttribute filter to chip', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        overrideAttribute: 'ATTR01'
      };

      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('overrideAttribute');
      expect(chips[0].label).toBe('Override Attribute: ATTR01');
      expect(chips[0].value).toBe('ATTR01');
    });

    it('should convert effective date with "before" period to chip using <= symbol', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'before'
      };

      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('≤');
      expect(chips[0].value).toBe('2025-01-15');
    });

    it('should convert effective date with "after" period to chip using >= symbol', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        effDate: '2025-06-30',
        effDatePeriod: 'after'
      };

      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≥');
    });

    it('should not create effective date chip when date is set but period is null', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: null
      };

      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create effective date chip when period is set but date is null', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        effDate: null,
        effDatePeriod: 'after'
      };

      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert termination date with "before" period to chip using <= symbol', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        termDate: '2025-12-31',
        termDatePeriod: 'before'
      };

      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≤');
    });

    it('should convert termination date with "after" period to chip using >= symbol', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        termDate: '2025-09-01',
        termDatePeriod: 'after'
      };

      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≥');
    });

    it('should not create termination date chip when date is set but period is null', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        termDate: '2025-12-31',
        termDatePeriod: null
      };

      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        overrideAttribute: 'ATTR01',
        effDate: '2025-01-01',
        effDatePeriod: 'after',
        termDate: '2025-12-31',
        termDatePeriod: 'before'
      };

      const chips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(chips[0].key).toBe('overrideAttribute');
      expect(chips[1].key).toBe('effDate');
      expect(chips[2].key).toBe('termDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = AttributeExpirationDateOverrideFilterChipsUtils.removeFilterByChipKey(null, 'overrideAttribute');
      expect(result).toBeNull();
    });

    it('should remove overrideAttribute filter', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        overrideAttribute: 'ATTR01',
        effDate: '2025-01-15',
        effDatePeriod: 'after'
      };

      const result = AttributeExpirationDateOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'overrideAttribute');
      expect(result).not.toBeNull();
      expect(result!.overrideAttribute).toBeNull();
      expect(result!.effDate).toBe('2025-01-15');
    });

    it('should remove effDate and effDatePeriod', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        overrideAttribute: 'ATTR01',
        effDate: '2025-01-15',
        effDatePeriod: 'after'
      };

      const result = AttributeExpirationDateOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result).not.toBeNull();
      expect(result!.effDate).toBeNull();
      expect(result!.effDatePeriod).toBeNull();
      expect(result!.overrideAttribute).toBe('ATTR01');
    });

    it('should remove termDate and termDatePeriod', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        overrideAttribute: 'ATTR01',
        termDate: '2025-12-31',
        termDatePeriod: 'before'
      };

      const result = AttributeExpirationDateOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');
      expect(result).not.toBeNull();
      expect(result!.termDate).toBeNull();
      expect(result!.termDatePeriod).toBeNull();
    });

    it('should return null when removing the last active filter', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        overrideAttribute: 'ATTR01'
      };

      const result = AttributeExpirationDateOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'overrideAttribute');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        overrideAttribute: 'ATTR01',
        effDate: '2025-01-15',
        effDatePeriod: 'after'
      };

      AttributeExpirationDateOverrideFilterChipsUtils.removeFilterByChipKey(filters, 'overrideAttribute');
      expect(filters.overrideAttribute).toBe('ATTR01');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(AttributeExpirationDateOverrideFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {};
      expect(AttributeExpirationDateOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when overrideAttribute is set', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        overrideAttribute: 'ATTR01'
      };
      expect(AttributeExpirationDateOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effDate and effDatePeriod are both set', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        effDate: '2025-01-15',
        effDatePeriod: 'after'
      };
      expect(AttributeExpirationDateOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only effDate is set without period', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        effDate: '2025-01-15'
      };
      expect(AttributeExpirationDateOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when termDate and termDatePeriod are both set', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        termDate: '2025-12-31',
        termDatePeriod: 'before'
      };
      expect(AttributeExpirationDateOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only termDatePeriod is set without date', () => {
      const filters: AttributeExpirationDateOverrideFilterValue = {
        termDatePeriod: 'before'
      };
      expect(AttributeExpirationDateOverrideFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
