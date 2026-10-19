import { PoolAboValueFilterChipsUtils } from './filter-chips.utils';
import { PoolAboValueFilterValue } from '../models/pool-abo-values.model';

describe('PoolAboValueFilterChipsUtils', () => {
  describe('convertFiltersToChips', () => {

    it('should convert effective date filter to chip', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        effDate: '2026-05-08',
        effDatePeriod: 'after'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effDate');
      expect(result[0].label).toContain('>');
      expect(result[0].label).toContain('08-MAY-2026');
    });

    it('should convert termination date filter to chip', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        termDate: '2026-12-31',
        termDatePeriod: 'before'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('termDate');
      expect(result[0].label).toContain('<');
      expect(result[0].label).toContain('31-DEC-2026');
    });

    it('should use ">" symbol for effective date after period', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        effDate: '2026-05-08',
        effDatePeriod: 'after'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].label).toContain('>');
      expect(result[0].label).toMatch(/Effective Date:\s*>\s*08-MAY-2026/);
    });

    it('should use "<" symbol for effective date before period', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        effDate: '2026-05-08',
        effDatePeriod: 'before'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].label).toContain('<');
      expect(result[0].label).toMatch(/Effective Date:\s*<\s*08-MAY-2026/);
    });

    it('should use ">" symbol for termination date after period', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        termDate: '2026-12-31',
        termDatePeriod: 'after'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].label).toContain('>');
      expect(result[0].label).toMatch(/Termination Date:\s*>\s*31-DEC-2026/);
    });

    it('should use "<" symbol for termination date before period', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        termDate: '2026-12-31',
        termDatePeriod: 'before'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].label).toContain('<');
      expect(result[0].label).toMatch(/Termination Date:\s*<\s*31-DEC-2026/);
    });


    it('should not create chip for date without period', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        effDate: '2026-05-08',
        effDatePeriod: null
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(0);
    });

    it('should convert blood type opos filter to chip', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        opos: 'Y'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'opos',
        label: 'O Pos: Yes',
        value: 'Y'
      });
    });

    it('should convert blood type oneg filter to chip', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        oneg: 'N'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'oneg',
        label: 'O Neg: No',
        value: 'N'
      });
    });

    it('should convert all blood type filters to chips', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        opos: 'Y',
        oneg: 'Y',
        apos: 'N',
        aneg: 'N',
        bpos: 'Y',
        bneg: 'N',
        abpos: 'Y',
        abneg: 'N'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(8);
      expect(result.find((chip) => chip.key === 'opos')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'oneg')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'apos')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'aneg')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'bpos')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'bneg')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'abpos')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'abneg')).toBeTruthy();
    });

    it('should convert all filter types including blood types to chips', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        opos: 'Y',
        aneg: 'N',
        bpos: 'Y',
        effDate: '2026-05-08',
        effDatePeriod: 'after',
        termDate: '2026-12-31',
        termDatePeriod: 'before'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);

      // Assert
      expect(result.length).toBe(5);
      expect(result.find((chip) => chip.key === 'opos')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'aneg')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'bpos')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'effDate')).toBeTruthy();
      expect(result.find((chip) => chip.key === 'termDate')).toBeTruthy();
    });
  });

  describe('removeFilterByChipKey', () => {






    it('should remove all blood type filters correctly', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        opos: 'Y',
        oneg: 'Y',
        apos: 'N',
        aneg: 'N',
        bpos: 'Y',
        bneg: 'N',
        abpos: 'Y',
        abneg: 'N'
      };

      // Act & Assert - Remove each blood type
      let result = PoolAboValueFilterChipsUtils.removeFilterByChipKey(filters, 'opos');
      expect(result?.opos).toBeUndefined();

      result = PoolAboValueFilterChipsUtils.removeFilterByChipKey(filters, 'oneg');
      expect(result?.oneg).toBeUndefined();

      result = PoolAboValueFilterChipsUtils.removeFilterByChipKey(filters, 'apos');
      expect(result?.apos).toBeUndefined();

      result = PoolAboValueFilterChipsUtils.removeFilterByChipKey(filters, 'aneg');
      expect(result?.aneg).toBeUndefined();

      result = PoolAboValueFilterChipsUtils.removeFilterByChipKey(filters, 'bpos');
      expect(result?.bpos).toBeUndefined();

      result = PoolAboValueFilterChipsUtils.removeFilterByChipKey(filters, 'bneg');
      expect(result?.bneg).toBeUndefined();

      result = PoolAboValueFilterChipsUtils.removeFilterByChipKey(filters, 'abpos');
      expect(result?.abpos).toBeUndefined();

      result = PoolAboValueFilterChipsUtils.removeFilterByChipKey(filters, 'abneg');
      expect(result?.abneg).toBeUndefined();
    });
  });

  describe('hasActiveFilters', () => {

    it('should return false when filters is empty', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {};

      // Act
      const result = PoolAboValueFilterChipsUtils.hasActiveFilters(filters);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when any filter exists', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        effDate: '2026-05-08',
        effDatePeriod: 'after'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.hasActiveFilters(filters);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when blood type filter exists', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        opos: 'Y'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.hasActiveFilters(filters);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when any blood type filter exists', () => {
      // Arrange
      const filters: PoolAboValueFilterValue = {
        abneg: 'N'
      };

      // Act
      const result = PoolAboValueFilterChipsUtils.hasActiveFilters(filters);

      // Assert
      expect(result).toBe(true);
    });

  });
});
