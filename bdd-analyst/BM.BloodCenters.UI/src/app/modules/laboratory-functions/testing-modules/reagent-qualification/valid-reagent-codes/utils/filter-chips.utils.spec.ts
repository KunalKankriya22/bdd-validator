import { ValidReagentCodeFilterChipsUtils } from './filter-chips.utils';
import { ValidReagentCodeFilterValue } from '../models/valid-reagent-code.model';

describe('ValidReagentCodeFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(ValidReagentCodeFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array when no filters are set', () => {
      const filters = {} as ValidReagentCodeFilterValue;
      expect(ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters)).toEqual([]);
    });

    it('should create chip for showTerminated with Y value', () => {
      const filters = { showTerminated: 'Y' } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'showTerminated',
        label: 'Show Terminated: Yes',
        value: 'Y',
        removable: true,
      });
    });

    it('should create chip for showTerminated with N value', () => {
      const filters = { showTerminated: 'N' } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].label).toBe('Show Terminated: No');
    });

    it('should create chip for reagentType R with mapped label', () => {
      const filters = { reagentType: 'R' } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'reagentType',
        label: 'R Type: R-Reagent',
        value: 'R',
        removable: true,
      });
    });

    it('should create chip for reagentType C with mapped label', () => {
      const filters = { reagentType: 'C' } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toBe('R Type: C-Control');
    });

    it('should create chip for reagentType S with mapped label', () => {
      const filters = { reagentType: 'S' } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toBe('R Type: S-Substrate');
    });

    it('should create chip for unknown reagentType with raw value', () => {
      const filters = { reagentType: 'X' } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toBe('R Type: X');
    });

    it('should create chip for controlFlag P with mapped label', () => {
      const filters = { controlFlag: 'P' } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'controlFlag',
        label: 'Control: POS',
        value: 'P',
        removable: true,
      });
    });

    it('should create chip for controlFlag N with mapped label', () => {
      const filters = { controlFlag: 'N' } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toBe('Control: NEG');
    });

    it('should create chip for unknown controlFlag with raw value', () => {
      const filters = { controlFlag: 'U' } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toBe('Control: U');
    });

    it('should create chip for effectiveDate with After period', () => {
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDateAfter: '2024-03-15',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date');
      expect(result[0].label).toContain('≥');
      expect(result[0].label).toContain('15-MAR-2024');
    });

    it('should create chip for effectiveDate with Before period', () => {
      const filters = {
        effectiveDatePeriod: 'Before',
        effectiveDateAfter: '2024-03-15',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should create chip for effectiveDate with On or After period', () => {
      const filters = {
        effectiveDatePeriod: 'On or After',
        effectiveDateAfter: '2024-03-15',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
    });

    it('should create chip for effectiveDate with On or Before period', () => {
      const filters = {
        effectiveDatePeriod: 'On or Before',
        effectiveDateAfter: '2024-03-15',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≤');
    });

    it('should not create chip for effectiveDate when period is missing', () => {
      const filters = {
        effectiveDateAfter: '2024-03-15',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      const effChip = result.find(c => c.key === 'effectiveDate');
      expect(effChip).toBeUndefined();
    });

    it('should not create chip for effectiveDate when date is missing', () => {
      const filters = {
        effectiveDatePeriod: 'After',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      const effChip = result.find(c => c.key === 'effectiveDate');
      expect(effChip).toBeUndefined();
    });

    it('should create chip for terminationDate with After period', () => {
      const filters = {
        terminationDatePeriod: 'After',
        terminationDateAfter: '2025-12-31',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date');
      expect(result[0].label).toContain('≥');
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        showTerminated: 'Y',
        reagentType: 'R',
        controlFlag: 'P',
        effectiveDatePeriod: 'After',
        effectiveDateAfter: '2024-01-01',
        terminationDatePeriod: 'Before',
        terminationDateAfter: '2025-12-31',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(5);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(ValidReagentCodeFilterChipsUtils.removeFilterByChipKey(null, 'showTerminated')).toBeNull();
    });

    it('should set showTerminated to null when removing showTerminated chip', () => {
      const filters = {
        showTerminated: 'Y',
        reagentType: 'R',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.removeFilterByChipKey(filters, 'showTerminated');

      expect(result).not.toBeNull();
      expect(result!.showTerminated).toBeNull();
      expect(result!.reagentType).toBe('R');
    });

    it('should set reagentType and controlFlag to null when removing reagentType chip', () => {
      const filters = {
        reagentType: 'R',
        controlFlag: 'P',
        showTerminated: 'Y',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.removeFilterByChipKey(filters, 'reagentType');

      expect(result).not.toBeNull();
      expect(result!.reagentType).toBeNull();
      expect(result!.controlFlag).toBeNull();
    });

    it('should set only controlFlag to null when removing controlFlag chip', () => {
      const filters = {
        reagentType: 'R',
        controlFlag: 'P',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.removeFilterByChipKey(filters, 'controlFlag');

      expect(result).not.toBeNull();
      expect(result!.controlFlag).toBeNull();
      expect(result!.reagentType).toBe('R');
    });

    it('should set effectiveDate fields to null when removing effectiveDate chip', () => {
      const filters = {
        effectiveDatePeriod: 'After',
        effectiveDateAfter: '2024-01-01',
        reagentType: 'R',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDatePeriod).toBeNull();
      expect(result!.effectiveDateAfter).toBeNull();
    });

    it('should set terminationDate fields to null when removing terminationDate chip', () => {
      const filters = {
        terminationDatePeriod: 'Before',
        terminationDateAfter: '2025-12-31',
        reagentType: 'R',
      } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDatePeriod).toBeNull();
      expect(result!.terminationDateAfter).toBeNull();
    });

    it('should always return updatedFilters (not null) even when all filters cleared', () => {
      const filters = { showTerminated: 'Y' } as ValidReagentCodeFilterValue;
      const result = ValidReagentCodeFilterChipsUtils.removeFilterByChipKey(filters, 'showTerminated');

      expect(result).not.toBeNull();
    });

    it('should not mutate original filters', () => {
      const filters = {
        showTerminated: 'Y',
        reagentType: 'R',
      } as ValidReagentCodeFilterValue;
      ValidReagentCodeFilterChipsUtils.removeFilterByChipKey(filters, 'showTerminated');

      expect(filters.showTerminated).toBe('Y');
    });
  });
});
