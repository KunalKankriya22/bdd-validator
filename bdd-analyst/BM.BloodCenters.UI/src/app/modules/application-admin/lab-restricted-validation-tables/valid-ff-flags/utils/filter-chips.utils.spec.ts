import { ValidFfFlagFilterChipsUtils } from './filter-chips.utils';
import { ValidFfFlagFilterValue } from '../models/valid-ff-flag.model';
import moment from 'moment';

describe('ValidFfFlagFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert collection facility ID filter to chip with display label', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        collectionFacilityIdDisplay: 'W0352 - U.S. Naval Hospital',
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const chips = ValidFfFlagFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('collectionFacilityId');
      expect(chips[0].label).toBe('Collection Facility ID: W0352 - U.S. Naval Hospital');
      expect(chips[0].value).toBe('W0352');
    });


    it('should convert source type filter to chip with display label', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: 'DONOR',
        sourceTypeDisplay: 'DONOR - Donor Source',
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const chips = ValidFfFlagFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('sourceType');
      expect(chips[0].label).toBe('Source Type: DONOR - Donor Source');
    });


    it('should convert FF flag value filter to chip with display label', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: '00',
        ffFlagValueDisplay: 'No Flag',
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const chips = ValidFfFlagFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('ffFlagValue');
      expect(chips[0].label).toBe('FF Flag Value: No Flag');
    });


    it('should convert effective date filter to chip with period', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15',
        terminationPeriod: null,
        terminationDate: null
      };

      const chips = ValidFfFlagFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toMatch(/Effective Date ≥ 15-[Jj][Aa][Nn]-2024/);
    });

    it('should convert termination date filter to chip with period', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      const chips = ValidFfFlagFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toMatch(/Termination Date ≤ 31-[Dd][Ee][Cc]-2024/);
    });

    it('should use ≥ symbol for After period', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15',
        terminationPeriod: null,
        terminationDate: null
      };

      const chips = ValidFfFlagFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('≥');
    });

    it('should use ≤ symbol for Before period', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      const chips = ValidFfFlagFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips[0].label).toContain('≤');
    });

    it('should not create chip for effective date without period', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: '2024-01-15',
        terminationPeriod: null,
        terminationDate: null
      };

      const chips = ValidFfFlagFilterChipsUtils.convertFiltersToChips(filters);

      expect(chips.length).toBe(0);
    });

  });

  describe('removeFilterByChipKey', () => {

    it('should remove collection facility ID filter', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ValidFfFlagFilterChipsUtils.removeFilterByChipKey(filters, 'collectionFacilityId');

      expect(result).toBeDefined();
      expect(result?.collectionFacilityId).toBeNull();
      expect(result?.sourceType).toBe('DONOR');
    });

    it('should remove source type filter', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ValidFfFlagFilterChipsUtils.removeFilterByChipKey(filters, 'sourceType');

      expect(result).toBeDefined();
      expect(result?.sourceType).toBeNull();
      expect(result?.collectionFacilityId).toBe('W0352');
    });


    it('should remove effective date and period', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15',
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ValidFfFlagFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).toBeDefined();
      expect(result?.effectiveDate).toBeNull();
      expect(result?.effectivePeriod).toBeNull();
      expect(result?.collectionFacilityId).toBe('W0352');
    });

    it('should remove termination date and period', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      const result = ValidFfFlagFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).toBeDefined();
      expect(result?.terminationDate).toBeNull();
      expect(result?.terminationPeriod).toBeNull();
      expect(result?.collectionFacilityId).toBe('W0352');
    });

  });

  describe('hasActiveFilters', () => {


    it('should return true when collection facility ID filter is set', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ValidFfFlagFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when source type filter is set', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: 'DONOR',
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ValidFfFlagFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when FF flag value filter is set', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: '00',
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ValidFfFlagFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when effective date filter is set', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15',
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ValidFfFlagFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

    it('should return true when termination date filter is set', () => {
      const filters: ValidFfFlagFilterValue = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      const result = ValidFfFlagFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBeTrue();
    });

  });
});
