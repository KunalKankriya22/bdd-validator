/**
 * DefineDonationProceduresModel
 * Represents donation procedure configuration data from API
 */
export interface DefineDonationProceduresModel {
  donationType: string;
  donationTypeDescription: string;
  procedureCode: string;
  procedureCodeDescription: string;
  effectiveDate: string | Date;
  terminationDate?: string | Date | null;
}

/**
 * API Response wrapper
 */
export interface DefineDonationProceduresResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DefineDonationProceduresModel[];
  total: number;
}

/**
 * Request DTO for fetching Define Donation Procedures data
 */
export interface DefineDonationProceduresParamsDto {
  searchKeyword?: string;
  donationType?: string;
  procedureCode?: string;
  effectiveDate?: string; // ISO datetime string (e.g., "2020-12-31T10:30:16.590Z")
  effectiveDatePeriod?: string; // "before" or "after"
  terminationDate?: string; // ISO datetime string (e.g., "2020-12-31T10:30:16.590Z")
  terminationDatePeriod?: string; // "before" or "after"
  /** Sort direction: 'A' for ascending, 'D' for descending */
  sort?: 'A' | 'D';
}

/**
 * LookUp Model for dropdowns
 */
export interface LookUp {
  key: string;
  value: string;
}

/**
 * Filter dropdown values model
 */
export interface DonationProcedureFilterModel {
  donationTypes: LookUp[];
  procedureCodes: LookUp[];
}

/**
 * Lookup dropdown values model (for Add/Edit forms)
 */
export interface DonationProcedureLookupModel {
  donationTypes: LookUp[];
  procedureCodes: LookUp[];
}

/**
 * DTO for creating new Define Donation Procedures record
 * Matches API contract exactly
 */
export interface CreateDonationProcedureDto {
  donationType: string;
  procedureCodes: string[];
  effectiveDate: string; // ISO date string
  terminationDate?: string | null; // ISO date string or null
  chapterId?: string;
  insertUser?: string;
}

/**
 * DTO for updating existing Define Donation Procedures record
 * Matches API contract exactly
 */
export interface UpdateDonationProcedureDto {
  donationType: string;
  procedureCode: string;
  effectiveDate: string; // ISO date string
  terminationDate?: string | null; // ISO date string or null
  chapterId?: string;
  insertUser?: string;
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
