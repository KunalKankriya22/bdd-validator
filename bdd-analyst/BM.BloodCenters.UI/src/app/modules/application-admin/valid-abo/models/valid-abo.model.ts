/**
 * Valid ABO data model interfaces
 * Used for Valid ABO table component and related services
 */

/**
 * Main Valid ABO data model
 * Represents a single Valid ABO record from the API
 */
export interface ValidAboModel {
  code: string;
  description: string;
  intendedUse: string;
  unitScheme: string;
  transfusionStatus: string;
  mnemonic1: string;
  mnemonic2: string;
  group: string | null;
  sequence: number | null;
  aboGroupOnly: boolean;
  effectiveDate: string;
  terminationDate: string | null;
}

/**
 * Request parameters for Valid ABO API calls
 * Used for search, filter, and sort operations
 */
export interface ValidAboParamsDto {
  searchKeyword?: string;
  intendedUse?: string;
  unitScheme?: string;
  transfusionStatus?: string;
  effectivePeriod?: string;
  effectiveDate?: string;
  terminationPeriod?: string;
  terminationDate?: string;
  sort?: string;
}

/**
 * API response format for Valid ABO table data
 * Includes pagination information
 */
export interface ValidAboResponse {
  data: ValidAboModel[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Filter state for Valid ABO table
 * Tracks currently applied filters
 */
export interface ValidAboFilterValue {
  intendedUse: string | null;
  unitScheme: string | null;
  transfusionStatus: string | null;
  effectiveDateFrom: string | null;
  effectiveDateTo: string | null;
  terminationDateFrom: string | null;
  terminationDateTo: string | null;
}

/**
 * Filter dropdown options (LOV - List of Values)
 * Populated from API /dropdowns endpoint
 */
export interface ValidAboFilterLov {
  intendedUse: string[];
  unitScheme: string[];
  transfusionStatus: string[];
}

/**
 * Create/Update DTO for Valid ABO
 * Used when creating or updating records
 */
export interface ValidAboCreateDto {
  code: string;
  description: string;
  intendedUse: string;
  unitScheme: string;
  transfusionStatus: string;
  aboGroupOnly: boolean;
  mnemonic1: string;
  mnemonic2: string;
  group?: string;
  sequence?: number;
  effectiveDate: string;        // Must be string in YYYY-MM-DD format
  terminationDate?: string | undefined;  // Must be string in YYYY-MM-DD format or undefined
}

/**
 * Update DTO for Valid ABO (same as create for this domain)
 */
export type ValidAboUpdateDto = ValidAboCreateDto;

/**
 * Lookup option with code and description
 * Used for dropdown options from the lookups API
 */
export interface LookupOption {
  code: string;
  description: string;
}

/**
 * Lookups response from API
 * Contains all dropdown options for add/edit form
 */
export interface ValidAboLookupsResponse {
  intendedUse: LookupOption[];
  unitScheme: LookupOption[];
  transfusionStatus: LookupOption[];
}
