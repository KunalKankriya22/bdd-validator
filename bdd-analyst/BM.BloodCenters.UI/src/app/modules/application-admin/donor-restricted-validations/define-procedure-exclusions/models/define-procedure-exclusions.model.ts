/**
 * DefineProcedureExclusionsModel
 * Represents a procedure exclusion record from API
 */
export interface DefineProcedureExclusionsModel {
  donationType?: string;
  donationTypeDesc?: string;
  procedure?: string;
  procedureDesc?: string;
  interdiction?: string;
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
}

/**
 * Request DTO for fetching Procedure Exclusions data
 */
export interface DefineProcedureExclusionsParamsDto {
  searchKeyword?: string;
  donationType?: string;
  procedureCode?: string;
  interdictionCode?: string;
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
export interface DefineProcedureExclusionsFilterValue {
  donationType: string | null;
  procedureCode: string | null;
  interdictionCode: string | null;
}

/**
 * Key-Value pair for dropdown options
 */
export interface KeyValueOption {
  key: string;
  value: string;
}

/**
 * Filter LOV Model for dropdown options
 */
export interface DefineProcedureExclusionsFilterLov {
  donationTypes?: KeyValueOption[];
  procedureCodes?: KeyValueOption[];
  interdictionCodes?: KeyValueOption[];
}

/**
 * DTO for adding new Procedure Exclusion record
 */
export interface DefineProcedureExclusionsDto {
  donationType: string;
  procedureCode: string;
  interdictionCode: string;
  effectiveDate: Date | string | null;
  terminationDate?: Date | string | null;
}

/**
 * DTO for updating existing Procedure Exclusion record
 */
export interface UpdateDefineProcedureExclusionsDto {
  originalDonationType: string;
  originalProcedureCode: string;
  originalInterdictionCode: string;
  donationType: string;
  procedureCode: string;
  interdictionCode: string;
  effectiveDate: Date | string | null;
  terminationDate?: Date | string | null;
}
