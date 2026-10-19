import { InterdictionQueryFilterChipsUtils } from './filter-chips.utils';
import { DonationsFilterValue, DonorsFilterValue } from '../models/interdiction-query.model';

describe('InterdictionQueryFilterChipsUtils', () => {
  describe('convertDonationsFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when all filter fields are null', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };

      const result = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create donationType chip when donationType is set', () => {
      const filters: DonationsFilterValue = {
        donationType: 'Whole Blood',
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('donationType');
      expect(chips[0].label).toBe('Donation Type: Whole Blood');
      expect(chips[0].value).toBe('Whole Blood');
    });

    it('should create showReleased chip with "Show Released: Yes" for Interdiction optionType when true', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: true,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters, 'Interdiction');

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('showReleased');
      expect(chips[0].label).toBe('Show Released: Yes');
      expect(chips[0].value).toBe(true);
    });

    it('should create showReleased chip with "Show Released: No" when false', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: false,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters, 'Interdiction');

      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Show Released: No');
    });

    it('should create showReleased chip with "Show Terminated" label for Hold optionType', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: true,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters, 'Hold');

      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Show Terminated: Yes');
    });

    it('should not create showReleased chip when showReleased is null', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters);
      expect(chips.filter(c => c.key === 'showReleased').length).toBe(0);
    });

    it('should create effective date chip with >= sign for After period', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: null,
        effectivePeriod: 'After',
        effectiveDate: new Date('2025-03-15'),
        terminationPeriod: null,
        terminationDate: null,
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date ≥');
    });

    it('should create effective date chip with <= sign for Before period', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: null,
        effectivePeriod: 'Before',
        effectiveDate: new Date('2025-06-20'),
        terminationPeriod: null,
        terminationDate: null,
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toContain('≤');
    });

    it('should create effective date chip with <= sign for On or Before period', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: null,
        effectivePeriod: 'On or Before',
        effectiveDate: new Date('2025-06-20'),
        terminationPeriod: null,
        terminationDate: null,
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters);

      expect(chips[0].label).toContain('≤');
    });

    it('should not create effective date chip when date is set but period is null', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: new Date('2025-03-15'),
        terminationPeriod: null,
        terminationDate: null,
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters);
      expect(chips.filter(c => c.key === 'effectiveDate').length).toBe(0);
    });

    it('should create termination date chip when both date and period are set', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'After',
        terminationDate: new Date('2025-12-31'),
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date');
    });

    it('should create unitId chip when unitId is set', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
        unitId: 'UNIT001',
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('unitId');
      expect(chips[0].label).toBe('Unit ID: UNIT001');
      expect(chips[0].value).toBe('UNIT001');
    });

    it('should create all chips when all filters are populated', () => {
      const filters: DonationsFilterValue = {
        donationType: 'Whole Blood',
        showReleased: true,
        effectivePeriod: 'After',
        effectiveDate: new Date('2025-01-01'),
        terminationPeriod: 'Before',
        terminationDate: new Date('2025-12-31'),
        unitId: 'UNIT001',
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters);

      expect(chips.length).toBe(5);
      expect(chips.map(c => c.key)).toEqual([
        'donationType', 'showReleased', 'effectiveDate', 'terminationDate', 'unitId'
      ]);
    });
  });

  describe('convertDonorsFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      const result = InterdictionQueryFilterChipsUtils.convertDonorsFiltersToChips(null);
      expect(result).toEqual([]);
    });

    it('should create showTerminated chip when showTerminated is false', () => {
      const filters: DonorsFilterValue = {
        showTerminated: false,
        sex: '',
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonorsFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('showTerminated');
      expect(chips[0].label).toBe('Show Terminated: No');
      expect(chips[0].value).toBe(false);
    });

    it('should not create showTerminated chip when showTerminated is true', () => {
      const filters: DonorsFilterValue = {
        showTerminated: true,
        sex: '',
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonorsFiltersToChips(filters);
      expect(chips.filter(c => c.key === 'showTerminated').length).toBe(0);
    });

    it('should create sex chip with "Male" label when sex is "M"', () => {
      const filters: DonorsFilterValue = {
        showTerminated: true,
        sex: 'M',
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonorsFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('sex');
      expect(chips[0].label).toBe('Sex: Male');
      expect(chips[0].value).toBe('M');
    });

    it('should create sex chip with "Female" label when sex is "F"', () => {
      const filters: DonorsFilterValue = {
        showTerminated: true,
        sex: 'F',
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonorsFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].label).toBe('Sex: Female');
      expect(chips[0].value).toBe('F');
    });

    it('should not create sex chip when sex is empty string', () => {
      const filters: DonorsFilterValue = {
        showTerminated: true,
        sex: '',
      };

      const chips = InterdictionQueryFilterChipsUtils.convertDonorsFiltersToChips(filters);
      expect(chips.filter(c => c.key === 'sex').length).toBe(0);
    });

    it('should return empty array when showTerminated is true and sex is empty', () => {
      const filters: DonorsFilterValue = {
        showTerminated: true,
        sex: '',
      };

      const result = InterdictionQueryFilterChipsUtils.convertDonorsFiltersToChips(filters);
      expect(result).toEqual([]);
    });
  });

  describe('removeDonationsFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = InterdictionQueryFilterChipsUtils.removeDonationsFilterByChipKey(null, 'donationType');
      expect(result).toBeNull();
    });

    it('should remove donationType filter', () => {
      const filters: DonationsFilterValue = {
        donationType: 'Whole Blood',
        showReleased: true,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };

      const result = InterdictionQueryFilterChipsUtils.removeDonationsFilterByChipKey(filters, 'donationType');

      expect(result).not.toBeNull();
      expect(result!.donationType).toBeNull();
      expect(result!.showReleased).toBe(true);
    });

    it('should remove showReleased filter by setting to null', () => {
      const filters: DonationsFilterValue = {
        donationType: 'WB',
        showReleased: true,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };

      const result = InterdictionQueryFilterChipsUtils.removeDonationsFilterByChipKey(filters, 'showReleased');

      expect(result).not.toBeNull();
      expect(result!.showReleased).toBeNull();
    });

    it('should remove effectiveDate filter and clear both date and period', () => {
      const filters: DonationsFilterValue = {
        donationType: 'WB',
        showReleased: null,
        effectivePeriod: 'After',
        effectiveDate: new Date('2025-01-01'),
        terminationPeriod: null,
        terminationDate: null,
      };

      const result = InterdictionQueryFilterChipsUtils.removeDonationsFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.effectivePeriod).toBeNull();
    });

    it('should remove terminationDate filter and clear both date and period', () => {
      const filters: DonationsFilterValue = {
        donationType: 'WB',
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'Before',
        terminationDate: new Date('2025-12-31'),
      };

      const result = InterdictionQueryFilterChipsUtils.removeDonationsFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.terminationDate).toBeNull();
      expect(result!.terminationPeriod).toBeNull();
    });

    it('should remove unitId filter', () => {
      const filters: DonationsFilterValue = {
        donationType: 'WB',
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
        unitId: 'UNIT001',
      };

      const result = InterdictionQueryFilterChipsUtils.removeDonationsFilterByChipKey(filters, 'unitId');

      expect(result).not.toBeNull();
      expect(result!.unitId).toBeNull();
    });

    it('should return null when removing the last active filter', () => {
      const filters: DonationsFilterValue = {
        donationType: 'WB',
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };

      const result = InterdictionQueryFilterChipsUtils.removeDonationsFilterByChipKey(filters, 'donationType');
      expect(result).toBeNull();
    });
  });

  describe('removeDonorsFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      const result = InterdictionQueryFilterChipsUtils.removeDonorsFilterByChipKey(null, 'sex');
      expect(result).toBeNull();
    });

    it('should set showTerminated to true when removing showTerminated chip', () => {
      const filters: DonorsFilterValue = {
        showTerminated: false,
        sex: 'M',
      };

      const result = InterdictionQueryFilterChipsUtils.removeDonorsFilterByChipKey(filters, 'showTerminated');

      expect(result).not.toBeNull();
      expect(result!.showTerminated).toBe(true);
      expect(result!.sex).toBe('M');
    });

    it('should set sex to empty string when removing sex chip', () => {
      const filters: DonorsFilterValue = {
        showTerminated: false,
        sex: 'M',
      };

      const result = InterdictionQueryFilterChipsUtils.removeDonorsFilterByChipKey(filters, 'sex');

      expect(result).not.toBeNull();
      expect(result!.sex).toBe('');
      expect(result!.showTerminated).toBe(false);
    });

    it('should return null when no active filters remain after removal', () => {
      const filters: DonorsFilterValue = {
        showTerminated: true,
        sex: 'M',
      };

      const result = InterdictionQueryFilterChipsUtils.removeDonorsFilterByChipKey(filters, 'sex');
      expect(result).toBeNull();
    });
  });

  describe('hasDonationsActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(InterdictionQueryFilterChipsUtils.hasDonationsActiveFilters(null)).toBe(false);
    });

    it('should return false when all filter fields are null/undefined', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };
      expect(InterdictionQueryFilterChipsUtils.hasDonationsActiveFilters(filters)).toBe(false);
    });

    it('should return true when donationType is set', () => {
      const filters: DonationsFilterValue = {
        donationType: 'WB',
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };
      expect(InterdictionQueryFilterChipsUtils.hasDonationsActiveFilters(filters)).toBe(true);
    });

    it('should return true when showReleased is false (not null/undefined)', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: false,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
      };
      expect(InterdictionQueryFilterChipsUtils.hasDonationsActiveFilters(filters)).toBe(true);
    });

    it('should return true when unitId is set', () => {
      const filters: DonationsFilterValue = {
        donationType: null,
        showReleased: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null,
        unitId: 'UNIT001',
      };
      expect(InterdictionQueryFilterChipsUtils.hasDonationsActiveFilters(filters)).toBe(true);
    });
  });

  describe('hasDonorsActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(InterdictionQueryFilterChipsUtils.hasDonorsActiveFilters(null)).toBe(false);
    });

    it('should return false when showTerminated is true and sex is empty', () => {
      const filters: DonorsFilterValue = {
        showTerminated: true,
        sex: '',
      };
      expect(InterdictionQueryFilterChipsUtils.hasDonorsActiveFilters(filters)).toBe(false);
    });

    it('should return true when showTerminated is false', () => {
      const filters: DonorsFilterValue = {
        showTerminated: false,
        sex: '',
      };
      expect(InterdictionQueryFilterChipsUtils.hasDonorsActiveFilters(filters)).toBe(true);
    });

    it('should return true when sex has a value', () => {
      const filters: DonorsFilterValue = {
        showTerminated: true,
        sex: 'M',
      };
      expect(InterdictionQueryFilterChipsUtils.hasDonorsActiveFilters(filters)).toBe(true);
    });
  });
});
