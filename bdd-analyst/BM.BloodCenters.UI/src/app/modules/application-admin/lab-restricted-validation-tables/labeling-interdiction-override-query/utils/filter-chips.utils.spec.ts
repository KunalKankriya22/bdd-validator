import { LabelingInterdictionOverrideFilterChipsUtils } from './filter-chips.utils';
import { LabelingInterdictionOverrideFilterValue } from '../models/labeling-interdiction-override-query.model';

describe('LabelingInterdictionOverrideFilterChipsUtils', () => {
  const mockFilters: LabelingInterdictionOverrideFilterValue = {
    cue: 'DDC001',
    type: 'TypeA',
    effectiveDatePeriod: 'after',
    effectiveDate: new Date('2025-11-01'),
    terminationDatePeriod: null,
    terminationDate: null
  };

  describe('convertFiltersToChips', () => {

    it('should convert filters to chips', () => {
      const chips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(mockFilters);
      expect(chips.length).toBe(3);
    });

    it('should include cue chip when cue is set', () => {
      const chips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(mockFilters);
      const cueChip = chips.find(c => c.key === 'cue');
      expect(cueChip).toBeDefined();
      expect(cueChip?.label).toContain('DDC001');
      expect(cueChip?.value).toBe('DDC001');
    });

    it('should include type chip when type is set', () => {
      const chips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(mockFilters);
      const typeChip = chips.find(c => c.key === 'type');
      expect(typeChip).toBeDefined();
      expect(typeChip?.label).toContain('TypeA');
      expect(typeChip?.value).toBe('TypeA');
    });

    it('should include effectiveDate chip when effectiveDate is set', () => {
      const chips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(mockFilters);
      const effDateChip = chips.find(c => c.key === 'effectiveDate');
      expect(effDateChip).toBeDefined();
      expect(effDateChip?.label).toContain('Effective Date');
      expect(effDateChip?.label).toContain('≥');
      expect(effDateChip?.label).toContain('01-NOV-2025');
    });

    it('should include terminationDate chip when terminationDate is set', () => {
      const filtersWithTermDate: LabelingInterdictionOverrideFilterValue = {
        ...mockFilters,
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'before'
      };
      const chips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filtersWithTermDate);
      const termDateChip = chips.find(c => c.key === 'terminationDate');
      expect(termDateChip).toBeDefined();
      expect(termDateChip?.label).toContain('Termination Date');
      expect(termDateChip?.label).toContain('≤');
      expect(termDateChip?.label).toContain('31-DEC-2025');
    });




    it('should return empty array when all filter values are null', () => {
      const emptyFilters: LabelingInterdictionOverrideFilterValue = {
        cue: null,
        type: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      const chips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(emptyFilters);
      expect(chips.length).toBe(0);
    });
  });

  describe('hasActiveFilters', () => {
    it('should detect active filters when cue is set', () => {
      expect(LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(mockFilters)).toBeTrue();
    });


    it('should return true when only type is set', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        cue: null,
        type: 'TypeA',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when only effectiveDate is set', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        cue: null,
        type: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();
    });

    it('should return true when only terminationDate is set', () => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        cue: null,
        type: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };
      expect(LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(filters)).toBeTrue();
    });

    it('should return false when all filter values are null', () => {
      const emptyFilters: LabelingInterdictionOverrideFilterValue = {
        cue: null,
        type: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(emptyFilters)).toBeFalse();
    });
  });

  describe('removeFilterByChipKey', () => {


    it('should remove effectiveDate and effectiveDatePeriod by chip key', () => {
      const updated = LabelingInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(mockFilters, 'effectiveDate');
      expect(updated?.effectiveDate).toBeNull();
      expect(updated?.effectiveDatePeriod).toBeNull();
    });

    it('should remove terminationDate and terminationDatePeriod by chip key', () => {
      const filtersWithTermDate: LabelingInterdictionOverrideFilterValue = {
        ...mockFilters,
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'before'
      };
      const updated = LabelingInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(filtersWithTermDate, 'terminationDate');
      expect(updated?.terminationDate).toBeNull();
      expect(updated?.terminationDatePeriod).toBeNull();
    });



    it('should preserve other filters when removing one', () => {
      const updated = LabelingInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(mockFilters, 'cue');
      expect(updated?.type).toBe('TypeA');
      expect(updated?.effectiveDate).toEqual(new Date('2025-11-01'));
    });
  });
});
