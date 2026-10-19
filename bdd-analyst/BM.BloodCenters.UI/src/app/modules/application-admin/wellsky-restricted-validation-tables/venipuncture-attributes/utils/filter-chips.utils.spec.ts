import { VenipunctureAttributesFilterChipsUtils } from './filter-chips.utils';
import { VenipunctureAttributesFilterValue } from '../models/venipuncture-attributes.model';

describe('VenipunctureAttributesFilterChipsUtils', () => {
  // Use dynamic dates for testing
  const today = new Date();
  const effectiveDate = new Date(today);
  effectiveDate.setDate(today.getDate() + 1);

  describe('convertFiltersToChips', () => {

    it('should convert code filter to chip correctly', () => {
      const filters: VenipunctureAttributesFilterValue = {
        code: '001',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = VenipunctureAttributesFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ key: 'code', label: 'Code: 001', value: '001' });
    });

    it('should convert effective date filter to chip correctly', () => {
      const filters: VenipunctureAttributesFilterValue = {
        code: null,
        effectiveDate: effectiveDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = VenipunctureAttributesFilterChipsUtils.convertFiltersToChips(filters);

      // Format date as DD-MMM-YYYY
      const day = String(effectiveDate.getDate()).padStart(2, '0');
      const month = effectiveDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = effectiveDate.getFullYear();
      const expectedLabel = `Effective Date ≥ ${day}-${month}-${year}`;

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toBe(expectedLabel);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove specified filter', () => {
      const filters: VenipunctureAttributesFilterValue = {
        code: '001',
        effectiveDate: effectiveDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = VenipunctureAttributesFilterChipsUtils.removeFilterByChipKey(filters, 'code');

      expect(result?.code).toBeNull();
      expect(result?.effectiveDate).toEqual(effectiveDate);
      expect(result?.effectiveDatePeriod).toBe('AFTER');
    });

  });

  describe('hasActiveFilters', () => {

    it('should return true when code filter is active', () => {
      const filters: VenipunctureAttributesFilterValue = {
        code: '001',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      const result = VenipunctureAttributesFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

  });
});
