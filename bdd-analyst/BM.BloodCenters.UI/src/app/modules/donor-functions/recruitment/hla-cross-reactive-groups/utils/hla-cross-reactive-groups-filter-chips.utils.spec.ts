import { HlaCrossReactiveGroupsFilterChipsUtils } from './hla-cross-reactive-groups-filter-chips.utils';
import { HlaCrossReactiveGroupFilterValue } from '../models/hla-cross-reactive-groups.model';

describe('HlaCrossReactiveGroupsFilterChipsUtils', () => {

  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when filters is empty object', () => {
      expect(HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({})).toEqual([]);
    });

    it('should generate hlaStandard chip', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({ hlaStandard: 'AABB' });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('hlaStandard');
      expect(chips[0].label).toBe('Reference: AABB');
      expect(chips[0].value).toBe('AABB');
    });

    it('should generate effectiveDate chip with AFTER period (≥ sign)', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'AFTER',
        effectiveDate: '2025-01-15'
      });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('15-JAN-2025');
    });

    it('should generate effectiveDate chip with BEFORE period (≤ sign)', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'BEFORE',
        effectiveDate: '2025-03-20'
      });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≤');
    });

    it('should generate terminationDate chip with AFTER period', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        terminationPeriod: 'AFTER',
        terminationDate: '2025-12-31'
      });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('31-DEC-2025');
    });

    it('should generate terminationDate chip with BEFORE period', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        terminationPeriod: 'BEFORE',
        terminationDate: '2025-06-01'
      });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('≤');
    });

    it('should generate multiple chips when all filters set', () => {
      const filters: HlaCrossReactiveGroupFilterValue = {
        hlaStandard: 'CREG',
        effectivePeriod: 'AFTER',
        effectiveDate: '2025-01-01',
        terminationPeriod: 'BEFORE',
        terminationDate: '2025-12-31'
      };
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(3);
      expect(chips.map(c => c.key)).toEqual(['hlaStandard', 'effectiveDate', 'terminationDate']);
    });

    it('should not generate effectiveDate chip when only period is set without date', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'AFTER'
      });
      expect(chips.length).toBe(0);
    });

    it('should not generate terminationDate chip when only period is set without date', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        terminationPeriod: 'BEFORE'
      });
      expect(chips.length).toBe(0);
    });

    it('should format invalid date string as-is in chip label', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'AFTER',
        effectiveDate: 'not-a-date'
      });
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('not-a-date');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(HlaCrossReactiveGroupsFilterChipsUtils.removeFilterByChipKey(null, 'hlaStandard')).toBeNull();
    });

    it('should remove hlaStandard and return null when it was the only filter', () => {
      const result = HlaCrossReactiveGroupsFilterChipsUtils.removeFilterByChipKey(
        { hlaStandard: 'AABB' },
        'hlaStandard'
      );
      expect(result).toBeNull();
    });

    it('should remove hlaStandard and return remaining filters', () => {
      const result = HlaCrossReactiveGroupsFilterChipsUtils.removeFilterByChipKey(
        { hlaStandard: 'AABB', effectivePeriod: 'AFTER', effectiveDate: '2025-01-01' },
        'hlaStandard'
      );
      expect(result).not.toBeNull();
      expect(result!.hlaStandard).toBeUndefined();
      expect(result!.effectivePeriod).toBe('AFTER');
      expect(result!.effectiveDate).toBe('2025-01-01');
    });

    it('should remove effectiveDate and effectivePeriod together', () => {
      const result = HlaCrossReactiveGroupsFilterChipsUtils.removeFilterByChipKey(
        { hlaStandard: 'AABB', effectivePeriod: 'AFTER', effectiveDate: '2025-01-01' },
        'effectiveDate'
      );
      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeUndefined();
      expect(result!.effectivePeriod).toBeUndefined();
      expect(result!.hlaStandard).toBe('AABB');
    });

    it('should remove terminationDate and terminationPeriod together', () => {
      const result = HlaCrossReactiveGroupsFilterChipsUtils.removeFilterByChipKey(
        { hlaStandard: 'CREG', terminationPeriod: 'BEFORE', terminationDate: '2025-12-31' },
        'terminationDate'
      );
      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeUndefined();
      expect(result!.terminationPeriod).toBeUndefined();
      expect(result!.hlaStandard).toBe('CREG');
    });

    it('should return null after removing effectiveDate when it was the only filter', () => {
      const result = HlaCrossReactiveGroupsFilterChipsUtils.removeFilterByChipKey(
        { effectivePeriod: 'AFTER', effectiveDate: '2025-01-01' },
        'effectiveDate'
      );
      expect(result).toBeNull();
    });

    it('should return null after removing terminationDate when it was the only filter', () => {
      const result = HlaCrossReactiveGroupsFilterChipsUtils.removeFilterByChipKey(
        { terminationPeriod: 'BEFORE', terminationDate: '2025-12-31' },
        'terminationDate'
      );
      expect(result).toBeNull();
    });

    it('should handle unknown chipKey gracefully (no-op)', () => {
      const filters = { hlaStandard: 'AABB' };
      const result = HlaCrossReactiveGroupsFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');
      expect(result).not.toBeNull();
      expect(result!.hlaStandard).toBe('AABB');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false for null filters', () => {
      expect(HlaCrossReactiveGroupsFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false for empty filter object', () => {
      expect(HlaCrossReactiveGroupsFilterChipsUtils.hasActiveFilters({})).toBe(false);
    });

    it('should return true when hlaStandard is set', () => {
      expect(HlaCrossReactiveGroupsFilterChipsUtils.hasActiveFilters({ hlaStandard: 'AABB' })).toBe(true);
    });

    it('should return true when effectivePeriod and effectiveDate are set', () => {
      expect(HlaCrossReactiveGroupsFilterChipsUtils.hasActiveFilters({
        effectivePeriod: 'AFTER',
        effectiveDate: '2025-01-01'
      })).toBe(true);
    });

    it('should return true when terminationPeriod and terminationDate are set', () => {
      expect(HlaCrossReactiveGroupsFilterChipsUtils.hasActiveFilters({
        terminationPeriod: 'BEFORE',
        terminationDate: '2025-12-31'
      })).toBe(true);
    });

    it('should return false when effectivePeriod is set but effectiveDate is not', () => {
      expect(HlaCrossReactiveGroupsFilterChipsUtils.hasActiveFilters({
        effectivePeriod: 'AFTER'
      })).toBe(false);
    });

    it('should return false when terminationPeriod is set but terminationDate is not', () => {
      expect(HlaCrossReactiveGroupsFilterChipsUtils.hasActiveFilters({
        terminationPeriod: 'BEFORE'
      })).toBe(false);
    });
  });

  describe('getPeriodSign (private - tested via convertFiltersToChips)', () => {
    it('should use ≥ sign for AFTER period', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'AFTER',
        effectiveDate: '2025-01-01'
      });
      expect(chips[0].label).toContain('≥');
    });

    it('should use ≤ sign for BEFORE period', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'BEFORE',
        effectiveDate: '2025-01-01'
      });
      expect(chips[0].label).toContain('≤');
    });

    it('should return period as-is for unknown period value (default case)', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'UNKNOWN_PERIOD' as any,
        effectiveDate: '2025-01-01'
      });
      expect(chips[0].label).toContain('UNKNOWN_PERIOD');
    });

    it('should use ≥ sign for "After" (capitalized) period', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'After' as any,
        effectiveDate: '2025-01-01'
      });
      expect(chips[0].label).toContain('≥');
    });

    it('should use ≥ sign for "On or After" period', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'On or After' as any,
        effectiveDate: '2025-01-01'
      });
      expect(chips[0].label).toContain('≥');
    });

    it('should use ≤ sign for "Before" (capitalized) period', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'Before' as any,
        effectiveDate: '2025-01-01'
      });
      expect(chips[0].label).toContain('≤');
    });

    it('should use ≤ sign for "On or Before" period', () => {
      const chips = HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips({
        effectivePeriod: 'On or Before' as any,
        effectiveDate: '2025-01-01'
      });
      expect(chips[0].label).toContain('≤');
    });
  });
});
