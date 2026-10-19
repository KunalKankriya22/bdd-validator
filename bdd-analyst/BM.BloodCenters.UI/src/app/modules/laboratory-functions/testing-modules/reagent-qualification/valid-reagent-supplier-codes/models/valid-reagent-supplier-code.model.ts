/**
 * Valid Reagent Supplier Code model
 * Maps to backend API: /api/v1/valid-reagent-supplier-codes
 * Backend table: SUPPLIERS
 */

/**
 * Valid Reagent Supplier Code entity
 */
export interface ValidReagentSupplierCode {
  supplierCode: string;
  supplierName: string;
  effDate: string; // ISO date string from API
  termDate: string | null; // ISO date string from API
  lastModifyDate: string | null; // ISO date string from API
  lastModifyUser: string | null;
}

/**
 * DTO for creating a new Valid Reagent Supplier Code
 */
export interface CreateValidReagentSupplierCodeDto {
  supplierCode: string; // Max 5 chars, uppercase
  supplierName: string; // Max 50 chars
  effDate: string; // ISO date string
  termDate: string | null; // ISO date string, optional
}

/**
 * DTO for updating an existing Valid Reagent Supplier Code
 */
export interface UpdateValidReagentSupplierCodeDto {
  supplierCode: string; // Max 5 chars, uppercase (editable per FMB UpdateAllowed="true")
  supplierName: string; // Max 50 chars
  effDate: string; // ISO date string
  termDate: string | null; // ISO date string, optional
}

/**
 * Query parameters for filtering Valid Reagent Supplier Codes
 * Property names must match backend C# DTO (PascalCase)
 */
export interface ValidReagentSupplierCodeQueryDto {
  SearchKeyword?: string | null; // Search across code and name
  ShowTerminated?: string | null; // 'Y' or 'N' (uppercase, case-sensitive)
  EffectiveDatePeriod?: string | null; // 'After' or 'Before'
  EffectiveDate?: string | null; // ISO date string (YYYY-MM-DD)
  TerminationDatePeriod?: string | null; // 'After' or 'Before'
  TerminationDate?: string | null; // ISO date string (YYYY-MM-DD)
  SortColumn?: string | null; // Column name to sort by
  SortOrder?: string | null; // 'ASC' or 'DESC'
}

/**
 * API response wrapper for Valid Reagent Supplier Code list
 */
export interface ValidReagentSupplierCodeApiResponse<T> {
  success: boolean;
  data: T[] | null;
  total: number;
  message: string | null;
  statusCode: number;
}

/**
 * API response wrapper for single operations
 */
export interface ValidReagentSupplierCodeOperationResponse {
  success: boolean;
  message: string | null;
  statusCode: number;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}
