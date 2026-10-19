/**
 * DefineDonationTypesModel
 * Represents donation type configuration data from API
 */
export interface DefineDonationTypesModel {
  chapterId?: string;
  donationType?: string;
  description?: string;
  testNeededFlag?: string;
  sortSequence?: number;
  effDate?: string | Date | null;
  termDate?: string | Date | null;
  programId?: string;
}

/**
 * API Response wrapper
 */
export interface DefineDonationTypesResponse {
  success: boolean;
  message: string;
  statuscode: number;
  data: DefineDonationTypesModel[];
}

/**
 * Request DTO for fetching Define Donation Types data
 */
export interface DefineDonationTypesParamsDto {
  searchKeyword?: string;
  donationType?: string;
  sortSequence?: number;
  effectiveDate?: string; // ISO datetime string (e.g., "2020-12-31T10:30:16.590Z")
  effectivePeriod?: string; // "Before" or "After"
  terminationDate?: string; // ISO datetime string (e.g., "2020-12-31T10:30:16.590Z")
  terminationPeriod?: string; // "Before" or "After"
  /** Sort direction: 'A' for ascending, 'D' for descending */
  sort?: 'A' | 'D';
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
 */
export interface DefineDonationTypesFilterValue {
  donationTypeCode: string | null;
  testingRequired: boolean | null;
}

/**
 * DTO for adding new Define Donation Types record
 * Matches API contract exactly
 */
export interface DefineDonationTypesDto {
  donationType: string;
  description: string;
  testNeededFlag: string; // "Y" or "N"
  sortSequence: number;
  effDate: string; // ISO date string
  termDate?: string; // ISO date string or empty string
}

/**
 * DTO for updating existing Define Donation Types record
 * Matches API contract exactly
 */
export interface UpdateDefineDonationTypesDto {
  donationType: string;
  description: string;
  testNeededFlag: string; // "Y" or "N"
  sortSequence: number;
  effDate: string; // ISO date string
  termDate?: string; // ISO date string or empty string
}
