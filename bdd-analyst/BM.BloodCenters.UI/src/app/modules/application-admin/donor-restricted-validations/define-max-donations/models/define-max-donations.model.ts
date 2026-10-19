/**
 * DefineMaxDonationsModel
 * Represents maximum donation configuration data from API
 * Maps to VALID_ELIG_PERIODS table
 */
export interface DefineMaxDonationsModel {
  donationType?: string;           // CURR_DONATION_TYPE
  donationDescription?: string;        // Description from API response
  procedureGroup?: string;         // PROCEDURE_GROUP
  procedureDescription?: string;   // Description from VALID_MASTER_CODES
  maxDonations?: number;           // MAX_DONATIONS (API field name)
  interval?: number;               // DAYS_BETWEEN (API field name)
  effDate?: string | Date | null;  // EFF_DATE
  termDate?: string | Date | null; // TERM_DATE
  programId?: string;
  chapterId?: string;
  insertDate?: string | Date | null;
  insertUser?: string;
}

/**
 * API Response wrapper
 */
export interface DefineMaxDonationsResponse {
  success: boolean;
  message: string;
  statuscode: number;
  data: DefineMaxDonationsModel[];
}

/**
 * Request DTO for fetching Define Max Donations data
 */
export interface DefineMaxDonationsParamsDto {
  searchKeyword?: string;
  donationType?: string;
  procedureGroup?: string;
  effectiveDate?: string;      // ISO datetime string (e.g., "2020-12-31T10:30:16.590Z")
  effectivePeriod?: string;    // "Before" or "After"
  terminationDate?: string;    // ISO datetime string (e.g., "2020-12-31T10:30:16.590Z")
  terminationPeriod?: string;  // "Before" or "After"
  sort?: string;               // Sort direction
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
export interface DefineMaxDonationsFilterValue {
  donationType: string | null;
  effectiveDate: Date | null;
  periodType1: string | null;
  terminationDate: Date | null;
  periodType2: string | null;
}

/**
 * DTO for adding new Define Max Donations record
 * Matches API contract exactly
 */
export interface DefineMaxDonationsDto {
  donationType: string;
  procedureGroup: string;
  maxDonations: number;     // API field name for add endpoint
  interval: number;         // API field name
  effDate: string;          // ISO date string
  termDate?: string;        // ISO date string or empty string
}

/**
 * DTO for updating existing Define Max Donations record
 * Matches API contract exactly
 *
 * NOTE: The composite key for updates includes (donationType, procedureGroup, originalInterval)
 * The originalInterval must be sent to identify which record to update
 */
export interface UpdateDefineMaxDonationsDto {
  donationType: string;     // Original key - part of composite identifier
  procedureGroup: string;   // Original key - part of composite identifier
  maxDonations: number;     // Updated value (API field name)
  originalInterval: number; // Original key - part of composite identifier (required for update)
  interval: number;         // Updated value (API field name) - can be different from originalInterval
  effDate: string;          // ISO date string
  termDate?: string;        // ISO date string or empty string
}

/**
 * Donation Type dropdown data
 * Used in add/edit forms and filter panels
 */
export interface DonationTypeDropdown {
  donationType: string;
  donationTypeDescription?: string;
}

/**
 * Procedure Group dropdown data
 * Used in add/edit forms
 */
export interface ProcedureGroupDropdown {
  procedureGroup: string;
  procedureDescription?: string;
}
