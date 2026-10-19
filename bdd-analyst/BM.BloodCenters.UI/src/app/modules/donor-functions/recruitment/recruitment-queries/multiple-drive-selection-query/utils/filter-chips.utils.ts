import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import {
  MultipleDriveFilterRequest,
  MultipleDriveSelectionLookups
} from '../models/multiple-drive-selection-query.model';

/**
 * Utility class for converting filters to filter chips
 */
export class MultipleDriveFilterChipsUtils {
  /**
   * Convert filter request object to filter chips array
   * @param filters - Filter request object
   * @param lookups - Lookup data for mapping codes to descriptions
   * @returns Array of filter chips
   */
  static convertFiltersToChips(
    filters: MultipleDriveFilterRequest,
    lookups: MultipleDriveSelectionLookups | null
  ): FilterChip[] {
    if (!lookups) {
      return [];
    }

    const chips: FilterChip[] = [];

    // Column selection
    if (filters.select && filters.select.length > 0) {
      const columnLabels = filters.select
        .map(code => lookups.select.find(s => s.code === code)?.description || code)
        .join(', ');
      chips.push({
        key: 'select',
        label: `Columns: ${columnLabels}`,
        value: filters.select,
        removable: true
      });
    }

    // Facility
    if (filters.facility && filters.facility.length > 0) {
      const facilityLabels = filters.facility
        .map(code => lookups.facility.find(f => f.code === code)?.description || code)
        .join(', ');
      chips.push({
        key: 'facility',
        label: `Facility: ${facilityLabels}`,
        value: filters.facility,
        removable: true
      });
    }

    // Status
    if (filters.status && filters.status.length > 0) {
      const statusLabels = filters.status
        .map(code => lookups.status.find(s => s.code === code)?.description || code)
        .join(', ');
      chips.push({
        key: 'status',
        label: `Status: ${statusLabels}`,
        value: filters.status,
        removable: true
      });
    }

    // Sponsors
    if (filters.sponsors && filters.sponsors.length > 0) {
      const sponsorLabels = filters.sponsors
        .map(code => lookups.sponsors.find(s => s.code === code)?.description || code)
        .join(', ');
      chips.push({
        key: 'sponsors',
        label: `Sponsor: ${sponsorLabels}`,
        value: filters.sponsors,
        removable: true
      });
    }

    // Zip Code
    if (filters.zipCode && filters.zipCode.length > 0) {
      const zipCodes = filters.zipCode;
      const zipLabels = zipCodes.map(code =>
        lookups.zipCode.find(z => z.code === code)?.description || code
      );

      // Show up to 3 individual chips
      zipLabels.slice(0, 3).forEach((label, index) => {
        chips.push({
          key: `zipCode_${index}`,
          label: `Zip Code: ${label}`,
          value: zipCodes[index],
          removable: true
        });
      });

      // Add +N chip if more than 3
      if (zipCodes.length > 3) {
        chips.push({
          key: 'zipCode_more',
          label: `Zip Code: +${zipCodes.length - 3}`,
          value: zipCodes.slice(3),
          removable: false
        });
      }
    }

    // Sponsor Category
    if (filters.sponsorCategory) {
      const categoryLabel = lookups.sponsorCategory.find(c => c.code === filters.sponsorCategory)?.description || filters.sponsorCategory;
      chips.push({
        key: 'sponsorCategory',
        label: `Sponsor Category: ${categoryLabel}`,
        value: filters.sponsorCategory,
        removable: true
      });
    }

    // Territory
    if (filters.territory && filters.territory.length > 0) {
      const territories = filters.territory;
      const territoryLabels = territories.map(code =>
        lookups.territory.find(t => t.code === code)?.description || code
      );

      // Show up to 3 individual chips
      territoryLabels.slice(0, 3).forEach((label, index) => {
        chips.push({
          key: `territory_${index}`,
          label: `Territory: ${label}`,
          value: territories[index],
          removable: true
        });
      });

      // Add +N chip if more than 3
      if (territories.length > 3) {
        chips.push({
          key: 'territory_more',
          label: `Territory: +${territories.length - 3}`,
          value: territories.slice(3),
          removable: false
        });
      }
    }

    // Procedure
    if (filters.procedure) {
      const procedureLabel = lookups.procedure.find(p => p.code === filters.procedure)?.description || filters.procedure;
      chips.push({
        key: 'procedure',
        label: `Procedure: ${procedureLabel}`,
        value: filters.procedure,
        removable: true
      });
    }

    // Drive Category
    if (filters.driveCategory && filters.driveCategory.length > 0) {
      const driveCategories = filters.driveCategory;
      const categoryLabels = driveCategories.map(code =>
        lookups.driveCategory.find(d => d.code === code)?.description || code
      );

      // Show up to 3 individual chips
      categoryLabels.slice(0, 3).forEach((label, index) => {
        chips.push({
          key: `driveCategory_${index}`,
          label: `Drive Category: ${label}`,
          value: driveCategories[index],
          removable: true
        });
      });

      // Add +N chip if more than 3
      if (driveCategories.length > 3) {
        chips.push({
          key: 'driveCategory_more',
          label: `Drive Category: +${driveCategories.length - 3}`,
          value: driveCategories.slice(3),
          removable: false
        });
      }
    }

    // Fixed Drive
    if (filters.fixedDrive) {
      const fixedLabel = lookups.fixedDrive.find(f => f.code === filters.fixedDrive)?.description || filters.fixedDrive;
      chips.push({
        key: 'fixedDrive',
        label: `Fixed Drive: ${fixedLabel}`,
        value: filters.fixedDrive,
        removable: true
      });
    }

    // Projected Draw Range
    if (filters.minimumProjectDraw !== undefined || filters.maximumProjectDraw !== undefined) {
      const min = filters.minimumProjectDraw ?? 0;
      const max = filters.maximumProjectDraw ?? '∞';
      chips.push({
        key: 'projectedDraw',
        label: `Projected Draw: ${min} - ${max}`,
        value: { min: filters.minimumProjectDraw, max: filters.maximumProjectDraw },
        removable: true
      });
    }

    // Travel Time
    if (filters.minimumTravelTime != null || filters.maximumTravelTime != null) {
      const minLabel =
        filters.minimumTravelTime != null ? `${filters.minimumTravelTime} mins` : '—';
      const maxLabel =
        filters.maximumTravelTime != null ? `${filters.maximumTravelTime} mins` : '—';
      chips.push({
        key: 'travelTime',
        label: `Travel Time: ${minLabel} - ${maxLabel}`,
        value: {
          min: filters.minimumTravelTime,
          max: filters.maximumTravelTime
        },
        removable: true
      });
    }

    // Drive Duration Range
    if (
      filters.minimumDriveDurationHour !== undefined ||
      filters.minimumDriveDurationMinute !== undefined ||
      filters.maximumDriveDurationHour !== undefined ||
      filters.maximumDriveDurationMinute !== undefined
    ) {
      const minHrs = filters.minimumDriveDurationHour ?? 0;
      const minMins = filters.minimumDriveDurationMinute ?? 0;
      const maxHrs = filters.maximumDriveDurationHour ?? 0;
      const maxMins = filters.maximumDriveDurationMinute ?? 0;
      chips.push({
        key: 'driveDuration',
        label: `Drive Duration: ${minHrs}h ${minMins}m - ${maxHrs}h ${maxMins}m`,
        value: { minHrs, minMins, maxHrs, maxMins },
        removable: true
      });
    }

    // Drive Start Time Range
    if (
      filters.minimumDriveStartTimeEnterTime &&
      filters.minimumDriveStartTimeAMorPM &&
      filters.maximumDriveStartTimeEnterTime &&
      filters.maximumDriveStartTimeAMorPM
    ) {
      const minTime = `${filters.minimumDriveStartTimeEnterTime} ${filters.minimumDriveStartTimeAMorPM}`;
      const maxTime = `${filters.maximumDriveStartTimeEnterTime} ${filters.maximumDriveStartTimeAMorPM}`;
      chips.push({
        key: 'driveStartTime',
        label: `Start Time: ${minTime} - ${maxTime}`,
        value: { minTime, maxTime },
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   * @param filters - Current filter request object
   * @param chipKey - Key of the chip to remove
   * @param chipValue - Optional value to remove from array (for individual multi-select chips)
   * @returns Updated filter request object
   */
  static removeFilterByChipKey(
    filters: MultipleDriveFilterRequest,
    chipKey: string,
    chipValue?: any
  ): MultipleDriveFilterRequest {
    const updatedFilters = { ...filters };

    // Handle individual multi-select chip removal (e.g., zipCode_0, territory_1, driveCategory_2)
    if (chipKey.startsWith('zipCode_') && chipValue !== undefined) {
      updatedFilters.zipCode = filters.zipCode?.filter(code => code !== chipValue) || [];
      return updatedFilters;
    }
    if (chipKey.startsWith('territory_') && chipValue !== undefined) {
      updatedFilters.territory = filters.territory?.filter(code => code !== chipValue) || [];
      return updatedFilters;
    }
    if (chipKey.startsWith('driveCategory_') && chipValue !== undefined) {
      updatedFilters.driveCategory = filters.driveCategory?.filter(code => code !== chipValue) || [];
      return updatedFilters;
    }

    switch (chipKey) {
      case 'select':
        updatedFilters.select = [];
        break;
      case 'facility':
        updatedFilters.facility = [];
        break;
      case 'status':
        updatedFilters.status = [];
        break;
      case 'sponsors':
        updatedFilters.sponsors = [];
        break;
      case 'zipCode':
      case 'zipCode_more':
        updatedFilters.zipCode = [];
        break;
      case 'sponsorCategory':
        updatedFilters.sponsorCategory = undefined;
        break;
      case 'territory':
      case 'territory_more':
        updatedFilters.territory = [];
        break;
      case 'procedure':
        updatedFilters.procedure = undefined;
        break;
      case 'driveCategory':
      case 'driveCategory_more':
        updatedFilters.driveCategory = [];
        break;
      case 'fixedDrive':
        updatedFilters.fixedDrive = undefined;
        break;
      case 'projectedDraw':
        updatedFilters.minimumProjectDraw = undefined;
        updatedFilters.maximumProjectDraw = undefined;
        break;
      case 'travelTime':
        updatedFilters.minimumTravelTime = undefined;
        updatedFilters.maximumTravelTime = undefined;
        break;
      case 'driveDuration':
        updatedFilters.minimumDriveDurationHour = 0;
        updatedFilters.minimumDriveDurationMinute = 0;
        updatedFilters.maximumDriveDurationHour = 8;
        updatedFilters.maximumDriveDurationMinute = 0;
        break;
      case 'driveStartTime':
        updatedFilters.minimumDriveStartTimeEnterTime = '';
        updatedFilters.minimumDriveStartTimeAMorPM = '';
        updatedFilters.maximumDriveStartTimeEnterTime = '';
        updatedFilters.maximumDriveStartTimeAMorPM = '';
        break;
    }

    return updatedFilters;
  }

  /**
   * Check if there are any active filters beyond the required date range
   * @param filters - Filter request object
   * @returns True if there are active optional filters
   */
  static hasActiveFilters(filters: MultipleDriveFilterRequest): boolean {
    return !!(
      (filters.select && filters.select.length > 0) ||
      (filters.facility && filters.facility.length > 0) ||
      (filters.status && filters.status.length > 0) ||
      (filters.sponsors && filters.sponsors.length > 0) ||
      (filters.zipCode && filters.zipCode.length > 0) ||
      filters.sponsorCategory ||
      (filters.territory && filters.territory.length > 0) ||
      filters.procedure ||
      (filters.driveCategory && filters.driveCategory.length > 0) ||
      filters.fixedDrive ||
      filters.minimumProjectDraw !== undefined ||
      filters.maximumProjectDraw !== undefined ||
      filters.minimumTravelTime != null ||
      filters.maximumTravelTime != null ||
      filters.minimumDriveDurationHour !== undefined ||
      filters.minimumDriveDurationMinute !== undefined ||
      filters.maximumDriveDurationHour !== undefined ||
      filters.maximumDriveDurationMinute !== undefined ||
      filters.minimumDriveStartTimeEnterTime ||
      filters.maximumDriveStartTimeEnterTime
    );
  }
}
