import { MaintainDriveLocationFilterChipsUtils } from './filter-chips.utils';
import { DriveLocationFilterFormValue } from '../models/maintain-drive-location.model';

describe('MaintainDriveLocationFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when no date filters are set', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: null,
        effDatePeriod: null,
        termDate: null,
        termDatePeriod: null,
        showTerminated: false,
      };

      const result = MaintainDriveLocationFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create effective date chip with >= when period is AFTER', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: '01-JAN-2025',
        effDatePeriod: 'AFTER',
        termDate: null,
        termDatePeriod: null,
        showTerminated: false,
      };

      const chips = MaintainDriveLocationFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effDate');
      expect(chips[0].label).toContain('Effective Date ≥');
      expect(chips[0].label).toContain('01-JAN-2025');
      expect(chips[0].value).toBe('AFTER:01-JAN-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should create effective date chip with <= when period is BEFORE', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: '31-DEC-2025',
        effDatePeriod: 'BEFORE',
        termDate: null,
        termDatePeriod: null,
        showTerminated: false,
      };

      const chips = MaintainDriveLocationFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Effective Date ≤');
      expect(chips[0].label).toContain('31-DEC-2025');
      expect(chips[0].value).toBe('BEFORE:31-DEC-2025');
    });

    it('should not create effective date chip when date is set but period is null', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: '01-JAN-2025',
        effDatePeriod: null,
        termDate: null,
        termDatePeriod: null,
        showTerminated: false,
      };

      const result = MaintainDriveLocationFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

    it('should not create effective date chip when period is set but date is null', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: null,
        effDatePeriod: 'AFTER',
        termDate: null,
        termDatePeriod: null,
        showTerminated: false,
      };

      const result = MaintainDriveLocationFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(0);
    });

    it('should create termination date chip with >= when period is AFTER', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: null,
        effDatePeriod: null,
        termDate: '01-JUN-2025',
        termDatePeriod: 'AFTER',
        showTerminated: false,
      };

      const chips = MaintainDriveLocationFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('termDate');
      expect(chips[0].label).toContain('Termination Date ≥');
      expect(chips[0].label).toContain('01-JUN-2025');
      expect(chips[0].removable).toBe(true);
    });

    it('should create termination date chip with <= when period is BEFORE', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: null,
        effDatePeriod: null,
        termDate: '31-DEC-2025',
        termDatePeriod: 'BEFORE',
        showTerminated: false,
      };

      const chips = MaintainDriveLocationFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('Termination Date ≤');
    });

    it('should create both chips when both date filters are set', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: '01-JAN-2025',
        effDatePeriod: 'AFTER',
        termDate: '31-DEC-2025',
        termDatePeriod: 'BEFORE',
        showTerminated: false,
      };

      const chips = MaintainDriveLocationFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('effDate');
      expect(chips[1].key).toBe('termDate');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should clear effDate and effDatePeriod when removing effDate chip', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: '01-JAN-2025',
        effDatePeriod: 'AFTER',
        termDate: '31-DEC-2025',
        termDatePeriod: 'BEFORE',
        showTerminated: false,
      };

      const result = MaintainDriveLocationFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');

      expect(result.effDate).toBeNull();
      expect(result.effDatePeriod).toBeNull();
      expect(result.termDate).toBe('31-DEC-2025');
      expect(result.termDatePeriod).toBe('BEFORE');
    });

    it('should clear termDate and termDatePeriod when removing termDate chip', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: '01-JAN-2025',
        effDatePeriod: 'AFTER',
        termDate: '31-DEC-2025',
        termDatePeriod: 'BEFORE',
        showTerminated: false,
      };

      const result = MaintainDriveLocationFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');

      expect(result.termDate).toBeNull();
      expect(result.termDatePeriod).toBeNull();
      expect(result.effDate).toBe('01-JAN-2025');
    });

    it('should not modify filters when unknown chip key is provided', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: '01-JAN-2025',
        effDatePeriod: 'AFTER',
        termDate: null,
        termDatePeriod: null,
        showTerminated: false,
      };

      const result = MaintainDriveLocationFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result.effDate).toBe('01-JAN-2025');
      expect(result.effDatePeriod).toBe('AFTER');
    });

    it('should not mutate the original filters object', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: '01-JAN-2025',
        effDatePeriod: 'AFTER',
        termDate: null,
        termDatePeriod: null,
        showTerminated: false,
      };

      MaintainDriveLocationFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');

      expect(filters.effDate).toBe('01-JAN-2025');
      expect(filters.effDatePeriod).toBe('AFTER');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(MaintainDriveLocationFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when both date fields are null', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: null,
        effDatePeriod: null,
        termDate: null,
        termDatePeriod: null,
        showTerminated: false,
      };
      expect(MaintainDriveLocationFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effDate is set', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: '01-JAN-2025',
        effDatePeriod: 'AFTER',
        termDate: null,
        termDatePeriod: null,
        showTerminated: false,
      };
      expect(MaintainDriveLocationFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termDate is set', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: null,
        effDatePeriod: null,
        termDate: '31-DEC-2025',
        termDatePeriod: 'BEFORE',
        showTerminated: false,
      };
      expect(MaintainDriveLocationFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when both dates are set', () => {
      const filters: DriveLocationFilterFormValue = {
        effDate: '01-JAN-2025',
        effDatePeriod: 'AFTER',
        termDate: '31-DEC-2025',
        termDatePeriod: 'BEFORE',
        showTerminated: false,
      };
      expect(MaintainDriveLocationFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
