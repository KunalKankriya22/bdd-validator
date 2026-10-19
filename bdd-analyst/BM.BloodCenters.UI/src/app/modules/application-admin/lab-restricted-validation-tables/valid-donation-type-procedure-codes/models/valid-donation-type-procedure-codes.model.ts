/**
 * ValidDonationTypeProcedureCodesModel
 * Represents valid donation type/procedure codes configuration data from API
 */
export interface ValidDonationTypeProcedureCodesModel {
  donationType?: string;
  procedureCode?: string;
  attribGroup?: string;
  attribCode?: string;
  effectiveDate?: string | Date | null;
  terminationDate?: string | Date | null;
  modificationDate?: string | Date | null;
  sortSequence?: number;
}

/**
 * API Response wrapper
 */
export interface ValidDonationTypeProcedureCodesResponse {
  success: boolean;
  message: string;
  statuscode: number;
  data: ValidDonationTypeProcedureCodesModel[];
}

/**
 * Request DTO for fetching Valid Donation Type/Procedure Codes data
 */
export interface ValidDonationTypeProcedureCodesParamsDto {
  searchKeyword?: string;
  donationType?: string;
  procedureCode?: string;
  attribGroup?: string;
  effectiveDateBefore?: string; // ISO datetime string (e.g., "2026-02-20T09:54:22.570Z")
  effectiveDateAfter?: string; // ISO datetime string (e.g., "2026-02-20T09:54:22.570Z")
  /** Sort direction */
  sort?: string;
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
export interface ValidDonationTypeProcedureCodesFilterValue {
  donationType: string | null;
  procedureCode: string | null;
  attributeGroup: string | null;
  periodType1: string | null;
  effectiveDate: Date | null;
  periodType2: string | null;
  terminationDate: Date | null;
}

/**
 * DTO for adding new Valid Donation Type/Procedure Codes record
 * Matches API contract exactly
 */
export interface ValidDonationTypeProcedureCodesDto {
  donationType?: string;
  procedureCode?: string;
  attribGroup: string;
  attribCode: string;
  effectiveDate: string; // ISO date string
  terminationDate?: string; // ISO date string
  sortSequence: number;
}

/**
 * DTO for updating existing Valid Donation Type/Procedure Codes record
 * Matches API contract exactly
 */
export interface UpdateValidDonationTypeProcedureCodesDto {
  currentDonationType?: string;
  currentProcedureCode?: string;
  currentAttribGroup: string;
  currentAttribCode: string;
  currentEffectiveDate: string; // ISO date string
  terminationDate?: string; // ISO date string
  sortSequence: number;
}

/**
 * Dropdown options for donation types
 */
export interface DonationTypeDropdown {
  donationType: string;
  description?: string;
}

/**
 * Dropdown options for procedure codes
 */
export interface ProcedureCodeDropdown {
  procedureCode: string;
  description?: string;
}

/**
 * Dropdown options for attribute groups
 */
export interface AttributeGroupDropdown {
  attribGroup: string;
  description?: string;
}

/**
 * Dropdown options for attribute codes
 */
export interface AttributeCodeDropdown {
  attribCode: string;
  description?: string;
}

/**
 * Filter options response from API
 */
export interface ValidDonProcAttributeFiltersResponse {
  donationTypes: string[];
  procedureCodes: string[];
  attribGroups: string[];
  attribCodes: string[];
}
