import { GradedDonorsFilterChipsUtils, GradedDonorsFilterValue } from './filter-chips.utils';

describe('GradedDonorsFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = GradedDonorsFilterChipsUtils.convertFiltersToChips(null, 'donations');
      expect(result).toEqual([]);
    });

    it('should return empty array when all filter fields are null or empty', () => {
      const filters: GradedDonorsFilterValue = {
        sex: null,
        status: null,
      };

      const result = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donations');
      expect(result).toEqual([]);
    });

    it('should not create sex chip when sex is "All"', () => {
      const filters: GradedDonorsFilterValue = {
        sex: 'All',
        status: null,
      };

      const result = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donations');
      expect(result.length).toBe(0);
    });

    it('should not create sex chip when sex is empty string', () => {
      const filters: GradedDonorsFilterValue = {
        sex: '   ',
        status: null,
      };

      const result = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donations');
      expect(result.length).toBe(0);
    });

    it('should create sex chip with "Male" label when sex is "M"', () => {
      const filters: GradedDonorsFilterValue = {
        sex: 'M',
        status: null,
      };

      const chips = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donations');

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('sex');
      expect(chips[0].label).toBe('Sex: Male');
      expect(chips[0].value).toBe('M');
    });

    it('should create sex chip with "Female" label when sex is "F"', () => {
      const filters: GradedDonorsFilterValue = {
        sex: 'F',
        status: null,
      };

      const chips = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donations');

      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Sex: Female');
    });

    it('should use raw sex value when it is not M or F', () => {
      const filters: GradedDonorsFilterValue = {
        sex: 'Other',
        status: null,
      };

      const chips = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donations');

      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Sex: Other');
    });

    it('should create status chip with "Status" label for donations tabType', () => {
      const filters: GradedDonorsFilterValue = {
        sex: null,
        status: 'Active',
      };

      const chips = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donations');

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('status');
      expect(chips[0].label).toBe('Status: Active');
      expect(chips[0].value).toBe('Active');
    });

    it('should create status chip with "Merge Status" label for donors tabType', () => {
      const filters: GradedDonorsFilterValue = {
        sex: null,
        status: 'Merged',
      };

      const chips = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donors');

      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Merge Status: Merged');
    });

    it('should not create status chip when status is "All"', () => {
      const filters: GradedDonorsFilterValue = {
        sex: null,
        status: 'All',
      };

      const result = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donations');
      expect(result.length).toBe(0);
    });

    it('should not create status chip when status is whitespace', () => {
      const filters: GradedDonorsFilterValue = {
        sex: null,
        status: '  ',
      };

      const result = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donations');
      expect(result.length).toBe(0);
    });

    it('should create both sex and status chips when both are set', () => {
      const filters: GradedDonorsFilterValue = {
        sex: 'M',
        status: 'Active',
      };

      const chips = GradedDonorsFilterChipsUtils.convertFiltersToChips(filters, 'donations');

      expect(chips.length).toBe(2);
      expect(chips[0].key).toBe('sex');
      expect(chips[1].key).toBe('status');
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = GradedDonorsFilterChipsUtils.removeFilterByChipKey(null, 'sex');
      expect(result).toBeNull();
    });

    it('should set sex to "All" when removing sex chip', () => {
      const filters: GradedDonorsFilterValue = {
        sex: 'M',
        status: 'Active',
      };

      const result = GradedDonorsFilterChipsUtils.removeFilterByChipKey(filters, 'sex');

      expect(result).not.toBeNull();
      expect(result!.sex).toBe('All');
      expect(result!.status).toBe('Active');
    });

    it('should set status to "All" when removing status chip', () => {
      const filters: GradedDonorsFilterValue = {
        sex: 'F',
        status: 'Active',
      };

      const result = GradedDonorsFilterChipsUtils.removeFilterByChipKey(filters, 'status');

      expect(result).not.toBeNull();
      expect(result!.status).toBe('All');
      expect(result!.sex).toBe('F');
    });

    it('should return null when removing the last active filter', () => {
      const filters: GradedDonorsFilterValue = {
        sex: 'M',
        status: 'All',
      };

      const result = GradedDonorsFilterChipsUtils.removeFilterByChipKey(filters, 'sex');
      expect(result).toBeNull();
    });

    it('should not modify filters when unknown chip key is provided', () => {
      const filters: GradedDonorsFilterValue = {
        sex: 'M',
        status: null,
      };

      const result = GradedDonorsFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.sex).toBe('M');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(GradedDonorsFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when both filters are null', () => {
      const filters: GradedDonorsFilterValue = { sex: null, status: null };
      expect(GradedDonorsFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when sex is "All" and status is "All"', () => {
      const filters: GradedDonorsFilterValue = { sex: 'All', status: 'All' };
      expect(GradedDonorsFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return false when sex is whitespace and status is "All"', () => {
      const filters: GradedDonorsFilterValue = { sex: '  ', status: 'All' };
      expect(GradedDonorsFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when sex has a real value', () => {
      const filters: GradedDonorsFilterValue = { sex: 'M', status: null };
      expect(GradedDonorsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when status has a real value', () => {
      const filters: GradedDonorsFilterValue = { sex: null, status: 'Active' };
      expect(GradedDonorsFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
