/**
 * Models for Multiple Observation Test Types by MFG
 * API Base: /api/test-types
 * JIRA: MLT-13349
 * Mnemonic: MOTTMFG
 */

/**
 * Response DTO for test type records
 * Matches API documentation exactly
 */
export interface MultipleObservationTestTypeDto {
  /** Test identifier (max 6 chars) */
  testId: string;

  /** Test type identifier (max 8 chars) */
  testType: string;

  /** Test type description (max 30 chars) */
  testTypeDesc: string;

  /** Default control value (max 30 chars), nullable */
  defaultControlValue: string | null;

  /** Result update flag (Y/N), nullable */
  resUpdate: string | null;

  /** Other bound flag (Y/N), nullable */
  othBnd: string | null;

  /** Full tech two flag (Y/N), nullable */
  fullTechTwo: string | null;

  /** Effective date (required) */
  effDate: string;

  /** Termination date (nullable) */
  termDate: string | null;

  /** Last modified timestamp */
  lastModifiedDate: string;
}

/**
 * Create DTO for new test type records
 */
export interface CreateMultipleObservationTestTypeDto {
  /** Test identifier (max 6 chars) - must exist in TESTS table */
  testId: string;

  /** Test type identifier (max 8 chars) */
  testType: string;

  /** Test type description (max 30 chars) - required */
  testTypeDesc: string;

  /** Default control value (max 3 chars) - optional */
  defaultControlValue?: string | null;

  /** Result update flag (Y/N) - optional */
  resUpdate?: string | null;

  /** Other bound flag (Y/N) - optional */
  othBnd?: string | null;

  /** Full tech two flag (Y/N) - optional */
  fullTechTwo?: string | null;

  /** Effective date (required, YYYY-MM-DD format) */
  effDate: string;

  /** Termination date (optional, YYYY-MM-DD format) */
  termDate?: string | null;
}

/**
 * Update DTO for existing test type records
 */
export interface UpdateMultipleObservationTestTypeDto {
  /** Test type description (max 30 chars) - required */
  testTypeDesc: string;

  /** Default control value (max 3 chars) - optional */
  defaultControlValue?: string | null;

  /** Result update flag (Y/N) - optional */
  resUpdate?: string | null;

  /** Other bound flag (Y/N) - optional */
  othBnd?: string | null;

  /** Full tech two flag (Y/N) - optional */
  fullTechTwo?: string | null;

  /** Effective date (required, YYYY-MM-DD format) */
  effDate: string;

  /** Termination date (optional, YYYY-MM-DD format) */
  termDate?: string | null;
}

/**
 * Lookup DTO for tests dropdown
 */
export interface TestLookupDto {
  /** Test identifier (max 6 chars) */
  testId: string;

  /** Test description (max 30 chars) */
  testDesc: string;
}

/**
 * Lookup DTO for default control values
 */
export interface DefaultControlValueLookupDto {
  /** Result code (max 3 chars) */
  result: string;

  /** Result description (max 60 chars) */
  resultDesc: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  total?: number;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
  message?: string;
}

/**
 * Query parameters for GET all test types
 */
export interface GetTestTypesParams {
  /** Include terminated records (default: false) */
  includeInactive?: boolean;

  /** Number of records to return (default: 10) */
  take?: number;

  /** Number of records to skip (default: 0) */
  skip?: number;
}

/**
 * UI-specific model for grid rows (extends DTO with editing state)
 */
export interface TestTypeGridRow extends MultipleObservationTestTypeDto {
  /** Flag indicating if this is a new unsaved row */
  isNew?: boolean;

  /** Flag indicating if this row has unsaved changes */
  isDirty?: boolean;

  /** Original values before editing (for cancel/revert) */
  original?: MultipleObservationTestTypeDto;
}

/**
 * Y/N dropdown options
 */
export const YES_NO_OPTIONS = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' }
] as const;

/**
 * API Error Code Constants (from documentation)
 */
export const TestTypeErrorCodes = {
  /** Test Type Description must be entered */
  MISSING_DESCRIPTION: '0080',

  /** Test type already exists for this test */
  DUPLICATE_TEST_TYPE: '0319',

  /** Value must be Y or N */
  INVALID_YN_VALUE: '1017',

  /** Invalid TEST_ID */
  INVALID_TEST_ID: '1227',

  /** Invalid Default Control Value for this test */
  INVALID_CONTROL_VALUE: '1809',

  /** Termination date has passed */
  TERMINATION_DATE_IN_PAST: '3115',

  /** Effective Date must be entered */
  MISSING_EFFECTIVE_DATE: '5002',

  /** Effective date cannot be in the past */
  EFFECTIVE_DATE_IN_PAST: '5003',

  /** Termination Date must be >= Effective Date */
  INVALID_TERMINATION_DATE: '5004'
} as const;
