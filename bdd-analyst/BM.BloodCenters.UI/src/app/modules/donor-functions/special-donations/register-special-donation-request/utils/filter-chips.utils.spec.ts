import { SpecialDonationFilterChipsUtils } from './filter-chips.utils';
import { SpecialDonationFilterValue } from '../register-special-donation-request.models';

describe('SpecialDonationFilterChipsUtils', () => {
  const emptyFilters: SpecialDonationFilterValue = {
    status: null,
    shipTo: null,
    surgeryDate: null,
    surgeryDatePeriod: null,
    neededBy: null,
    neededByPeriod: null
  };

  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(null);
      expect(chips).toEqual([]);
    });

    it('should return empty array when no filters are active', () => {
      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(emptyFilters);
      expect(chips).toEqual([]);
    });

    it('should convert status "A" to chip with label "Active"', () => {
      const filters: SpecialDonationFilterValue = { ...emptyFilters, status: 'A' };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('status');
      expect(chips[0].label).toBe('Status: Active');
      expect(chips[0].value).toBe('A');
    });

    it('should convert status "I" to chip with label "Inactive"', () => {
      const filters: SpecialDonationFilterValue = { ...emptyFilters, status: 'I' };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Status: Inactive');
    });

    it('should use raw status code when code is not A or I', () => {
      const filters: SpecialDonationFilterValue = { ...emptyFilters, status: 'X' };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Status: X');
    });

    it('should convert shipTo filter to chip', () => {
      const filters: SpecialDonationFilterValue = { ...emptyFilters, shipTo: 'Hospital A' };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('shipTo');
      expect(chips[0].label).toBe('Ship To: Hospital A');
      expect(chips[0].value).toBe('Hospital A');
    });

    it('should convert surgery date with "after" period to chip using >= symbol', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        surgeryDatePeriod: 'after',
        surgeryDate: '2025-01-15'
      };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('surgeryDate');
      expect(chips[0].label).toContain('Surgery Date');
      expect(chips[0].label).toContain('≥');
    });

    it('should convert surgery date with "before" period to chip using <= symbol', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        surgeryDatePeriod: 'before',
        surgeryDate: '2025-03-20'
      };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should not create surgery date chip when date is set but period is null', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        surgeryDate: '2025-01-15',
        surgeryDatePeriod: null
      };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should not create surgery date chip when period is set but date is null', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        surgeryDatePeriod: 'after',
        surgeryDate: null
      };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert neededBy date with "after" period to chip using >= symbol', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        neededByPeriod: 'after',
        neededBy: '2025-06-30'
      };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('neededBy');
      expect(chips[0].label).toContain('Needed By');
      expect(chips[0].label).toContain('≥');
    });

    it('should convert neededBy date with "before" period to chip using <= symbol', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        neededByPeriod: 'before',
        neededBy: '2025-09-01'
      };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should not create neededBy chip when date is set but period is null', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        neededBy: '2025-06-30',
        neededByPeriod: null
      };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(0);
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: SpecialDonationFilterValue = {
        status: 'A',
        shipTo: 'Hospital A',
        surgeryDatePeriod: 'after',
        surgeryDate: '2025-01-01',
        neededByPeriod: 'before',
        neededBy: '2025-12-31'
      };

      const chips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
      expect(chips.length).toBe(4);
      expect(chips[0].key).toBe('status');
      expect(chips[1].key).toBe('shipTo');
      expect(chips[2].key).toBe('surgeryDate');
      expect(chips[3].key).toBe('neededBy');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = SpecialDonationFilterChipsUtils.removeFilterByChipKey(null, 'status');
      expect(result).toBeNull();
    });

    it('should remove status filter', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        status: 'A',
        shipTo: 'Hospital A'
      };

      const result = SpecialDonationFilterChipsUtils.removeFilterByChipKey(filters, 'status');
      expect(result).not.toBeNull();
      expect(result!.status).toBeNull();
      expect(result!.shipTo).toBe('Hospital A');
    });

    it('should remove shipTo filter', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        status: 'A',
        shipTo: 'Hospital A'
      };

      const result = SpecialDonationFilterChipsUtils.removeFilterByChipKey(filters, 'shipTo');
      expect(result).not.toBeNull();
      expect(result!.shipTo).toBeNull();
      expect(result!.status).toBe('A');
    });

    it('should remove surgeryDate and surgeryDatePeriod', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        status: 'A',
        surgeryDate: '2025-01-15',
        surgeryDatePeriod: 'after'
      };

      const result = SpecialDonationFilterChipsUtils.removeFilterByChipKey(filters, 'surgeryDate');
      expect(result).not.toBeNull();
      expect(result!.surgeryDate).toBeNull();
      expect(result!.surgeryDatePeriod).toBeNull();
    });

    it('should remove neededBy and neededByPeriod', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        status: 'A',
        neededBy: '2025-12-31',
        neededByPeriod: 'before'
      };

      const result = SpecialDonationFilterChipsUtils.removeFilterByChipKey(filters, 'neededBy');
      expect(result).not.toBeNull();
      expect(result!.neededBy).toBeNull();
      expect(result!.neededByPeriod).toBeNull();
    });

    it('should return null when removing the last active filter', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        status: 'A'
      };

      const result = SpecialDonationFilterChipsUtils.removeFilterByChipKey(filters, 'status');
      expect(result).toBeNull();
    });

    it('should not mutate the original filters object', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        status: 'A',
        shipTo: 'Hospital A'
      };

      SpecialDonationFilterChipsUtils.removeFilterByChipKey(filters, 'status');
      expect(filters.status).toBe('A');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(SpecialDonationFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      expect(SpecialDonationFilterChipsUtils.hasActiveFilters(emptyFilters)).toBe(false);
    });

    it('should return true when status is set', () => {
      const filters: SpecialDonationFilterValue = { ...emptyFilters, status: 'A' };
      expect(SpecialDonationFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when shipTo is set', () => {
      const filters: SpecialDonationFilterValue = { ...emptyFilters, shipTo: 'Hospital A' };
      expect(SpecialDonationFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when surgeryDate and surgeryDatePeriod are both set', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        surgeryDate: '2025-01-15',
        surgeryDatePeriod: 'after'
      };
      expect(SpecialDonationFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only surgeryDate is set without period', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        surgeryDate: '2025-01-15',
        surgeryDatePeriod: null
      };
      expect(SpecialDonationFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when neededBy and neededByPeriod are both set', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        neededBy: '2025-12-31',
        neededByPeriod: 'before'
      };
      expect(SpecialDonationFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when only neededByPeriod is set without date', () => {
      const filters: SpecialDonationFilterValue = {
        ...emptyFilters,
        neededByPeriod: 'before',
        neededBy: null
      };
      expect(SpecialDonationFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });
  });
});
