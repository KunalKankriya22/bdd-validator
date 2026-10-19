import { FilterChip } from '@shared/components/filter-chips/filter-chips';

/**
 * Filter chip for Chapter ID
 */
export interface ChapterFilterChip {
  unitId: string;
  label: string;
}

/**
 * Filter chip for Batch ID
 */
export interface BatchFilterChip {
  batchId: string;
  label: string;
}

/**
 * Utility class for converting batch-in-progress filters to filter chips
 */
export class BatchInProgressFilterChipsUtils {
  /**
   * Convert chapter filters to filter chips for display
   */
  static convertChapterFiltersToChips(chapterFilters: ChapterFilterChip[]): FilterChip[] {
    if (!chapterFilters || chapterFilters.length === 0) {
      return [];
    }

    return chapterFilters.map(filter => ({
      key: `chapter-${filter.unitId}`,
      label: filter.label,
      value: filter.unitId
    }));
  }

  /**
   * Convert batch filters to filter chips for display
   */
  static convertBatchFiltersToChips(batchFilters: BatchFilterChip[]): FilterChip[] {
    if (!batchFilters || batchFilters.length === 0) {
      return [];
    }

    return batchFilters.map(filter => ({
      key: `batch-${filter.batchId}`,
      label: filter.label,
      value: filter.batchId
    }));
  }

  /**
   * Combine chapter and batch filters into a single chip array
   */
  static convertAllFiltersToChips(
    chapterFilters: ChapterFilterChip[],
    batchFilters: BatchFilterChip[]
  ): FilterChip[] {
    const chapterChips = this.convertChapterFiltersToChips(chapterFilters);
    const batchChips = this.convertBatchFiltersToChips(batchFilters);

    return [...chapterChips, ...batchChips];
  }

  /**
   * Remove a chapter filter by unit ID
   */
  static removeChapterFilter(
    chapterFilters: ChapterFilterChip[],
    unitId: string
  ): ChapterFilterChip[] {
    return chapterFilters.filter(filter => filter.unitId !== unitId);
  }

  /**
   * Remove a batch filter by batch ID
   */
  static removeBatchFilter(
    batchFilters: BatchFilterChip[],
    batchId: string
  ): BatchFilterChip[] {
    return batchFilters.filter(filter => filter.batchId !== batchId);
  }

  /**
   * Remove a filter by chip key (handles both chapter and batch filters)
   */
  static removeFilterByChipKey(
    chapterFilters: ChapterFilterChip[],
    batchFilters: BatchFilterChip[],
    chipKey: string
  ): { chapterFilters: ChapterFilterChip[], batchFilters: BatchFilterChip[] } {
    // Check if it's a chapter filter
    if (chipKey.startsWith('chapter-')) {
      const unitId = chipKey.replace('chapter-', '');
      return {
        chapterFilters: this.removeChapterFilter(chapterFilters, unitId),
        batchFilters: batchFilters
      };
    }

    // Check if it's a batch filter
    if (chipKey.startsWith('batch-')) {
      const batchId = chipKey.replace('batch-', '');
      return {
        chapterFilters: chapterFilters,
        batchFilters: this.removeBatchFilter(batchFilters, batchId)
      };
    }

    // Unknown key, return unchanged
    return { chapterFilters, batchFilters };
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(
    chapterFilters: ChapterFilterChip[],
    batchFilters: BatchFilterChip[]
  ): boolean {
    return chapterFilters.length > 0 || batchFilters.length > 0;
  }

  /**
   * Clear all chapter filters
   */
  static clearAllChapterFilters(): ChapterFilterChip[] {
    return [];
  }

  /**
   * Clear all batch filters
   */
  static clearAllBatchFilters(): BatchFilterChip[] {
    return [];
  }

  /**
   * Clear all filters (both chapter and batch)
   */
  static clearAllFilters(): { chapterFilters: ChapterFilterChip[], batchFilters: BatchFilterChip[] } {
    return {
      chapterFilters: [],
      batchFilters: []
    };
  }

  /**
   * Get total filter count
   */
  static getTotalFilterCount(
    chapterFilters: ChapterFilterChip[],
    batchFilters: BatchFilterChip[]
  ): number {
    return chapterFilters.length + batchFilters.length;
  }

  /**
   * Create a chapter filter chip
   */
  static createChapterFilterChip(unitId: string, chapterName?: string): ChapterFilterChip {
    return {
      unitId: unitId,
      label: chapterName ? `${chapterName} (${unitId})` : `Unit ID: ${unitId}`
    };
  }

  /**
   * Create a batch filter chip
   */
  static createBatchFilterChip(
    batchId: string,
    chapterId?: string,
    additionalInfo?: string
  ): BatchFilterChip {
    let label = `Batch: ${batchId}`;

    if (chapterId) {
      label += ` - ${chapterId}`;
    }

    if (additionalInfo) {
      label += ` (${additionalInfo})`;
    }

    return {
      batchId: batchId,
      label: label
    };
  }
}
