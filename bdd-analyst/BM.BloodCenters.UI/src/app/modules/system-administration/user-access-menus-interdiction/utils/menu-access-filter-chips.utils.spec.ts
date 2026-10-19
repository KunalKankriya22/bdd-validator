import { MenuAccessFilterChipsUtils } from './menu-access-filter-chips.utils';
import { MenuAccessFilterValue } from '../models/user-access-filters.model';

describe('MenuAccessFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert menuTitle filter to chip', () => {
      const filters: MenuAccessFilterValue = {
        menuTitle: 'User Management',
        program: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = MenuAccessFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('menuTitle');
      expect(result[0].label).toBe('Menu Title: User Management');
      expect(result[0].value).toBe('User Management');
    });

    it('should convert program filter to chip', () => {
      const filters: MenuAccessFilterValue = {
        menuTitle: null,
        program: 'SYS',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = MenuAccessFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('program');
      expect(result[0].label).toBe('Program: SYS');
      expect(result[0].value).toBe('SYS');
    });

    it('should convert effectiveDate filter to chip with period', () => {
      const filters: MenuAccessFilterValue = {
        menuTitle: null,
        program: null,
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-15',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = MenuAccessFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date');
      expect(result[0].label).toContain('≥');
      expect(result[0].value).toBe('2025-01-15');
    });

    it('should convert terminationDate filter to chip with period', () => {
      const filters: MenuAccessFilterValue = {
        menuTitle: null,
        program: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31'
      };

      const result = MenuAccessFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date');
      expect(result[0].label).toContain('≤');
      expect(result[0].value).toBe('2025-12-31');
    });


    it('should use default period when not specified', () => {
      const filters: MenuAccessFilterValue = {
        menuTitle: null,
        program: null,
        effectiveDatePeriod: null,
        effectiveDate: '2025-01-15',
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = MenuAccessFilterChipsUtils.convertFiltersToChips(filters);

      expect(result[0].label).toContain('≥');
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove menuTitle filter', () => {
      const filters: MenuAccessFilterValue = {
        menuTitle: 'User Management',
        program: 'SYS',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = MenuAccessFilterChipsUtils.removeFilterByChipKey(filters, 'menuTitle');

      expect(result).not.toBeNull();
      expect(result?.menuTitle).toBeNull();
      expect(result?.program).toBe('SYS');
    });

    it('should remove program filter', () => {
      const filters: MenuAccessFilterValue = {
        menuTitle: 'User Management',
        program: 'SYS',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = MenuAccessFilterChipsUtils.removeFilterByChipKey(filters, 'program');

      expect(result).not.toBeNull();
      expect(result?.program).toBeNull();
      expect(result?.menuTitle).toBe('User Management');
    });




  });

  describe('hasActiveFilters', () => {


    it('should return true when menuTitle is set', () => {
      const filters: MenuAccessFilterValue = {
        menuTitle: 'User Management',
        program: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = MenuAccessFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when program is set', () => {
      const filters: MenuAccessFilterValue = {
        menuTitle: null,
        program: 'SYS',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = MenuAccessFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });



  });
});
