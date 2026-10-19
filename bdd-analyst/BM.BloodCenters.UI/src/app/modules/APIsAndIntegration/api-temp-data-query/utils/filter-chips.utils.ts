import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ApiTempDataQueryFilterValue } from '../api-temp-data-query-filter-panel/api-temp-data-query-filter-panel';
import { IdTypeOption, SourceIdOption } from '../models/api-temp-data-query.model';

export class ApiTempDataQueryFilterChipsUtils {
  /**
   * Format date to display string (DD-MMM-YYYY)
   */
  private static formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(
    filters: ApiTempDataQueryFilterValue | null,
    idTypes: IdTypeOption[],
    sourceIds: SourceIdOption[]
  ): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.idType) {
      chips.push({
        key: 'idType',
        label: `ID Type: ${filters.idType}`,
        value: filters.idType
      });
    }

    if (filters.sourceId) {
      const sourceId = sourceIds.find(s => s.sourceId === filters.sourceId);
      const displayValue = sourceId ? sourceId.sourceId : filters.sourceId;
      chips.push({
        key: 'sourceId',
        label: `Source ID: ${displayValue}`,
        value: filters.sourceId
      });
    }

    if (filters.insertDate && filters.periodType) {
      const formattedDate = this.formatDate(filters.insertDate);
      // Show ≥ for "after" and ≤ for "before"
      const symbol = filters.periodType === 'after' ? '≥' : '≤';
      chips.push({
        key: 'insertDate',
        label: `Insert Date ${symbol} ${formattedDate}`,
        value: filters.insertDate
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: ApiTempDataQueryFilterValue | null,
    chipKey: string
  ): ApiTempDataQueryFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'idType':
        updatedFilters.idType = undefined;
        break;
      case 'sourceId':
        updatedFilters.sourceId = undefined;
        break;
      case 'insertDate':
        updatedFilters.insertDate = undefined;
        updatedFilters.periodType = undefined;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: ApiTempDataQueryFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.idType ||
      filters.sourceId ||
      (filters.insertDate && filters.periodType)
    );
  }
}
