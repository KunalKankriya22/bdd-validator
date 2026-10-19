/**
 * DefineProcedureGroupsModel
 * Represents procedure group mapping data from API
 * Matches backend response model exactly
 */
export interface DefineProcedureGroupsModel {
  procedureGroup?: string;
  procedureCode?: string;
  effDate?: string | Date | null;
  termDate?: string | Date | null;
  eligCreditCount?: number;
  chapterId?: string;
  programId?: string;
  groupDescription?: string;
  procedureDescription?: string;
}

/**
 * Request DTO for fetching Define Procedure Groups data
 * Matches backend API request body structure
 */
export interface DefineProcedureGroupsParamsDto {
  searchKeyword?: string;
  procedureGroup?: string;
  procedureCode?: string;
  effectiveDateAfter?: string;
  effectiveDateBefore?: string;
  terminationDateAfter?: string;
  terminationDateBefore?: string;
  includeTerminated?: boolean;
  chapterId?: string;
  eligCreditCount?: number;
  /** Sort direction: PROCEDURE_GROUP_DESC or PROCEDURE_GROUP_ASC */
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
export interface DefineProcedureGroupsFilterValue {
  procedureGroupCode: string | null;
  procedureCode: string | null;
  donationCredits: number | null;
  effectiveDatePeriod: 'After' | 'Before' | null;
  effectiveDate: Date | null;
  terminationDatePeriod: 'After' | 'Before' | null;
  terminationDate: Date | null;
}

/**
 * Filter LOV Model - Legacy (kept for backward compatibility)
 */
export interface DefineProcedureGroupsFilterLov {
  procedureGroupCode?: string[];
  procedureCode?: string[];
}

/**
 * Lookup Models for Filter Dropdowns
 */
export interface ProcedureGroupLookup {
  code: string;
  description: string;
}

export interface ProcedureCodeLookup {
  procedureCode: string;
  description: string;
}

export interface CreditCountLookup {
  creditCount: number;
  description: string;
  recordCount: number;
}

/**
 * User Context Model
 * Represents user context information from the API
 */
export interface UserContext {
  userId: string;
  chapterId: string;
  printerId: string;
  programId: string;
  hasAccess: boolean;
  permissions: string[];
}

/**
 * DTO for adding new Define Procedure Groups mapping record
 * Matches the API POST request structure
 */
export interface DefineProcedureGroupsDto {
  procedureGroup: string;
  procedureCode: string;
  effDate: string; // Format: ISO 8601 (e.g., 2026-02-13T07:32:05.149Z)
  termDate?: string | null; // Format: ISO 8601 (e.g., 2026-02-13T07:32:05.149Z)
  eligCreditCount: number;
  chapterId: string;
  programId: string;
  insertUser: string;
}

/**
 * DTO for updating existing Define Procedure Groups mapping record
 * Matches the API PUT request structure
 */
export interface UpdateDefineProcedureGroupsDto {
  procedureGroup: string;
  procedureCode: string;
  effDate: string; // Format: ISO 8601 (e.g., 2026-02-13T07:32:05.149Z)
  termDate?: string | null; // Format: ISO 8601 (e.g., 2026-02-13T07:32:05.149Z)
  eligCreditCount: number;
  programId: string;
}
