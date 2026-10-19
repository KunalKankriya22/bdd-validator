import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { VehicleDetailsFilterValue } from '../models/vehicle-details.model';

export class VehicleDetailsFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   */
  static toFilterChips(filters: VehicleDetailsFilterValue): FilterChip[] {
    const chips: FilterChip[] = [];

    // Vehicle ID filter
    if (filters.vehicleId) {
      chips.push({
        key: 'vehicleId',
        label: `Vehicle ID: ${filters.vehicleId}`,
        value: filters.vehicleId
      });
    }

    // Vehicle Type filter
    if (filters.vehicleType) {
      chips.push({
        key: 'vehicleType',
        label: `Vehicle Type: ${filters.vehicleType}`,
        value: filters.vehicleType
      });
    }

    // Show Terminated filter
    if (filters.showTerminated) {
      chips.push({
        key: 'showTerminated',
        label: 'Show Terminated: Yes',
        value: true
      });
    }

    // Effective Date filter
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const date = new Date(filters.effectiveDate);
      const formattedDate = this.formatChipDate(date);
      const period = filters.effectiveDatePeriod;
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date: ${period} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    // Termination Date filter
    if (filters.terminationDate && filters.terminationDatePeriod) {
      const date = new Date(filters.terminationDate);
      const formattedDate = this.formatChipDate(date);
      const period = filters.terminationDatePeriod;
      chips.push({
        key: 'terminationDate',
        label: `Termination Date: ${period} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilter(
    currentFilters: VehicleDetailsFilterValue,
    chipKey: string
  ): VehicleDetailsFilterValue {
    const updated = { ...currentFilters };

    switch (chipKey) {
      case 'vehicleId':
        updated.vehicleId = null;
        break;
      case 'vehicleType':
        updated.vehicleType = null;
        break;
      case 'showTerminated':
        updated.showTerminated = false;
        break;
      case 'effectiveDate':
        updated.effectiveDate = null;
        updated.effectiveDatePeriod = null;
        break;
      case 'terminationDate':
        updated.terminationDate = null;
        updated.terminationDatePeriod = null;
        break;
    }

    return updated;
  }

  /**
   * Clear all filters
   */
  static clearAll(): VehicleDetailsFilterValue {
    return {
      vehicleId: null,
      vehicleType: null,
      showTerminated: false,
      effectiveDate: null,
      effectiveDatePeriod: null,
      terminationDate: null,
      terminationDatePeriod: null
    };
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: VehicleDetailsFilterValue): boolean {
    return !!(
      filters.vehicleId ||
      filters.vehicleType ||
      filters.showTerminated ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }

  /**
   * Format date for chip display (DD-MMM-YYYY)
   */
  private static formatChipDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
