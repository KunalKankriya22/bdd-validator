/**
 * TypeScript interfaces and DTOs for Enter Interim Result Code feature
 * Generated from API Documentation: enter-interim-result-code-api-documentation.md
 * Base URL: /api/enter-interim-result-code
 * Program ID: RGIQCINT
 */

// ===========================
// LOV (List of Values) DTOs
// ===========================

/**
 * Contract lookup DTO for Contract ID dropdown
 * Endpoint: GET /enter-interim-result-code/contracts
 */
export interface ContractLookupDto {
  /** Contract identifier (max 9 chars) */
  contractId: string;
  /** Company name - displayed in Description field */
  company: string;
  /** Center identifier */
  centerId: string;
}

/**
 * Test lookup DTO for Test ID dropdown
 * Endpoint: GET /enter-interim-result-code/tests/{contractId}
 */
export interface TestLookupDto {
  /** Test identifier (max 10 chars) */
  testId: string;
  /** Test description */
  testDescription: string;
}

/**
 * Batch lookup DTO for Batch ID dropdown
 * Endpoint: GET /enter-interim-result-code/batches/{contractId}
 */
export interface BatchLookupDto {
  /** Batch identifier (max 14 chars) */
  batchId: string;
  /** Date batch received (ISO 8601 DateTime) */
  receivedDate: string;
  /** QC date (ISO 8601 DateTime) */
  qcDate: string;
}

/**
 * Interim code lookup DTO for Interim Result dropdown
 * Endpoint: GET /enter-interim-result-code/interim-codes
 * Source: MASTER_CODES table (CODE_TYPE='QCIRM')
 */
export interface InterimCodeLookupDto {
  /** Interim result code (max 4 chars) */
  code: string;
  /** Code description */
  codeDescription: string;
}

// ===========================
// Query Units (POST /query-units)
// ===========================

/**
 * Request DTO for querying units in a batch needing interim results
 * Endpoint: POST /enter-interim-result-code/query-units
 */
export interface QueryUnitsRequestDto {
  /** Contract identifier (required, max 9 chars) */
  contractId: string;
  /** Batch identifier (required, max 14 chars) */
  batchId: string;
  /** Test identifier (optional filter, max 10 chars) */
  testId?: string | null;
  /** Chapter identifier (auto-populated from user context via authInterceptor headers) */
  chapterId: string;
}

/**
 * Response DTO for units needing interim results
 * Endpoint: POST /enter-interim-result-code/query-units
 * Note: resultCode and resultDescription are empty before save
 */
export interface UnitInterimResultDto {
  /** Blood unit identifier */
  unitId: string;
  /** Calculated check digit from Oracle function CHK_DIGIT_QUERY (nullable) */
  checkDigit: string | null;
  /** Test identifier */
  testId: string;
  /** Test sequence number */
  testSeqNo: number;
  /** Test description */
  testDescription: string;
  /** Collection date (ISO 8601 DateTime) */
  collDate: string;
  /** Chapter identifier */
  chapterId: string;
  /** Interim result code (empty string before save, populated after user selection) */
  resultCode: string;
  /** Result code description (empty string before save) */
  resultDescription: string;
}

// ===========================
// Save Interim Results (POST /save-results)
// ===========================

/**
 * Request DTO for bulk saving interim results
 * Endpoint: POST /enter-interim-result-code/save-results
 */
export interface SaveInterimResultsRequestDto {
  /** Contract identifier (required, max 9 chars) */
  contractId: string;
  /** Batch identifier (required, max 14 chars) */
  batchId: string;
  /** Chapter identifier (auto-populated from user context via authInterceptor headers) */
  chapterId: string;
  /** Array of interim results to save (at least 1 item required) */
  results: InterimResultItemDto[];
}

/**
 * Individual interim result item for save request
 * Nested in SaveInterimResultsRequestDto.results array
 */
export interface InterimResultItemDto {
  /** Unit identifier (required) */
  unitId: string;
  /** Test identifier (required, max 10 chars) */
  testId: string;
  /** Test sequence number (required) */
  testSeqNo: number;
  /** Collection date (required, ISO 8601 DateTime) */
  collDate: string;
  /** Interim result code selected by user (required, max 4 chars, must exist in MASTER_CODES) */
  resultCode: string;
}

/**
 * Response DTO for successful save operation
 * Endpoint: POST /enter-interim-result-code/save-results
 */
export interface SaveInterimResultsResponseDto {
  /** Number of interim results successfully inserted */
  insertedCount: number;
}

// ===========================
// Standard API Response Wrappers
// ===========================

/**
 * Standard API success response wrapper
 */
export interface ApiResponse<T> {
  /** Indicates if request was successful */
  success: boolean;
  /** HTTP status code */
  statusCode: number;
  /** Response message */
  message: string;
  /** Response data payload */
  data: T;
  /** Total count of items (for LOV endpoints) */
  totalCount?: number;
}

/**
 * Standard API error response wrapper
 */
export interface ApiErrorResponse {
  /** Indicates if request was successful (false for errors) */
  success: false;
  /** HTTP status code */
  statusCode: number;
  /** Error code from ErrorStore (nullable for validation errors) */
  errorCode: string | null;
  /** Error response object */
  errorResponse: {
    /** Error code from ErrorStore (nullable) */
    errorCode: string | null;
    /** Error message */
    error: string;
  };
}

// ===========================
// Frontend-Specific Models
// ===========================

/**
 * Extended unit model for data grid with additional UI state
 * Extends UnitInterimResultDto with frontend-specific properties
 */
export interface UnitGridRowModel extends UnitInterimResultDto {
  /** Track if user has modified this row's interim result (for unsaved changes detection) */
  isDirty?: boolean;
  /** Original result code before user modifications (for cancel/reset) */
  originalResultCode?: string;
}

/**
 * Form filter values for query units
 */
export interface InterimResultFilters {
  /** Selected contract ID (required) */
  contractId: string | null;
  /** Contract description (readonly, auto-populated from selected contract) */
  contractDescription: string;
  /** Selected test ID (optional filter) */
  testId: string | null;
  /** Selected interim code (optional filter, used for COPY INTERIM) */
  interim: string | null;
  /** Selected batch ID (required for RETRIEVE) */
  batchId: string | null;
}
