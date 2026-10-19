import { UserAccountFilterChipsUtils } from './filter-chips.utils';
import { UserAccountFilter } from '../filter/user-account-filter/user-account-filter';

describe('UserAccountFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should create chip for effective date filter', () => {
      const filters: UserAccountFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date(new Date().getFullYear(), 0, 15),
        terminationDatePeriod: 'BEFORE',
        terminationDate: null,
        accountStatus: null
      };

      const chips = UserAccountFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date');
      expect(chips[0].label).toContain('≥');
    });

    it('should create chip for termination date filter', () => {
      const filters: UserAccountFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date(new Date().getFullYear(), 11, 31),
        accountStatus: null
      };

      const chips = UserAccountFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date');
      expect(chips[0].label).toContain('≤');
    });

    it('should create chips for both date filters', () => {
      const filters: UserAccountFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date(new Date().getFullYear(), 0, 1),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date(new Date().getFullYear(), 11, 31),
        accountStatus: null
      };

      const chips = UserAccountFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[1].key).toBe('terminationDate');
    });

    it('should create chip for account status filter', () => {
      const filters: UserAccountFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: null,
        accountStatus: 'ACTIVE'
      };

      const chips = UserAccountFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('accountStatus');
      expect(chips[0].label).toContain('Account Status: Unlocked');
    });

  });

  describe('removeFilterByChipKey', () => {


    it('should keep termination date when removing effective date', () => {
      const filters: UserAccountFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date(new Date().getFullYear(), 0, 15),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date(new Date().getFullYear(), 11, 31),
        accountStatus: null
      };

      const result = UserAccountFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result?.effectiveDate).toBeNull();
      expect(result?.terminationDate).toBeTruthy();
    });


    it('should keep other filters when removing account status', () => {
      const filters: UserAccountFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date(new Date().getFullYear(), 0, 15),
        terminationDatePeriod: 'BEFORE',
        terminationDate: null,
        accountStatus: 'LOCKED'
      };

      const result = UserAccountFilterChipsUtils.removeFilterByChipKey(filters, 'accountStatus');

      expect(result).not.toBeNull();
      expect(result?.accountStatus).toBeNull();
      expect(result?.effectiveDate).toBeTruthy();
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false when no dates are set', () => {
      const filters: UserAccountFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: null,
        accountStatus: null
      };

      expect(UserAccountFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when effective date is set', () => {
      const filters: UserAccountFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date(new Date().getFullYear(), 0, 15),
        terminationDatePeriod: 'BEFORE',
        terminationDate: null,
        accountStatus: null
      };

      expect(UserAccountFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termination date is set', () => {
      const filters: UserAccountFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date(new Date().getFullYear(), 11, 31),
        accountStatus: null
      };

      expect(UserAccountFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when account status is set', () => {
      const filters: UserAccountFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: null,
        accountStatus: 'ACTIVE'
      };

      expect(UserAccountFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
