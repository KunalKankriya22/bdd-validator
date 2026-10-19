import { ChapterFilterChipsUtils } from './chapter-filter-chips.utils';
import { ChapterFilterValue } from '../chapter-filter-panel/chapter-filter-panel';

describe('ChapterFilterChipsUtils', () => {
  const getPastDate = (daysAgo: number = 30): Date => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  const getFutureDate = (daysFromNow: number = 30): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  };

  describe('convertFiltersToChips', () => {

    it('should convert effective date filter to chip', () => {
      const testDate = getPastDate(90);
      const filters: ChapterFilterValue = {
        effectivePeriod: 'AFTER',
        effectiveDate: testDate,
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ChapterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[0].label).toContain('Effective Date ≥');
      expect(result[0].label).toContain(testDate.getDate().toString());
    });

    it('should convert effective date BEFORE filter to chip with ≤ symbol', () => {
      const testDate = getPastDate(60);
      const filters: ChapterFilterValue = {
        effectivePeriod: 'BEFORE',
        effectiveDate: testDate,
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ChapterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].label).toContain('≤');
    });

    it('should convert termination date filter to chip', () => {
      const testDate = getFutureDate(90);
      const filters: ChapterFilterValue = {
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'AFTER',
        terminationDate: testDate
      };

      const result = ChapterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('terminationDate');
      expect(result[0].label).toContain('Termination Date ≥');
    });

    it('should convert both effective and termination date filters to chips', () => {
      const effectiveDate = getPastDate(180);
      const terminationDate = getFutureDate(90);
      const filters: ChapterFilterValue = {
        effectivePeriod: 'AFTER',
        effectiveDate: effectiveDate,
        terminationPeriod: 'BEFORE',
        terminationDate: terminationDate
      };

      const result = ChapterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(2);
      expect(result[0].key).toBe('effectiveDate');
      expect(result[1].key).toBe('terminationDate');
    });

    it('should not create chip if period is set but date is null', () => {
      const filters: ChapterFilterValue = {
        effectivePeriod: 'AFTER',
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ChapterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should not create chip if date is set but period is null', () => {
      const filters: ChapterFilterValue = {
        effectivePeriod: null,
        effectiveDate: getPastDate(30),
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ChapterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(0);
    });

    it('should handle invalid date by showing empty date string', () => {
      const filters: ChapterFilterValue = {
        effectivePeriod: 'AFTER',
        effectiveDate: new Date('invalid'),
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ChapterFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0].value).toContain('AFTER:');
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove effective date filter', () => {
      const filters: ChapterFilterValue = {
        effectivePeriod: 'AFTER',
        effectiveDate: getPastDate(30),
        terminationPeriod: 'BEFORE',
        terminationDate: getFutureDate(60)
      };

      const result = ChapterFilterChipsUtils.removeFilterByChipKey(filters, 'effectiveDate');

      expect(result).not.toBeNull();
      expect(result!.effectivePeriod).toBeNull();
      expect(result!.effectiveDate).toBeNull();
      expect(result!.terminationPeriod).toBe('BEFORE');
      expect(result!.terminationDate).toBeTruthy();
    });

    it('should remove termination date filter', () => {
      const filters: ChapterFilterValue = {
        effectivePeriod: 'AFTER',
        effectiveDate: getPastDate(30),
        terminationPeriod: 'BEFORE',
        terminationDate: getFutureDate(60)
      };

      const result = ChapterFilterChipsUtils.removeFilterByChipKey(filters, 'terminationDate');

      expect(result).not.toBeNull();
      expect(result!.effectivePeriod).toBe('AFTER');
      expect(result!.effectiveDate).toBeTruthy();
      expect(result!.terminationPeriod).toBeNull();
      expect(result!.terminationDate).toBeNull();
    });


    it('should not modify filters when removing unknown chip key', () => {
      const filters: ChapterFilterValue = {
        effectivePeriod: 'AFTER',
        effectiveDate: getPastDate(30),
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ChapterFilterChipsUtils.removeFilterByChipKey(filters, 'unknownKey');

      expect(result).not.toBeNull();
      expect(result!.effectivePeriod).toBe('AFTER');
      expect(result!.effectiveDate).toBeTruthy();
    });
  });

  describe('hasActiveFilters', () => {

    it('should return true when effective date filter is active', () => {
      const filters: ChapterFilterValue = {
        effectivePeriod: 'AFTER',
        effectiveDate: getPastDate(30),
        terminationPeriod: null,
        terminationDate: null
      };

      const result = ChapterFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when termination date filter is active', () => {
      const filters: ChapterFilterValue = {
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'BEFORE',
        terminationDate: getFutureDate(60)
      };

      const result = ChapterFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when both filters are active', () => {
      const filters: ChapterFilterValue = {
        effectivePeriod: 'AFTER',
        effectiveDate: getPastDate(30),
        terminationPeriod: 'BEFORE',
        terminationDate: getFutureDate(60)
      };

      const result = ChapterFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });



  });
});
