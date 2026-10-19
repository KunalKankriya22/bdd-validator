import { LetterFilterCriteria } from '../models/notification-letter.model';

/**
 * Filter chip interface for display
 */
export interface FilterChip {
  key: string;
  label: string;
  value: string;
  removable?: boolean;
}

/**
 * Utility class for managing filter chips in the notification letters feature
 * Converts filter criteria to visual chips and handles chip removal
 */
export class LetterFilterChipsUtil {
  /**
   * Convert filter criteria to array of filter chips for display
   *
   * @param criteria Current filter criteria
   * @returns Array of filter chips
   *
   * @example
   * convertToChips({ showTerminated: true, letterCode: 'BDAY' })
   * // Returns: [
   * //   { key: 'showTerminated', label: 'Show Terminated', value: 'Yes' },
   * //   { key: 'letterCode', label: 'Letter Code', value: 'BDAY' }
   * // ]
   */
  static convertToChips(criteria: LetterFilterCriteria): FilterChip[] {
    const chips: FilterChip[] = [];

    // Show Terminated checkbox
    if (criteria.showTerminated) {
      chips.push({
        key: 'showTerminated',
        label: 'Show Terminated',
        value: 'Yes',
        removable: true
      });
    }

    // Letter Code filter
    if (criteria.letterCode) {
      chips.push({
        key: 'letterCode',
        label: 'Letter Code',
        value: criteria.letterCode,
        removable: true
      });
    }

    // Chapter ID filter (if applicable)
    if (criteria.chapterId) {
      chips.push({
        key: 'chapterId',
        label: 'Chapter',
        value: criteria.chapterId,
        removable: true // Chapter can be removed to retrieve all chapters
      });
    }

    return chips;
  }

  /**
   * Remove a chip from filter criteria and return updated criteria
   *
   * @param criteria Current filter criteria
   * @param chipKey Key of the chip to remove
   * @returns Updated filter criteria with specified filter removed
   *
   * @example
   * removeChip({ showTerminated: true, letterCode: 'BDAY' }, 'letterCode')
   * // Returns: { showTerminated: true, letterCode: undefined }
   */
  static removeChip(
    criteria: LetterFilterCriteria,
    chipKey: string
  ): LetterFilterCriteria {
    const updated = { ...criteria };

    switch (chipKey) {
      case 'showTerminated':
        updated.showTerminated = false;
        break;

      case 'letterCode':
        updated.letterCode = undefined;
        break;

      case 'chapterId':
        // Typically chapter should not be removable via chip
        // But included for completeness
        updated.chapterId = undefined;
        break;

      case 'warehouseId':
        updated.warehouseId = undefined;
        break;

      default:
        console.warn(`Unknown chip key: ${chipKey}`);
    }

    return updated;
  }

  /**
   * Clear all removable filters from criteria
   *
   * @param criteria Current filter criteria
   * @param preserveChapter Whether to preserve chapter filter (default: true)
   * @returns Filter criteria with all filters cleared except chapter
   */
  static clearAllFilters(
    criteria: LetterFilterCriteria,
    preserveChapter: boolean = true
  ): LetterFilterCriteria {
    return {
      showTerminated: false,
      letterCode: undefined,
      chapterId: preserveChapter ? criteria.chapterId : undefined,
      warehouseId: preserveChapter ? criteria.warehouseId : undefined
    };
  }

  /**
   * Check if any filters are applied (excluding chapter/warehouse)
   *
   * @param criteria Current filter criteria
   * @returns True if at least one filter is active
   */
  static hasActiveFilters(criteria: LetterFilterCriteria): boolean {
    return (
      criteria.showTerminated ||
      !!criteria.letterCode
    );
  }

  /**
   * Get count of active filters (excluding chapter/warehouse)
   *
   * @param criteria Current filter criteria
   * @returns Number of active filters
   */
  static getActiveFilterCount(criteria: LetterFilterCriteria): number {
    let count = 0;

    if (criteria.showTerminated) count++;
    if (criteria.letterCode) count++;

    return count;
  }

  /**
   * Convert chips back to filter criteria
   * Useful for reconstructing criteria from chip display
   *
   * @param chips Array of filter chips
   * @returns Filter criteria object
   */
  static chipsToFilterCriteria(chips: FilterChip[]): Partial<LetterFilterCriteria> {
    const criteria: Partial<LetterFilterCriteria> = {
      showTerminated: false
    };

    chips.forEach(chip => {
      switch (chip.key) {
        case 'showTerminated':
          criteria.showTerminated = chip.value.toLowerCase() === 'yes';
          break;

        case 'letterCode':
          criteria.letterCode = chip.value;
          break;

        case 'chapterId':
          criteria.chapterId = chip.value;
          break;

        case 'warehouseId':
          criteria.warehouseId = chip.value;
          break;
      }
    });

    return criteria;
  }

  /**
   * Format chip display text
   * Creates a formatted string like "Letter Code: BDAY"
   *
   * @param chip Filter chip
   * @returns Formatted display text
   */
  static formatChipText(chip: FilterChip): string {
    return `${chip.label}: ${chip.value}`;
  }

  /**
   * Get chip color class based on chip type
   * Can be used for styling different chip types
   *
   * @param chipKey Chip key
   * @returns CSS class name for chip styling
   */
  static getChipColorClass(chipKey: string): string {
    const colorMap: Record<string, string> = {
      showTerminated: 'chip-warning',
      letterCode: 'chip-primary',
      chapterId: 'chip-info',
      warehouseId: 'chip-info'
    };

    return colorMap[chipKey] || 'chip-default';
  }
}
