/**
 * VenipunctureAttributesModel
 * Model for venipuncture attributes table data
 */
export interface VenipunctureAttributesModel {
  group?: string;
  code?: string;
  description?: string;
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
  lastModifiedDate?: Date | null;
}

/**
 * Request DTO for fetching Venipuncture Attributes data
 * Dates should be formatted as strings (YYYY-MM-DD) for API calls
 */
export interface VenipunctureAttributesParamsDto {
  SearchKeyword?: string;
  Code?: string;
  EffectiveDate?: Date | string | null;
  EffectiveDatePeriod?: string | null;
  TerminationDate?: Date | string | null;
  TerminationDatePeriod?: string | null;
  Sort?: string;
}

export type SortDirection = 'A' | 'D' | 'default';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 * Dates are formatted as strings (YYYY-MM-DD) when emitted from the filter panel
 */
export interface VenipunctureAttributesFilterValue {
  code: string | null;
  effectiveDate: Date | string | null;
  effectiveDatePeriod: string | null;
  terminationDate: Date | string | null;
  terminationDatePeriod: string | null;
}

/**
 * Filter LOV Model
 */
export interface VenipunctureAttributesFilterLov {
  code?: string[];
}

/**
 * DTO for adding new Venipuncture Attributes record
 */
export interface VenipunctureAttributesDto {
  group: string;
  code: string;
  description: string;
  effectiveDate: Date | null;
  terminationDate?: Date | null;
  insertUser?: string; // Optional - will be set by service from cookie
}

/**
 * DTO for updating existing Venipuncture Attributes record
 */
export interface UpdateVenipunctureAttributesDto {
  // Current values (to identify the record)
  currentGroup: string;
  currentCode: string;

  // New values
  group: string;
  code: string;
  description: string;
  effectiveDate: Date | null;
  terminationDate?: Date | null;
}
