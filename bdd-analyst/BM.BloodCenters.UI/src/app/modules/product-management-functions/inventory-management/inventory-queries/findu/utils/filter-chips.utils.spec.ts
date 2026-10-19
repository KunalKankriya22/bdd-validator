import { FinduFilterChipsUtils } from './filter-chips.utils';
import { StatusFilterValue } from '../models/findu.models';

describe('FinduFilterChipsUtils', () => {
  describe('convertStatusFiltersToChips', () => {

    it('should convert boolean filters to chips (Y/N)', () => {
      const filters: StatusFilterValue = {
        expired: 'N',
        interdicted: 'N',
        available: 'Y',
        labeled: 'Y',
        rejected: 'N',
        tested: 'Y',
        shipped: 'N'
      };

      const chips = FinduFilterChipsUtils.convertStatusFiltersToChips(filters);

      expect(chips.length).toBe(7);
      expect(chips.find(c => c.key === 'expired')?.label).toBe('Expired: No');
      expect(chips.find(c => c.key === 'available')?.label).toBe('Available: Yes');
      expect(chips.find(c => c.key === 'tested')?.label).toBe('Tested: Yes');
    });

    it('should return empty array for null filters', () => {
      const chips = FinduFilterChipsUtils.convertStatusFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when all filter values are null', () => {
      const filters: StatusFilterValue = {
        expired: null,
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      const chips = FinduFilterChipsUtils.convertStatusFiltersToChips(filters);
      expect(chips).toEqual([]);
    });

    it('should handle mixed Y/N/null values', () => {
      const filters: StatusFilterValue = {
        expired: 'Y',
        interdicted: null,
        available: 'N',
        labeled: null,
        rejected: null,
        tested: 'Y',
        shipped: null
      };

      const chips = FinduFilterChipsUtils.convertStatusFiltersToChips(filters);

      expect(chips.length).toBe(3);
      expect(chips.find(c => c.key === 'expired')?.label).toBe('Expired: Yes');
      expect(chips.find(c => c.key === 'available')?.label).toBe('Available: No');
      expect(chips.find(c => c.key === 'tested')?.label).toBe('Tested: Yes');
    });

    it('should produce chips with correct value property for Y', () => {
      const filters: StatusFilterValue = {
        expired: 'Y',
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      const chips = FinduFilterChipsUtils.convertStatusFiltersToChips(filters);
      expect(chips[0].value).toBe('Yes');
    });

    it('should produce chips with correct value property for N', () => {
      const filters: StatusFilterValue = {
        expired: 'N',
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      const chips = FinduFilterChipsUtils.convertStatusFiltersToChips(filters);
      expect(chips[0].value).toBe('No');
    });

    it('should create all 7 chips when all filters are set', () => {
      const filters: StatusFilterValue = {
        expired: 'Y',
        interdicted: 'Y',
        available: 'Y',
        labeled: 'Y',
        rejected: 'Y',
        tested: 'Y',
        shipped: 'Y'
      };

      const chips = FinduFilterChipsUtils.convertStatusFiltersToChips(filters);
      expect(chips.length).toBe(7);

      const expectedKeys = ['expired', 'interdicted', 'available', 'labeled', 'rejected', 'tested', 'shipped'];
      expectedKeys.forEach(key => {
        expect(chips.find(c => c.key === key)).toBeTruthy();
      });
    });

    it('should include correct labels for all filter types', () => {
      const filters: StatusFilterValue = {
        expired: 'Y',
        interdicted: 'N',
        available: 'Y',
        labeled: 'N',
        rejected: 'Y',
        tested: 'N',
        shipped: 'Y'
      };

      const chips = FinduFilterChipsUtils.convertStatusFiltersToChips(filters);

      expect(chips.find(c => c.key === 'interdicted')?.label).toBe('Interdicted: No');
      expect(chips.find(c => c.key === 'labeled')?.label).toBe('Labeled: No');
      expect(chips.find(c => c.key === 'rejected')?.label).toBe('Rejected: Yes');
      expect(chips.find(c => c.key === 'shipped')?.label).toBe('Shipped: Yes');
    });
  });

  describe('removeStatusFilterByChipKey', () => {

    it('should remove a status filter', () => {
      const filters: StatusFilterValue = {
        expired: 'N',
        interdicted: null,
        available: 'Y',
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      const result = FinduFilterChipsUtils.removeStatusFilterByChipKey(filters, 'available');

      expect(result).not.toBeNull();
      expect(result?.available).toBeNull();
      expect(result?.expired).toBe('N');
    });

    it('should return null when removing the last active filter', () => {
      const filters: StatusFilterValue = {
        expired: 'Y',
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      const result = FinduFilterChipsUtils.removeStatusFilterByChipKey(filters, 'expired');
      expect(result).toBeNull();
    });

    it('should return null when filters input is null', () => {
      const result = FinduFilterChipsUtils.removeStatusFilterByChipKey(null, 'expired');
      expect(result).toBeNull();
    });

    it('should return filters unchanged for unknown chipKey', () => {
      const filters: StatusFilterValue = {
        expired: 'Y',
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      const result = FinduFilterChipsUtils.removeStatusFilterByChipKey(filters, 'unknownKey');
      // The unknown key does not match any case, so no field is cleared.
      // Since expired is still active, result should not be null.
      expect(result).not.toBeNull();
      expect(result?.expired).toBe('Y');
    });

    it('should handle removing each individual filter key', () => {
      const allKeys: (keyof StatusFilterValue)[] = [
        'expired', 'interdicted', 'available', 'labeled', 'rejected', 'tested', 'shipped'
      ];

      allKeys.forEach(key => {
        const filters: StatusFilterValue = {
          expired: 'Y',
          interdicted: 'Y',
          available: 'Y',
          labeled: 'Y',
          rejected: 'Y',
          tested: 'Y',
          shipped: 'Y'
        };

        const result = FinduFilterChipsUtils.removeStatusFilterByChipKey(filters, key);
        expect(result).not.toBeNull();
        expect(result![key]).toBeNull();
      });
    });

    it('should return null when removing second-to-last leaves only null values', () => {
      const filters: StatusFilterValue = {
        expired: null,
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: 'Y',
        shipped: null
      };

      const result = FinduFilterChipsUtils.removeStatusFilterByChipKey(filters, 'tested');
      expect(result).toBeNull();
    });
  });

  describe('hasActiveStatusFilters', () => {

    it('should return true when at least one filter is active', () => {
      const filters: StatusFilterValue = {
        expired: null,
        interdicted: null,
        available: 'Y',
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      expect(FinduFilterChipsUtils.hasActiveStatusFilters(filters)).toBeTrue();
    });

    it('should return false for null filters', () => {
      expect(FinduFilterChipsUtils.hasActiveStatusFilters(null)).toBeFalse();
    });

    it('should return false when all filters are null', () => {
      const filters: StatusFilterValue = {
        expired: null,
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      expect(FinduFilterChipsUtils.hasActiveStatusFilters(filters)).toBeFalse();
    });

    it('should return true when multiple filters are active', () => {
      const filters: StatusFilterValue = {
        expired: 'Y',
        interdicted: 'N',
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      expect(FinduFilterChipsUtils.hasActiveStatusFilters(filters)).toBeTrue();
    });

    it('should return true for N value', () => {
      const filters: StatusFilterValue = {
        expired: null,
        interdicted: null,
        available: null,
        labeled: null,
        rejected: 'N',
        tested: null,
        shipped: null
      };

      expect(FinduFilterChipsUtils.hasActiveStatusFilters(filters)).toBeTrue();
    });

    it('should return true when all filters are active', () => {
      const filters: StatusFilterValue = {
        expired: 'Y',
        interdicted: 'Y',
        available: 'Y',
        labeled: 'Y',
        rejected: 'Y',
        tested: 'Y',
        shipped: 'Y'
      };

      expect(FinduFilterChipsUtils.hasActiveStatusFilters(filters)).toBeTrue();
    });
  });
});
