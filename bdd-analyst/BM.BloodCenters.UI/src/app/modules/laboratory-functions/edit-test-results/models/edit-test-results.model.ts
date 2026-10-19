/**
 * Edit Test Results - TypeScript Interfaces and DTOs
 * Generated from API Documentation: edit-test-results-api-documentation.md
 * JIRA Ticket: MLT-12750
 */

// ============================================================================
// API Response Models
// ============================================================================

/**
 * Unit Validation Response DTO
 * Endpoint: GET /edit-test-results/validation/unit/{unitId}
 */
export interface UnitValidationDto {
  /** Unit identifier (max 15 chars) */
  unitId: string;
  /** Chapter identifier */
  chapterId: string;
  /** Collection date (ISO 8601 format) */
  collDate?: string;
  /** Number of matching records */
  recordCount: number;
  /** Whether unit exists */
  exists: boolean;
  /** Whether unit is labeled */
  isLabeled: boolean;
  /** Whether unit is extracted */
  isExtracted: boolean;
  /** Whether unit is valid for editing */
  isValid?: boolean;
  /** Error message if any */
  errorMessage?: string;
}

/**
 * Unit Test Result Response DTO
 * Endpoint: GET /edit-test-results/editable-tests/{unitId}
 */
export interface UnitTestResultDto {
  /** Unit identifier */
  unitId: string;
  /** Test identifier */
  testId: string;
  /** Test sequence number */
  testSeqNo?: number;
  /** Primary result status */
  resultStatus1?: string;
  /** Primary result status description */
  resultStatus1Desc?: string;
  /** Secondary result status (must be null for editable) */
  resultStatus2?: string;
  /** Test description */
  testDesc?: string;
  /** Test batch identifier */
  tbId?: string;
  /** Testing chapter ID */
  testChapterId?: string;
  /** Unit chapter ID */
  chapterId?: string;
  /** Collection date (ISO 8601 format) */
  collDate?: string;
  /** Cancellation flag (must be null for editable) */
  cancelFlag?: string;
  /** Edit result flag (Y/N) */
  editResultFlag?: string;
  /** Antigen flag (Y/N) */
  antigenFlag?: string;
  /** Whether unit is extracted (true = READ-ONLY, cannot edit) */
  isExtracted?: boolean;
  /** Whether absorbance is editable */
  isAbsorbanceEditable?: boolean;
  /** Whether test is shifted (true = Scheduled/UTRS table, false = Unscheduled/UNIT_TEST_BASE) */
  isShifted?: boolean;

  // Additional fields from API response (expanded row details)
  /** Result date (ISO 8601 format) */
  resultDats?: string;
  /** Technician/User ID who entered result */
  resultUserId?: string;
  /** Testing lab code */
  testingLabCode?: string;
  /** Test batch sequence number */
  tbSeqNo?: number;
  /** Well position */
  well?: string;
  /** Test mode code (A=Auto, M=Manual) */
  testMode?: string;
  /** Test mode description */
  testModeDesc?: string;
  /** Absorbance value (Abs/Val/Chan) */
  absorbance?: string;
  /** Ratio value */
  ratio?: string;
  /** Void/Edit reason code */
  voidReason?: string;
  /** Void/Edit reason description */
  voidReasonDesc?: string;
  /** Valid result codes for this test */
  validResultCodes?: { resultStatus: string; codeDesc: string }[];
}

/**
 * Editable Test Dropdown DTO
 * Endpoint: GET /edit-test-results/editable-tests-dropdown/{unitId}
 */
export interface EditableTestDropdownDto {
  /** Test identifier */
  testId: string;
  /** Test description */
  testDesc: string;
}

/**
 * Edit Reason Code DTO
 * Endpoint: GET /edit-test-results/edit-reason-codes
 */
export interface EditReasonCodeDto {
  /** Reason code */
  code: string;
  /** Reason description */
  codeDesc: string;
}

/**
 * Valid Test Result DTO
 * Endpoint: GET /edit-test-results/valid-results/{testId}
 */
export interface ValidTestResultDto {
  /** Result status code */
  resultStatus: string;
  /** Result description */
  resultDesc: string;
}

/**
 * Collection Date DTO
 * Endpoint: GET /edit-test-results/collection-dates/{unitId}
 */
export interface CollectionDateDto {
  /** Collection date (ISO 8601 format) */
  collDate: string;
}

/**
 * ALT Result DTO
 * Endpoint: GET /edit-test-results/calculate-alt-result
 */
export interface AltResultDto {
  /** Calculated result status (N/E/SE) */
  resultStatus: string;
}

// ============================================================================
// API Request Models
// ============================================================================

/**
 * Update Test Result Request DTO
 * Endpoint: PUT /edit-test-results/unit/{unitId}/test/{testId}?chapterId=XXX
 */
export interface UpdateTestResultDto {
  /** New result status (Required, e.g., "NR", "POS", "NEG") */
  resultStatus1: string;
  /** Edit/Void reason code (Required, e.g., "CORR", "CLRE") */
  voidReason: string;
  /** Test sequence number (Optional, from editable-tests response) */
  testSeqNo?: number;
  /** Collection date (Optional, from editable-tests response) */
  collDate?: string;
  /** Absorbance value (Abs/Val/Chan - Optional) */
  absorbance?: number | null;
  /** Ratio value (Optional) */
  ratio?: number | null;
}

// ============================================================================
// Standard API Response Wrapper
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T[];
  total?: number;
  errorCode?: string;
  error?: string;
}

/**
 * Combined Validation Response
 * Returns both validation and tests in a single response
 */
export interface ValidationWithTestsResponse {
  success: boolean;
  message: string;
  errorCode?: string;
  statusCode: number;
  validation: UnitValidationDto[];
  tests: UnitTestResultDto[];
  /** Pre-filtered shifted tests (UTRS table, processed) */
  shiftedTests: UnitTestResultDto[];
  /** Pre-filtered unshifted tests (UNIT_TEST_BASE, pending) */
  unshiftedTests: UnitTestResultDto[];
  shiftedCount: number;
  unshiftedCount: number;
  /** Edit reason codes included in response */
  editReasonCodes?: EditReasonCodeDto[];
  total: number;
}

// ============================================================================
// Component State Models
// ============================================================================

/**
 * Form value for editing test results
 */
export interface EditTestResultFormValue {
  /** Result status dropdown value */
  resultStatus1: string;
  /** Void/Edit reason code (Required) */
  voidReason: string;
  /** Test sequence number */
  testSeqNo?: number;
  /** Collection date */
  collDate?: string;
  /** Absorbance value (Abs/Val/Chan) */
  absorbance?: number | null;
  /** Ratio value */
  ratio?: number | null;
}

/**
 * Tab index enum for scheduled/unscheduled tests
 */
export enum TestTabIndex {
  Scheduled = 0,
  Unscheduled = 1
}

/**
 * Filter criteria for tests table
 */
export interface TestFilterCriteria {
  /** Filter by test ID */
  testId?: string;
  /** Filter by test batch ID */
  tbId?: string;
  /** Filter by result status */
  resultStatus?: string;
}

// ============================================================================
// Error Code Reference (from API documentation)
// ============================================================================

export enum EditTestResultsErrorCode {
  /** Unit not found in chapter */
  UNIT_NOT_FOUND = '0179',
  /** Multiple units with same ID */
  DUPLICATE_UNITS = '0172',
  /** Invalid unit ID format */
  INVALID_UNIT_FORMAT = '1210',
  /** Unit is labeled */
  UNIT_LABELED = '9321',
  /** Unit is extracted */
  UNIT_EXTRACTED = '2188',
  /** Invalid test ID */
  INVALID_TEST = '1227',
}

/**
 * Error message mapping
 */
export const ERROR_MESSAGES: Record<string, string> = {
  '0179': 'Unit not found in chapter',
  '0172': 'Multiple units with same ID',
  '1210': 'Invalid unit ID format',
  '9321': 'Unit is labeled',
  '2188': 'Unit is extracted',
  '1227': 'Invalid test ID',
};
