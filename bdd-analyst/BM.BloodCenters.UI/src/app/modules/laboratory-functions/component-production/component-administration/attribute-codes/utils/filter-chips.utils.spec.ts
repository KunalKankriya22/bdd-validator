import { AttributeCodeFilterChipsUtils, AttributeCodeFilterCriteria } from './filter-chips.utils';

describe('AttributeCodeFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = AttributeCodeFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const filters: AttributeCodeFilterCriteria = {};

      const chips = AttributeCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should convert labelling filter to chip', () => {
      const filters: AttributeCodeFilterCriteria = { labelling: 'ISBT' };

      const chips = AttributeCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('labelling');
      expect(chips[0].label).toBe('Labelling: ISBT');
      expect(chips[0].value).toBe('ISBT');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert exclusivityFlag filter to chip', () => {
      const filters: AttributeCodeFilterCriteria = { exclusivityFlag: 'Y' };

      const chips = AttributeCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('exclusivityFlag');
      expect(chips[0].label).toBe('Exclusivity Flag: Y');
      expect(chips[0].value).toBe('Y');
      expect(chips[0].removable).toBe(true);
    });

    it('should convert effective date with period to chip', () => {
      const filters: AttributeCodeFilterCriteria = {
        effectiveDate: '2025-01-15',
        effectiveDatePeriod: 'After'
      };

      const chips = AttributeCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('After');
      expect(chips[0].value).toBe('2025-01-15');
      expect(chips[0].removable).toBe(true);
    });

    it('should not create effective date chip when date is set but period is missing', () => {
      const filters: AttributeCodeFilterCriteria = {
        effectiveDate: '2025-01-15'
      };

      const chips = AttributeCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create effective date chip when period is set but date is missing', () => {
      const filters: AttributeCodeFilterCriteria = {
        effectiveDatePeriod: 'After'
      };

      const chips = AttributeCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert termination date with period to chip', () => {
      const filters: AttributeCodeFilterCriteria = {
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'Before'
      };

      const chips = AttributeCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('Before');
      expect(chips[0].value).toBe('2025-12-31');
      expect(chips[0].removable).toBe(true);
    });

    it('should not create termination date chip when date is set but period is missing', () => {
      const filters: AttributeCodeFilterCriteria = {
        terminationDate: '2025-12-31'
      };

      const chips = AttributeCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: AttributeCodeFilterCriteria = {
        labelling: 'ISBT',
        exclusivityFlag: 'Y',
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'After',
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'Before'
      };

      const chips = AttributeCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(4);
      expect(chips[0].key).toBe('labelling');
      expect(chips[1].key).toBe('exclusivityFlag');
      expect(chips[2].key).toBe('effectiveDate');
      expect(chips[3].key).toBe('terminationDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = AttributeCodeFilterChipsUtils.removeFilterByChipKey(null, 'labelling');
      expect(result).toBeNull();
    });

    it('should remove labelling filter', () => {
      const filters: AttributeCodeFilterCriteria = {
        labelling: 'ISBT',
        exclusivityFlag: 'Y'
      };

      const result = AttributeCodeFilterChipsUtils.removeFilterByChipKey(filters, 'labelling');
      expect(result).not.toBeNull();
      expect(result!.labelling).toBeUndefined();
      expect(result!.exclusivityFlag).toBe('Y');
    });

    it('should remove exclusivityFlag filter', () => {
      const filters: AttributeCodeFilterCriteria = {
        labelling: 'ISBT',
        exclusivityFlag: 'Y'
      };

      const result = AttributeCodeFilterChipsUtils.removeFilterByChipKey(filters, 'exclusivityFlag');
      expect(result).not.toBeNull();
      expect(result!.exclusivityFlag).toBeUndefined();
      expect(result!.labelling).toBe('ISBT');
    });

    it('should remove effectiveDate and effectiveDatePeriod', () => {
      const filters: AttributeCodeFilterCriteria = {
        labelling: 'ISBT',
        effectiveDate: '2025-01-15',
        effectiveDatePeriod: 'After'
      };

      const result = AttributeCodeFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeUndefined();
      expect(result!.effectiveDatePeriod).toBeUndefined();
      expect(result!.labelling).toBe('ISBT');
    });

    it('should remove terminationDate and terminationDatePeriod', () => {
      const filters: AttributeCodeFilterCriteria = {
        labelling: 'ISBT',
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'Before'
      };

      const result = AttributeCodeFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');
      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeUndefined();
      expect(result!.terminationDatePeriod).toBeUndefined();
    });

    it('should return null when removing the last filter', () => {
      const filters: AttributeCodeFilterCriteria = { labelling: 'ISBT' };

      const result = AttributeCodeFilterChipsUtils.removeFilterByChipKey(filters, 'labelling');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: AttributeCodeFilterCriteria = {
        labelling: 'ISBT',
        exclusivityFlag: 'Y'
      };

      AttributeCodeFilterChipsUtils.removeFilterByChipKey(filters, 'labelling');
      expect(filters.labelling).toBe('ISBT');
    });
  });
});
