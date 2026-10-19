import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ServiceHistoryFilterValue } from '../models/service-history-query.model';

/**
 * Utility class for converting filter values to filter chips
 * and handling chip removal
 */
export class ServiceHistoryFilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   * @param filters - Current filter values
   * @returns Array of FilterChip objects
   */
  static convertFiltersToChips(filters: ServiceHistoryFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    // Equipment Type chip
    if (filters.equipmentType) {
      const label = filters.equipmentTypeDescription
        ? `${filters.equipmentType} - ${filters.equipmentTypeDescription}`
        : filters.equipmentType;

      chips.push({
        key: 'equipmentType',
        label: `Equipment Type: ${label}`,
        value: filters.equipmentType
      });
    }

    // Equipment ID chip
    if (filters.equipmentId) {
      chips.push({
        key: 'equipmentId',
        label: `Equipment ID: ${filters.equipmentId}`,
        value: filters.equipmentId
      });
    }

    // Equipment Reference chip
    if (filters.equipmentReference) {
      chips.push({
        key: 'equipmentReference',
        label: `Equipment Ref #: ${filters.equipmentReference}`,
        value: filters.equipmentReference
      });
    }

    // Start Date chip
    if (filters.startDate) {
      const formattedDate = this.formatDateForDisplay(filters.startDate);
      chips.push({
        key: 'startDate',
        label: `Start Date: ${formattedDate}`,
        value: filters.startDate
      });
    }

    // End Date chip
    if (filters.endDate) {
      const formattedDate = this.formatDateForDisplay(filters.endDate);
      chips.push({
        key: 'endDate',
        label: `End Date: ${formattedDate}`,
        value: filters.endDate
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key and return updated filter values
   * @param currentFilters - Current filter values
   * @param chipKey - Key of the chip to remove
   * @returns Updated filter values or null if all filters removed
   */
  static removeFilterByChipKey(
    currentFilters: ServiceHistoryFilterValue | null,
    chipKey: string
  ): ServiceHistoryFilterValue | null {
    if (!currentFilters) return null;

    const updatedFilters: ServiceHistoryFilterValue = { ...currentFilters };

    switch (chipKey) {
      case 'equipmentType':
        delete updatedFilters.equipmentType;
        delete updatedFilters.equipmentTypeDescription;
        // Clear dependent filters
        delete updatedFilters.equipmentId;
        delete updatedFilters.equipmentReference;
        break;
      case 'equipmentId':
        delete updatedFilters.equipmentId;
        // Clear dependent filter
        delete updatedFilters.equipmentReference;
        break;
      case 'equipmentReference':
        delete updatedFilters.equipmentReference;
        break;
      case 'startDate':
        delete updatedFilters.startDate;
        break;
      case 'endDate':
        delete updatedFilters.endDate;
        break;
    }

    // Check if any filters remain
    const hasFilters = Object.values(updatedFilters).some(
      (value) => value !== null && value !== undefined
    );

    return hasFilters ? updatedFilters : null;
  }

  /**
   * Format date for display in chips (dd-MMM-yyyy)
   * @param date - Date to format
   * @returns Formatted date string
   */
  private static formatDateForDisplay(date: Date | null): string {
    if (!date) return '';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }
}
