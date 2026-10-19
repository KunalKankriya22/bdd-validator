/**
 * Core data model for Valid Facility Identifiers from API
 */
export interface ValidFacilityIdentifiersModel {
  chapterId?: string;              // Primary key (unique)
  facilityIdentifier?: string;     // Editable
  effDate?: string | Date | null;  // Editable
  termDate?: string | Date | null; // Editable (optional)
  insertDate?: string | Date | null;
  insertUser?: string;
}

/**
 * API Response wrapper
 */
export interface ValidFacilityIdentifiersResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ValidFacilityIdentifiersModel[];
  total: number;
}

/**
 * API request parameters for list endpoint
 * Used for pagination, sorting, and filtering
 */
export interface ValidFacilityIdentifiersParamsDto {
  searchKeyword?: string;
  chapterId?: string;
  effectiveDate?: string;      // Format: YYYY-MM-DD
  effectivePeriod?: string;    // "Before" | "After"
  terminationDate?: string;    // Format: YYYY-MM-DD
  terminationPeriod?: string;  // "Before" | "After"
  sort?: 'A' | 'D';
}

/**
 * Filter form values
 * Represents the structure of the filter panel form
 */
export interface ValidFacilityIdentifiersFilterValue {
  chapterId: string | null;
  effectivePeriod: string | null;
  effectiveDate: Date | null;
  terminationPeriod: string | null;
  terminationDate: Date | null;
}

/**
 * DTO for creating new Valid Facility Identifier record
 * Matches API contract for POST /api/v1/valid-facility-identifiers
 */
export interface ValidFacilityIdentifiersDto {
  chapterId: string;
  facilityIdentifier: string;
  effDate: string;    // ISO date string
  termDate?: string;  // ISO date string (optional)
}

/**
 * DTO for updating existing Valid Facility Identifier record
 * Matches API contract for PUT /api/v1/valid-facility-identifiers
 */
export interface UpdateValidFacilityIdentifiersDto {
  chapterId: string;                    // Read-only, for identification
  originalFacilityIdentifier: string;   // Original facility identifier value
  facilityIdentifier: string;           // New/updated facility identifier (editable)
  effDate: string;                      // Read-only (ISO date string)
  termDate?: string;                    // Editable (ISO date string, optional)
}

/**
 * Sort direction type
 */
export type SortDirection = 'A' | 'D' | 'default';

/**
 * Sort configuration
 */
export interface SortConfig {
  column: string;
  direction: SortDirection;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
}
