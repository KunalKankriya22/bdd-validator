import { BatchInProgressFilterChipsUtils, ChapterFilterChip, BatchFilterChip } from './filter-chips.utils';

describe('BatchInProgressFilterChipsUtils', () => {
  describe('convertChapterFiltersToChips', () => {
    it('should convert chapter filters to filter chips', () => {
      const chapterFilters: ChapterFilterChip[] = [
        { unitId: '2020', label: 'Unit ID: 2020' },
        { unitId: '2021', label: 'Unit ID: 2021' }
      ];

      const result = BatchInProgressFilterChipsUtils.convertChapterFiltersToChips(chapterFilters);

      expect(result).toEqual([
        { key: 'chapter-2020', label: 'Unit ID: 2020', value: '2020' },
        { key: 'chapter-2021', label: 'Unit ID: 2021', value: '2021' }
      ]);
    });

    it('should return empty array when no chapter filters', () => {
      const result = BatchInProgressFilterChipsUtils.convertChapterFiltersToChips([]);
      expect(result).toEqual([]);
    });

    it('should return empty array when chapter filters is null', () => {
      const result = BatchInProgressFilterChipsUtils.convertChapterFiltersToChips(null as any);
      expect(result).toEqual([]);
    });
  });

  describe('convertBatchFiltersToChips', () => {
    it('should convert batch filters to filter chips', () => {
      const batchFilters: BatchFilterChip[] = [
        { batchId: 'W377', label: 'Batch: W377 - DAL' },
        { batchId: 'S1128', label: 'Batch: S1128 - OBK' }
      ];

      const result = BatchInProgressFilterChipsUtils.convertBatchFiltersToChips(batchFilters);

      expect(result).toEqual([
        { key: 'batch-W377', label: 'Batch: W377 - DAL', value: 'W377' },
        { key: 'batch-S1128', label: 'Batch: S1128 - OBK', value: 'S1128' }
      ]);
    });

    it('should return empty array when no batch filters', () => {
      const result = BatchInProgressFilterChipsUtils.convertBatchFiltersToChips([]);
      expect(result).toEqual([]);
    });

    it('should return empty array when batch filters is null', () => {
      const result = BatchInProgressFilterChipsUtils.convertBatchFiltersToChips(null as any);
      expect(result).toEqual([]);
    });
  });

  describe('convertAllFiltersToChips', () => {
    it('should combine chapter and batch filters', () => {
      const chapterFilters: ChapterFilterChip[] = [
        { unitId: '2020', label: 'Unit ID: 2020' }
      ];
      const batchFilters: BatchFilterChip[] = [
        { batchId: 'W377', label: 'Batch: W377' }
      ];

      const result = BatchInProgressFilterChipsUtils.convertAllFiltersToChips(chapterFilters, batchFilters);

      expect(result).toEqual([
        { key: 'chapter-2020', label: 'Unit ID: 2020', value: '2020' },
        { key: 'batch-W377', label: 'Batch: W377', value: 'W377' }
      ]);
    });

    it('should return only chapter chips when no batch filters', () => {
      const chapterFilters: ChapterFilterChip[] = [
        { unitId: '2020', label: 'Unit ID: 2020' }
      ];

      const result = BatchInProgressFilterChipsUtils.convertAllFiltersToChips(chapterFilters, []);

      expect(result).toEqual([
        { key: 'chapter-2020', label: 'Unit ID: 2020', value: '2020' }
      ]);
    });

    it('should return only batch chips when no chapter filters', () => {
      const batchFilters: BatchFilterChip[] = [
        { batchId: 'W377', label: 'Batch: W377' }
      ];

      const result = BatchInProgressFilterChipsUtils.convertAllFiltersToChips([], batchFilters);

      expect(result).toEqual([
        { key: 'batch-W377', label: 'Batch: W377', value: 'W377' }
      ]);
    });
  });
  describe('removeFilterByChipKey', () => {


    it('should return unchanged filters for unknown chip key', () => {
      const chapterFilters: ChapterFilterChip[] = [
        { unitId: '2020', label: 'Unit ID: 2020' }
      ];
      const batchFilters: BatchFilterChip[] = [
        { batchId: 'W377', label: 'Batch: W377' }
      ];

      const result = BatchInProgressFilterChipsUtils.removeFilterByChipKey(
        chapterFilters,
        batchFilters,
        'unknown-key'
      );

      expect(result.chapterFilters).toEqual(chapterFilters);
      expect(result.batchFilters).toEqual(batchFilters);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return true when there are chapter filters', () => {
      const chapterFilters: ChapterFilterChip[] = [
        { unitId: '2020', label: 'Unit ID: 2020' }
      ];

      const result = BatchInProgressFilterChipsUtils.hasActiveFilters(chapterFilters, []);

      expect(result).toBe(true);
    });

    it('should return true when there are batch filters', () => {
      const batchFilters: BatchFilterChip[] = [
        { batchId: 'W377', label: 'Batch: W377' }
      ];

      const result = BatchInProgressFilterChipsUtils.hasActiveFilters([], batchFilters);

      expect(result).toBe(true);
    });

    it('should return false when there are no filters', () => {
      const result = BatchInProgressFilterChipsUtils.hasActiveFilters([], []);

      expect(result).toBe(false);
    });
  });
  describe('getTotalFilterCount', () => {
    it('should return total count of all filters', () => {
      const chapterFilters: ChapterFilterChip[] = [
        { unitId: '2020', label: 'Unit ID: 2020' },
        { unitId: '2021', label: 'Unit ID: 2021' }
      ];
      const batchFilters: BatchFilterChip[] = [
        { batchId: 'W377', label: 'Batch: W377' }
      ];

      const result = BatchInProgressFilterChipsUtils.getTotalFilterCount(chapterFilters, batchFilters);

      expect(result).toBe(3);
    });

    it('should return 0 when no filters', () => {
      const result = BatchInProgressFilterChipsUtils.getTotalFilterCount([], []);

      expect(result).toBe(0);
    });
  });

  describe('createChapterFilterChip', () => {
    it('should create chapter filter chip with chapter name', () => {
      const result = BatchInProgressFilterChipsUtils.createChapterFilterChip('2020', 'DAL');

      expect(result).toEqual({
        unitId: '2020',
        label: 'DAL (2020)'
      });
    });

    it('should create chapter filter chip without chapter name', () => {
      const result = BatchInProgressFilterChipsUtils.createChapterFilterChip('2020');

      expect(result).toEqual({
        unitId: '2020',
        label: 'Unit ID: 2020'
      });
    });
  });

  describe('createBatchFilterChip', () => {
    it('should create batch filter chip with all info', () => {
      const result = BatchInProgressFilterChipsUtils.createBatchFilterChip('W377', 'DAL', 'In Progress');

      expect(result).toEqual({
        batchId: 'W377',
        label: 'Batch: W377 - DAL (In Progress)'
      });
    });

    it('should create batch filter chip with chapter ID only', () => {
      const result = BatchInProgressFilterChipsUtils.createBatchFilterChip('W377', 'DAL');

      expect(result).toEqual({
        batchId: 'W377',
        label: 'Batch: W377 - DAL'
      });
    });

    it('should create batch filter chip with batch ID only', () => {
      const result = BatchInProgressFilterChipsUtils.createBatchFilterChip('W377');

      expect(result).toEqual({
        batchId: 'W377',
        label: 'Batch: W377'
      });
    });
  });
});
