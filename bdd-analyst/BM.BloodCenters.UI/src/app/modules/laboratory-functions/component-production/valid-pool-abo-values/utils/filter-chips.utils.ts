import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PoolAboValueFilterValue } from '../models/pool-abo-values.model';

export class PoolAboValueFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static convertFiltersToChips(filters: PoolAboValueFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Blood Type filters (O Pos, O Neg, A Pos, A Neg, B Pos, B Neg, AB Pos, AB Neg)
    if (filters.opos !== undefined && filters.opos !== null) {
      chips.push({
        key: 'opos',
        label: `O Pos: ${filters.opos === 'Y' ? 'Yes' : 'No'}`,
        value: filters.opos
      });
    }

    if (filters.oneg !== undefined && filters.oneg !== null) {
      chips.push({
        key: 'oneg',
        label: `O Neg: ${filters.oneg === 'Y' ? 'Yes' : 'No'}`,
        value: filters.oneg
      });
    }

    if (filters.apos !== undefined && filters.apos !== null) {
      chips.push({
        key: 'apos',
        label: `A Pos: ${filters.apos === 'Y' ? 'Yes' : 'No'}`,
        value: filters.apos
      });
    }

    if (filters.aneg !== undefined && filters.aneg !== null) {
      chips.push({
        key: 'aneg',
        label: `A Neg: ${filters.aneg === 'Y' ? 'Yes' : 'No'}`,
        value: filters.aneg
      });
    }

    if (filters.bpos !== undefined && filters.bpos !== null) {
      chips.push({
        key: 'bpos',
        label: `B Pos: ${filters.bpos === 'Y' ? 'Yes' : 'No'}`,
        value: filters.bpos
      });
    }

    if (filters.bneg !== undefined && filters.bneg !== null) {
      chips.push({
        key: 'bneg',
        label: `B Neg: ${filters.bneg === 'Y' ? 'Yes' : 'No'}`,
        value: filters.bneg
      });
    }

    if (filters.abpos !== undefined && filters.abpos !== null) {
      chips.push({
        key: 'abpos',
        label: `AB Pos: ${filters.abpos === 'Y' ? 'Yes' : 'No'}`,
        value: filters.abpos
      });
    }

    if (filters.abneg !== undefined && filters.abneg !== null) {
      chips.push({
        key: 'abneg',
        label: `AB Neg: ${filters.abneg === 'Y' ? 'Yes' : 'No'}`,
        value: filters.abneg
      });
    }

    // Effective Date filter
    if (filters.effDate && filters.effDatePeriod) {
      const periodSymbol = filters.effDatePeriod === 'before' ? '<' : '>';
      const formattedDate = this.formatDateForChip(filters.effDate);
      chips.push({
        key: 'effDate',
        label: `Effective Date: ${periodSymbol} ${formattedDate}`,
        value: filters.effDate
      });
    }

    // Termination Date filter
    if (filters.termDate && filters.termDatePeriod) {
      const periodSymbol = filters.termDatePeriod === 'before' ? '<' : '>';
      const formattedDate = this.formatDateForChip(filters.termDate);
      chips.push({
        key: 'termDate',
        label: `Termination Date: ${periodSymbol} ${formattedDate}`,
        value: filters.termDate
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: PoolAboValueFilterValue | null,
    chipKey: string
  ): PoolAboValueFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'opos':
        delete updatedFilters.opos;
        break;
      case 'oneg':
        delete updatedFilters.oneg;
        break;
      case 'apos':
        delete updatedFilters.apos;
        break;
      case 'aneg':
        delete updatedFilters.aneg;
        break;
      case 'bpos':
        delete updatedFilters.bpos;
        break;
      case 'bneg':
        delete updatedFilters.bneg;
        break;
      case 'abpos':
        delete updatedFilters.abpos;
        break;
      case 'abneg':
        delete updatedFilters.abneg;
        break;
      case 'effDate':
        delete updatedFilters.effDate;
        delete updatedFilters.effDatePeriod;
        break;
      case 'termDate':
        delete updatedFilters.termDate;
        delete updatedFilters.termDatePeriod;
        break;
    }

    // Return null if no filters remain
    const hasFilters = Object.values(updatedFilters).some(
      (value) => value !== undefined && value !== null
    );

    return hasFilters ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: PoolAboValueFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return Object.values(filters).some(
      (value) => value !== undefined && value !== null
    );
  }

  /**
   * Format date for chip display (YYYY-MM-DD to DD-MON-YYYY)
   */
  private static formatDateForChip(dateString: string): string {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  }
}
