/**
 * DefineDurationBetweenProceduresModel
 * Represents a duration rule between procedures
 */
export interface DefineDurationBetweenProceduresModel {
  currDonationType?: string;
  currDonationTypeDescription?: string;
  procedureCode?: string;
  procedureCodeDescription?: string;
  prevProcedureCode?: string;
  prevProcedureCodeDescription?: string;
  daysBetween?: number;
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
  chapterId?: string;
  programId?: string;
  insertUser?: string;
}

/**
 * Request DTO for fetching Define Duration Between Procedures data
 */
export interface DefineDurationBetweenProceduresParamsDto {
  searchKeyword?: string;
  currDonationType?: string;
  procedureCode?: string;
  activeOnly?: boolean;
  sort?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  terminationDateFrom?: string;
  terminationDateTo?: string;
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
export interface DefineDurationBetweenProceduresFilterValue {
  currDonationType: string | null;
  procedureCode: string | null;
  effectiveDate: Date | null;
  effectiveDatePeriod: 'AFTER' | 'BEFORE' | null;
  terminationDate: Date | null;
  terminationDatePeriod: 'AFTER' | 'BEFORE' | null;
  activeOnly: boolean;
}

/**
 * Donation Type Lookup
 */
export interface DonationType {
  donationType: string;
  description: string;
  sortSequence: number;
}

/**
 * Procedure Code Lookup
 */
export interface ProcedureCode {
  procedureCode: string;
  description: string;
  sortSequence: number;
}

/**
 * Filter LOV Model
 * Contains dropdown options for filters
 */
export interface DefineDurationBetweenProceduresFilterLov {
  currDonationType?: string[];
  procedureCode?: string[];
  prevProcedureCode?: string[];
}

/**
 * DTO for adding new Define Duration Between Procedures record
 */
export interface DefineDurationBetweenProceduresDto {
  currDonationType: string;
  procedureCode: string;
  prevProcedureCode: string;
  daysBetween: number;
  effectiveDate: Date | null;
  terminationDate?: Date | null;
  chapterId: string;
  programId: string;
  InsertUser: string;
}

/**
 * DTO for updating existing Define Duration Between Procedures record
 * Note: Same structure as add, but with UpdateUser instead of InsertUser
 */
export interface UpdateDefineDurationBetweenProceduresDto {
  currDonationType: string;
  procedureCode: string;
  prevProcedureCode: string;
  daysBetween: number;
  effectiveDate: Date | null;
  terminationDate?: Date | null;
  chapterId: string;
  programId: string;
  insertUser: string;
}
