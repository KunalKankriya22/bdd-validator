import { TrayDefinitionFilterChipsUtils } from './filter-chips.utils';
import { TrayDefinitionFilterValue } from '../models/tray-definition.model';

describe('TrayDefinitionFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should return empty array when filters is null', () => {
      const result = TrayDefinitionFilterChipsUtils.convertFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when all filters are null-valued', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      const result = TrayDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should use ≤ symbol for Before period in effective date chip', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      const result = TrayDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].label).toContain('Effective Date ≤');
    });

    it('should use ≥ symbol for After period in termination date chip', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'After',
        terminationDate: new Date('2024-12-31')
      };
      const result = TrayDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result.length).toBe(1);
      expect(result[0].label).toContain('Termination Date ≥');
    });

    it('should default effective date to ≥ when effectiveDatePeriod is null', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      const result = TrayDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toContain('≥');
    });

    it('should default termination date to ≥ when terminationDatePeriod is null', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: new Date('2024-12-31')
      };
      const result = TrayDefinitionFilterChipsUtils.convertFiltersToChips(filters);
      expect(result[0].label).toContain('≥');
    });

    it('should convert tray status filter to chip', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'IN',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = TrayDefinitionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('trayStatus');
      expect(result[0].label).toBe('Status: IN');
      expect(result[0].value).toBe('IN');
    });

    it('should convert effective date filter to chip with period', () => {
      const testDate = new Date('2024-06-01');
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: 'After',
        effectiveDate: testDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = TrayDefinitionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date ≥');
      expect(result[0].label).toContain('01-JUN-2024');
    });

    it('should convert termination date filter to chip with period', () => {
      const testDate = new Date('2024-12-31');
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: testDate
      };

      const result = TrayDefinitionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date ≤');
      expect(result[0].label).toContain('31-DEC-2024');
    });

    it('should convert all filters to chips', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'OU',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };

      const result = TrayDefinitionFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(3);
      expect(result[0].key).toBe('trayStatus');
      expect(result[1].key).toBe('effectiveDate');
      expect(result[2].key).toBe('terminationDate');
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should return null when filters is null', () => {
      const result = TrayDefinitionFilterChipsUtils.removeFilterByChipKey(null, 'trayStatus');
      expect(result).toBeNull();
    });

    it('should return null when removing trayStatus and it is the only active filter', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'IN',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      const result = TrayDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'trayStatus');
      expect(result).toBeNull();
    });

    it('should remove trayStatus while preserving other active filters', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'IN',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      const result = TrayDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'trayStatus');
      expect(result).not.toBeNull();
      expect(result?.trayStatus).toBeNull();
      expect(result?.effectiveDate).toBeTruthy();
    });

    it('should remove effective date filter and its period', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'IN',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = TrayDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result?.trayStatus).toBe('IN');
      expect(result?.effectiveDate).toBeNull();
      expect(result?.effectiveDatePeriod).toBeNull();
    });

    it('should return null when removing effectiveDate leaves no active filters', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      const result = TrayDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');
      expect(result).toBeNull();
    });

    it('should remove termination date filter and its period', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'OU',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };

      const result = TrayDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result?.trayStatus).toBe('OU');
      expect(result?.terminationDate).toBeNull();
      expect(result?.terminationDatePeriod).toBeNull();
    });

    it('should return null when removing terminationDate leaves no active filters', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };
      const result = TrayDefinitionFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');
      expect(result).toBeNull();
    });

  });

  describe('hasActiveFilters', () => {

    it('should return false when filters is null', () => {
      const result = TrayDefinitionFilterChipsUtils.hasActiveFilters(null);
      expect(result).toBe(false);
    });

    it('should return false when all filter values are null', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      const result = TrayDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when tray status is set', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'IN',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = TrayDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when effective date is set', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = TrayDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when termination date is set', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };

      const result = TrayDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when any filter is set', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'OU',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };

      const result = TrayDefinitionFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });
  });
});
