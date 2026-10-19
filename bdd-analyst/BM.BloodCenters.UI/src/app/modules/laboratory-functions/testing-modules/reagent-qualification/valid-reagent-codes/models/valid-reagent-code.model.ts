/**
 * Valid Reagent Code model
 * Maps to backend API: /valid-reagent-codes
 * Backend table: VALID_REAGENTS
 * Oracle Form: VRIRGCOD (Valid Reagent Codes)
 */

/**
 * Valid Reagent Code entity
 */
export interface ValidReagentCode {
  reagentType: string; // R=Reagent, C=Control, S=Substrate (max 1 char)
  controlFlag: string | null; // P=Positive, N=Negative (max 1 char, required when reagentType='C')
  reagentCode: string; // Primary key with testId (max 5 chars)
  reagentName: string; // Max 50 chars
  masterLotRequired: string; // Y=Yes, N=No (max 1 char) - displayed as "Kit" in UI
  effDate: string; // ISO date string from API
  termDate: string | null; // ISO date string from API
  preparationFlag: string; // P/Y/I/N (max 1 char) - displayed as "Prep" in UI
  prequalificationFlag: string; // Y=Yes, N=No (max 1 char) - displayed as "Qual" in UI
  lastModifyDate: string | null; // ISO date string from API
  lastModifyUser: string | null; // Max 6 chars
  testId: string; // Foreign key to VALID_TESTS (max 10 chars)
  testDesc?: string | null; // Test description from VALID_TESTS
}

/**
 * DTO for creating a new Valid Reagent Code
 */
export interface CreateValidReagentCodeDto {
  reagentType: string; // R/C/S (max 1 char, required)
  controlFlag: string | null; // P/N (max 1 char, conditional)
  reagentCode: string; // Max 5 chars, uppercase, required
  reagentName: string; // Max 50 chars, required
  masterLotRequired: string; // Y/N (max 1 char, required)
  effDate: string; // ISO date string, required
  termDate: string | null; // ISO date string, optional
  preparationFlag: string; // P/Y/I/N (max 1 char, required)
  prequalificationFlag: string; // Y/N (max 1 char, required)
  testId: string; // Max 10 chars, required
}

/**
 * DTO for updating an existing Valid Reagent Code
 */
export interface UpdateValidReagentCodeDto {
  reagentType: string; // R/C/S (max 1 char, required)
  controlFlag: string | null; // P/N (max 1 char, conditional)
  reagentName: string; // Max 50 chars, required
  masterLotRequired: string; // Y/N (max 1 char, required)
  effDate: string; // ISO date string, required
  termDate: string | null; // ISO date string, optional
  preparationFlag: string; // P/Y/I/N (max 1 char, required)
  prequalificationFlag: string; // Y/N (max 1 char, required)
}

/**
 * Query parameters for filtering Valid Reagent Codes
 * Property names must match backend C# DTO
 */
export interface ValidReagentCodeQueryDto {
  TestId?: string | null; // Required filter - Test ID to query
  ShowTerm?: string | null; // 'Y' or 'N' (default: 'N')
  ReagentType?: string | null; // R/C/S filter
  ControlFlag?: string | null; // P/N filter
  EffectiveDatePeriod?: string | null; // 'After' or 'Before'
  EffectiveDateAfter?: string | null; // Date value for After/Before filter (ISO format)
  TerminationDatePeriod?: string | null; // 'Before' or 'After'
  TerminationDateAfter?: string | null; // Date value for Before/After filter (ISO format)
  SearchKeyword?: string | null; // Search across code and name
  SortColumn?: string | null; // Column name to sort by
  SortOrder?: string | null; // 'ASC' or 'DESC'
  Take?: number; // Number of records to return
  Skip?: number; // Number of records to skip
}

/**
 * API response wrapper for Valid Reagent Code list
 */
export interface ValidReagentCodeApiResponse<T> {
  success: boolean;
  data: T[] | null;
  total: number;
  message: string | null;
  statusCode: number;
}

/**
 * API response wrapper for single operations (create/update/delete)
 */
export interface ValidReagentCodeOperationResponse {
  success: boolean;
  message: string | null;
  statusCode: number;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

/**
 * Valid Test LOV item for Test ID dropdown
 */
export interface ValidTestLov {
  testId: string;
  testDesc: string;
}

/**
 * Reagent Type LOV item
 */
export interface ReagentTypeLov {
  code: string;
  description: string;
}

/**
 * Control Flag LOV item
 */
export interface ControlFlagLov {
  code: string;
  description: string;
}

/**
 * Preparation Flag LOV item
 */
export interface PreparationFlagLov {
  code: string;
  description: string;
}

/**
 * Filter values for Valid Reagent Code filter panel
 */
export interface ValidReagentCodeFilterValue {
  testId?: string | null;
  testDesc?: string | null;
  showTerminated?: string | null; // 'Y' or 'N'
  reagentType?: string | null; // 'R', 'C', 'S', or null for all
  controlFlag?: string | null; // 'P', 'N', or null for all
  effectiveDatePeriod?: string | null; // 'After', 'Before', 'Between'
  effectiveDateAfter?: string | null; // ISO date string
  effectiveDateBefore?: string | null; // ISO date string
  terminationDatePeriod?: string | null; // 'After', 'Before', 'Between'
  terminationDateAfter?: string | null; // ISO date string
  terminationDateBefore?: string | null; // ISO date string
}
