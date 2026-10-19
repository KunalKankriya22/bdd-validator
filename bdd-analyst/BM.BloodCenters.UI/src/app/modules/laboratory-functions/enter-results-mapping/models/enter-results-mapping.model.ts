import moment from 'moment';

/**
 * TypeScript interfaces and DTOs for Enter Results Mapping (RMAP/RGVRESLT)
 * Generated from API documentation: rgvreslt-api-documentation.md
 * Base URL: /api/v1/rgt-results-matrix
 */

/**
 * Response DTO for RGT Results Matrix entity
 * Represents a mapping between local lab test results and CBC test results
 */
export interface RgtResultsMatrixDto {
  /** Local test identifier (max 8 chars) - Part of composite primary key */
  testId: string;

  /** Local result status code (max 10 chars) - Part of composite primary key */
  resultStatus: string;

  /** Regional contract ID (max 15 chars) - Part of composite primary key */
  contractId: string;

  /** CBC test identifier (max 8 chars) */
  cbcTestId: string | null;

  /** CBC result status code (max 10 chars) */
  cbcResultStatus: string | null;

  /** Last modification timestamp (GMT) */
  lastModifiedDate: string;

  /** Last modification timestamp (chapter local time) */
  lastModifiedDateLocal: string;

  /** Effective date */
  effDate?: string | null;

  /** Termination date */
  termDate?: string | null;

  /** Company name for external contracts */
  contractCompany: string | null;

  /** Chapter name for internal contracts */
  contractChapter: string | null;

  /** Test description from VALID_TESTS */
  testDescription: string | null;

  /** Result status description from MASTER_CODES */
  resultStatusDescription: string | null;

  /** Whether contract is internal */
  isInternal: boolean;
}

/**
 * Request DTO for creating a new RGT Results Matrix mapping
 */
export interface CreateRgtResultsMatrixRequestDto {
  /** Local test identifier (required, max 8 chars, must exist in VALID_TESTS) */
  testId: string;

  /** Local result status code (required, max 10 chars, must exist in VALID_TEST_RESULTS) */
  resultStatus: string;

  /** Regional contract ID (required, max 15 chars, must be active RG contract) */
  contractId: string;

  /** CBC test identifier (optional, max 8 chars, auto-populated if not provided) */
  cbcTestId?: string;

  /** CBC result status code (optional, max 10 chars) */
  cbcResultStatus?: string;

  /** Effective date (optional) */
  effDate?: string | null;

  /** Termination date (optional) */
  termDate?: string | null;
}

/**
 * Request DTO for updating an existing RGT Results Matrix mapping
 * Note: Only CBC fields are editable; composite key fields are immutable
 */
export interface UpdateRgtResultsMatrixRequestDto {
  /** CBC test identifier (optional, max 8 chars) */
  cbcTestId?: string;

  /** CBC result status code (optional, max 10 chars) */
  cbcResultStatus?: string;

  /** Effective date (optional) */
  effDate?: string | null;

  /** Termination date (optional) */
  termDate?: string | null;
}

/**
 * Request DTO for filtering/querying RGT Results Matrix records
 */
export interface RgtResultsMatrixQueryDto {
  /** Filter by contract ID (required) */
  contractId: string;

  /** Filter by test ID (optional) */
  testId?: string;

  /** Filter by result status (optional) */
  resultStatus?: string;

  /** Column to sort by (TestId, ResultStatus, ContractId, LastModifiedDate) */
  sortColumn?: string;

  /** Sort order (ASC or DESC) */
  sortOrder?: string;
}

/**
 * Response DTO for contract dropdown options
 */
export interface ContractDropdownDto {
  /** Contract identifier */
  contractId: string;

  /** Display text (contractId - company/chapter) */
  display: string;

  /** Company name (for external contracts) */
  company: string | null;

  /** Chapter name (for internal contracts) */
  chapter: string | null;

  /** Whether contract is internal */
  isInternal: boolean;
}

/**
 * Response DTO for test dropdown options
 */
export interface TestDropdownDto {
  /** Test identifier */
  testId: string;

  /** Test description */
  description: string;

  /** CBC Test ID from RGT_TEST_MATRIX (Gap #5 fix) */
  cbcTestId?: string | null;

  /** Display text (testId - description) */
  display: string;
}

/**
 * Response DTO for result status dropdown options
 */
export interface ResultStatusDropdownDto {
  /** Result status code */
  resultStatus: string;

  /** Result status description */
  description: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;

  /** HTTP status code */
  statusCode: number;

  /** Response message */
  message: string;

  /** Response data payload */
  data: T;

  /** Total count (for paginated responses) */
  totalCount?: number;
}

/**
 * Error response format
 */
export interface ApiErrorResponse {
  /** Whether the request was successful (always false) */
  success: false;

  /** HTTP status code */
  statusCode: number;

  /** Error code (e.g., RGT-001, RGT-002) */
  errorCode: string;

  /** Error response object */
  errorResponse: {
    /** Error code */
    errorCode: string;

    /** Error message */
    error: string;
  };
}

/**
 * Error codes reference for RGT Results Matrix API
 */
export enum RgtResultsMatrixErrorCode {
  /** Contract ID is required */
  CONTRACT_REQUIRED = 'RGT-001',

  /** Result mapping already exists for this test, result status, and contract combination */
  DUPLICATE_MAPPING = 'RGT-002',

  /** Test ID is required */
  TEST_REQUIRED = 'RGT-003',

  /** Result Status is required */
  RESULT_STATUS_REQUIRED = 'RGT-004',

  /** Contract ID must not exceed 15 characters */
  CONTRACT_MAX_LENGTH = 'RGT-005',

  /** Test ID must not exceed 8 characters */
  TEST_MAX_LENGTH = 'RGT-006',

  /** Result Status must not exceed 10 characters */
  RESULT_STATUS_MAX_LENGTH = 'RGT-007',

  /** Test ID does not exist */
  TEST_NOT_FOUND = 'RGT-008',

  /** Result Status does not exist */
  RESULT_STATUS_NOT_FOUND = 'RGT-009',

  /** Contract ID does not exist or is not a Regional contract */
  CONTRACT_NOT_FOUND = 'RGT-010',

  /** Contract is not active */
  CONTRACT_INACTIVE = 'RGT-011',

  /** Contract must have an associated company */
  CONTRACT_NO_COMPANY = 'RGT-012',

  /** CBC Test ID must not exceed 8 characters */
  CBC_TEST_MAX_LENGTH = 'RGT-013',

  /** CBC Result Status must not exceed 10 characters */
  CBC_RESULT_STATUS_MAX_LENGTH = 'RGT-014'
}

/**
 * UI-specific model for inline editing table rows
 * Extends RgtResultsMatrixDto with additional UI state
 */
export interface ResultMappingRow extends Omit<RgtResultsMatrixDto, 'effDate' | 'termDate'> {
  /** Whether this row is being edited */
  isEditing?: boolean;

  /** Whether this row is new (not yet saved) */
  isNew?: boolean;

  /** Whether this row has been modified */
  isDirty?: boolean;

  /** Whether this row is marked for deletion */
  isDeleted?: boolean;

  /** Original values before editing (for cancel/rollback) */
  original?: RgtResultsMatrixDto;

  /** Effective date - stored as Moment for datepicker binding */
  effDate?: moment.Moment | string | null;

  /** Termination date - stored as Moment for datepicker binding */
  termDate?: moment.Moment | string | null;

  /** Whether effective date field has been touched (for error display) */
  effDateTouched?: boolean;

  /** Whether termination date field has been touched (for error display) */
  termDateTouched?: boolean;

  /** Raw input text for effective date (to detect unparseable input) */
  effDateRawInput?: string;

  /** Raw input text for termination date (to detect unparseable input) */
  termDateRawInput?: string;

  /** Whether test ID field has been touched (for error display) */
  testIdTouched?: boolean;

  /** Whether result status field has been touched (for error display) */
  resultStatusTouched?: boolean;

  /** Whether CBC result status field has been touched (for error display) */
  cbcResultStatusTouched?: boolean;
}
