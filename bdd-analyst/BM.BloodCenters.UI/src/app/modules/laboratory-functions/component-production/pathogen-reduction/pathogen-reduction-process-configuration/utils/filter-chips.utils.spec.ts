import { PathogenReductionProcessConfigurationFilterChipsUtils } from './filter-chips.utils';
import { PathogenReductionProcessConfigurationFilterValue } from '../models/pathogen-reduction-process-configuration.model';

describe('PathogenReductionProcessConfigurationFilterChipsUtils', () => {

  function makeFilters(overrides: Partial<PathogenReductionProcessConfigurationFilterValue> = {}): PathogenReductionProcessConfigurationFilterValue {
    return {
      volumeTypeSet: null,
      suspensionType: null,
      equipType: null,
      effDate: null,
      effDatePeriod: null,
      termDate: null,
      termDatePeriod: null,
      ...overrides
    };
  }

  describe('convertFiltersToChips', () => {

    it('should convert volumeTypeSet filter to chip', () => {
      const filters = makeFilters({ volumeTypeSet: 'VST001' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('volumeTypeSet');
      expect(chips[0].label).toContain('VST001');
    });

    it('should format effective date with BEFORE period', () => {
      const filters = makeFilters({ effDate: '2024-01-01', effDatePeriod: 'BEFORE' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toContain('≤');
    });

    it('should format effective date with AFTER period', () => {
      const filters = makeFilters({ effDate: '2024-01-01', effDatePeriod: 'AFTER' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toContain('≥');
    });

    it('should return an empty array when filters is null', () => {
      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return an empty array when all filter values are null', () => {
      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(makeFilters());
      expect(chips).toEqual([]);
    });

    it('should convert suspensionType filter to chip', () => {
      const filters = makeFilters({ suspensionType: 'PAS-C' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('suspensionType');
      expect(chips[0].label).toBe('Suspension Type: PAS-C');
      expect(chips[0].value).toBe('PAS-C');
    });

    it('should convert equipType filter to chip', () => {
      const filters = makeFilters({ equipType: 'ILLUMINATOR' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('equipType');
      expect(chips[0].label).toBe('Equipment Type: ILLUMINATOR');
      expect(chips[0].value).toBe('ILLUMINATOR');
    });

    it('should format termination date with BEFORE period', () => {
      const filters = makeFilters({ termDate: '2024-06-15', termDatePeriod: 'BEFORE' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('15-JUN-2024');
      expect(chips[0].value).toBe('2024-06-15');
    });

    it('should format termination date with AFTER period', () => {
      const filters = makeFilters({ termDate: '2024-12-31', termDatePeriod: 'AFTER' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('31-DEC-2024');
    });

    it('should not create effDate chip when effDate is set but effDatePeriod is null', () => {
      const filters = makeFilters({ effDate: '2024-01-01', effDatePeriod: null });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create effDate chip when effDatePeriod is set but effDate is null', () => {
      const filters = makeFilters({ effDate: null, effDatePeriod: 'AFTER' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create termDate chip when termDate is set but termDatePeriod is null', () => {
      const filters = makeFilters({ termDate: '2024-06-15', termDatePeriod: null });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create termDate chip when termDatePeriod is set but termDate is null', () => {
      const filters = makeFilters({ termDate: null, termDatePeriod: 'BEFORE' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should create multiple chips when multiple filters are set', () => {
      const filters = makeFilters({
        volumeTypeSet: 'VST001',
        suspensionType: 'PAS-C',
        equipType: 'ILLUMINATOR',
        effDate: '2024-01-01',
        effDatePeriod: 'AFTER',
        termDate: '2024-12-31',
        termDatePeriod: 'BEFORE'
      });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(5);

      const keys = chips.map(c => c.key);
      expect(keys).toEqual(['volumeTypeSet', 'suspensionType', 'equipType', 'effDate', 'termDate']);
    });

    it('should format effective date label with formatted date string', () => {
      const filters = makeFilters({ effDate: '2024-03-15', effDatePeriod: 'BEFORE' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toBe('Effective Date ≤ 15-MAR-2024');
    });

    it('should return raw date string in label when date is invalid', () => {
      const filters = makeFilters({ effDate: 'not-a-date', effDatePeriod: 'AFTER' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].label).toContain('not-a-date');
    });

    it('should set value property to the filter value on volumeTypeSet chip', () => {
      const filters = makeFilters({ volumeTypeSet: 'VST002' });

      const chips = PathogenReductionProcessConfigurationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips[0].value).toBe('VST002');
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should return null when filters is null', () => {
      const result = PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(null, 'volumeTypeSet');
      expect(result).toBeNull();
    });

    it('should remove volumeTypeSet and return null when no other active filters', () => {
      const filters = makeFilters({ volumeTypeSet: 'VST001' });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(filters, 'volumeTypeSet');
      expect(result).toBeNull();
    });

    it('should remove volumeTypeSet and return remaining filters when others are active', () => {
      const filters = makeFilters({ volumeTypeSet: 'VST001', suspensionType: 'PAS-C' });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(filters, 'volumeTypeSet');
      expect(result).not.toBeNull();
      expect(result!.volumeTypeSet).toBeNull();
      expect(result!.suspensionType).toBe('PAS-C');
    });

    it('should remove suspensionType filter', () => {
      const filters = makeFilters({ suspensionType: 'PAS-C', equipType: 'ILLUMINATOR' });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(filters, 'suspensionType');
      expect(result).not.toBeNull();
      expect(result!.suspensionType).toBeNull();
      expect(result!.equipType).toBe('ILLUMINATOR');
    });

    it('should remove equipType filter', () => {
      const filters = makeFilters({ equipType: 'ILLUMINATOR', volumeTypeSet: 'VST001' });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(filters, 'equipType');
      expect(result).not.toBeNull();
      expect(result!.equipType).toBeNull();
      expect(result!.volumeTypeSet).toBe('VST001');
    });

    it('should remove effDate and effDatePeriod together', () => {
      const filters = makeFilters({
        effDate: '2024-01-01',
        effDatePeriod: 'AFTER',
        volumeTypeSet: 'VST001'
      });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');
      expect(result).not.toBeNull();
      expect(result!.effDate).toBeNull();
      expect(result!.effDatePeriod).toBeNull();
      expect(result!.volumeTypeSet).toBe('VST001');
    });

    it('should remove termDate and termDatePeriod together', () => {
      const filters = makeFilters({
        termDate: '2024-12-31',
        termDatePeriod: 'BEFORE',
        volumeTypeSet: 'VST001'
      });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');
      expect(result).not.toBeNull();
      expect(result!.termDate).toBeNull();
      expect(result!.termDatePeriod).toBeNull();
      expect(result!.volumeTypeSet).toBe('VST001');
    });

    it('should return null when removing the last active filter', () => {
      const filters = makeFilters({ equipType: 'ILLUMINATOR' });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(filters, 'equipType');
      expect(result).toBeNull();
    });

    it('should return null when removing the last active date filter pair', () => {
      const filters = makeFilters({ termDate: '2024-12-31', termDatePeriod: 'BEFORE' });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters = makeFilters({ volumeTypeSet: 'VST001', suspensionType: 'PAS-C' });

      PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(filters, 'volumeTypeSet');
      expect(filters.volumeTypeSet).toBe('VST001');
    });

    it('should return filters unchanged for an unknown chip key', () => {
      const filters = makeFilters({ volumeTypeSet: 'VST001' });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');
      expect(result).not.toBeNull();
      expect(result!.volumeTypeSet).toBe('VST001');
    });
  });

  describe('hasActiveFilters', () => {

    it('should return true when volumeTypeSet is set', () => {
      const filters = makeFilters({ volumeTypeSet: 'VST001' });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when date filter is set with period', () => {
      const filters = makeFilters({ effDate: '2024-01-01', effDatePeriod: 'AFTER' });

      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return false when filters is null', () => {
      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(null);
      expect(result).toBeFalse();
    });

    it('should return false when all filter values are null', () => {
      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(makeFilters());
      expect(result).toBeFalse();
    });

    it('should return true when suspensionType is set', () => {
      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(
        makeFilters({ suspensionType: 'PAS-C' })
      );
      expect(result).toBeTrue();
    });

    it('should return true when equipType is set', () => {
      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(
        makeFilters({ equipType: 'ILLUMINATOR' })
      );
      expect(result).toBeTrue();
    });

    it('should return true when termDate and termDatePeriod are set', () => {
      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(
        makeFilters({ termDate: '2024-12-31', termDatePeriod: 'BEFORE' })
      );
      expect(result).toBeTrue();
    });

    it('should return false when effDate is set but effDatePeriod is null', () => {
      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(
        makeFilters({ effDate: '2024-01-01', effDatePeriod: null })
      );
      expect(result).toBeFalse();
    });

    it('should return false when termDate is set but termDatePeriod is null', () => {
      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(
        makeFilters({ termDate: '2024-12-31', termDatePeriod: null })
      );
      expect(result).toBeFalse();
    });

    it('should return false when effDatePeriod is set but effDate is null', () => {
      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(
        makeFilters({ effDate: null, effDatePeriod: 'AFTER' })
      );
      expect(result).toBeFalse();
    });

    it('should return true when multiple filters are active', () => {
      const result = PathogenReductionProcessConfigurationFilterChipsUtils.hasActiveFilters(
        makeFilters({
          volumeTypeSet: 'VST001',
          suspensionType: 'PAS-C',
          effDate: '2024-01-01',
          effDatePeriod: 'AFTER'
        })
      );
      expect(result).toBeTrue();
    });
  });
});
