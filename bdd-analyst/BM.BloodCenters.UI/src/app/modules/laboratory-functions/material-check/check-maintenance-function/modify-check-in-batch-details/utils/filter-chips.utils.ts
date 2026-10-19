import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { CheckInBatchFilterValue } from '../models/modify-check-in-batch.model';
import moment from 'moment';

export class CheckInBatchFilterChipsUtils {
  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: CheckInBatchFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}`,
        value: filters.productType,
      });
    }

    if (filters.checkInUserId) {
      chips.push({
        key: 'checkInUserId',
        label: `Check-In User: ${filters.checkInUserId}`,
        value: filters.checkInUserId,
      });
    }

    if (filters.shippedDate && filters.shippedDatePeriod) {
      chips.push({
        key: 'shippedDate',
        label: `Shipped Date ${filters.shippedDatePeriod}: ${this.formatDate(filters.shippedDate)}`,
        value: filters.shippedDate,
      });
    }

    if (filters.receivedDate && filters.receivedDatePeriod) {
      chips.push({
        key: 'receivedDate',
        label: `Received Date ${filters.receivedDatePeriod}: ${this.formatDate(filters.receivedDate)}`,
        value: filters.receivedDate,
      });
    }

    if (filters.qcDate && filters.qcDatePeriod) {
      chips.push({
        key: 'qcDate',
        label: `QC Date ${filters.qcDatePeriod}: ${this.formatDate(filters.qcDate)}`,
        value: filters.qcDate,
      });
    }

    if (filters.batchDate && filters.batchDatePeriod) {
      chips.push({
        key: 'batchDate',
        label: `Batch Date ${filters.batchDatePeriod}: ${this.formatDate(filters.batchDate)}`,
        value: filters.batchDate,
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   */
  static removeFilterByChipKey(
    filters: CheckInBatchFilterValue | null,
    chipKey: string
  ): CheckInBatchFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'productType':
        delete updatedFilters.productType;
        break;
      case 'checkInUserId':
        delete updatedFilters.checkInUserId;
        break;
      case 'shippedDate':
        delete updatedFilters.shippedDate;
        delete updatedFilters.shippedDatePeriod;
        break;
      case 'receivedDate':
        delete updatedFilters.receivedDate;
        delete updatedFilters.receivedDatePeriod;
        break;
      case 'qcDate':
        delete updatedFilters.qcDate;
        delete updatedFilters.qcDatePeriod;
        break;
      case 'batchDate':
        delete updatedFilters.batchDate;
        delete updatedFilters.batchDatePeriod;
        break;
    }

    return Object.keys(updatedFilters).length > 0 ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   */
  static hasActiveFilters(filters: CheckInBatchFilterValue | null): boolean {
    if (!filters) return false;
    return Object.keys(filters).length > 0;
  }

  /**
   * Format moment date for display
   */
  private static formatDate(date: moment.Moment): string {
    return date.format('DD-MMM-YYYY').toUpperCase();
  }
}
