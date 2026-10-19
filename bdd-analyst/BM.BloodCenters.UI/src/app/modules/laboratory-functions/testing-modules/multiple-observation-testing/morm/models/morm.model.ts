import { Moment } from 'moment';

/**
 * Test Band DTO from backend
 */
export interface TestBandDto {
  bandSeq: number;
  bandName: string;
}

/**
 * Matrix Result DTO from backend
 */
export interface MatrixResultDto {
  testInterpretation: string | null;
  setNo: number | null;
  effDate: string | null;       // ISO DateTime
  termDate: string | null;      // ISO DateTime
  results: Record<string, string | null>; // Dynamic keys like "Band 1", "Band 2", etc.
}

/**
 * Save Matrix Result DTO for save request
 * NOTE: Pass null for blank/Not Tested bands. The backend skips inserting
 * (or deletes existing) rows for null band values, matching Oracle Forms behavior.
 */
export interface SaveMatrixResultDto {
  testInterpretation: string | null;
  setNo: number | null;
  effDate: string | null;       // ISO DateTime
  termDate: string | null;      // ISO DateTime
  results: Record<string, string | null>; // Dynamic keys like "Band 1", "Band 2", etc. (null should be converted to '' before API call)
}

/**
 * Response model for GET /multiple-observation-result-matrix
 */
export interface MultipleObservationResultMatrixDto {
  testId: string;
  testType: string;
  testDescription: string | null;
  testTypeDescription: string | null;
  bandCount: number;
  testBands: TestBandDto[];
  matrixResults: MatrixResultDto[];
}

/**
 * Request model for POST /multiple-observation-result-matrix (Save)
 */
export interface SaveMultipleObservationResultMatrixRequestDto {
  testId: string;
  testType: string;
  matrixResults: SaveMatrixResultDto[];
}


/**
 * Standard API response wrapper
 */
export interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;       // Total record count for paginated responses
  totalCount?: number;  // Alternate field name for total count
}

/**
 * Validation error response (with error code)
 */
export interface ValidationErrorResponse {
  success: false;
  statusCode: 400;
  errorCode: string;
  message: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Delete success response
 */
export interface DeleteSuccessResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: boolean[];
}


/**
 * Lookup models for dropdowns
 */
export interface LookUp {
  key: string;
  value: string;
}

/**
 * Form value model for Add/Edit dialog
 */
export interface MormFormValue {
  testId: string | null;
  testType: string | null;
  testIntp: string | null;
  effDate: Moment | null;
  termDate: Moment | null;
  res01: string | null;
  res02: string | null;
  res03: string | null;
  res04: string | null;
  res05: string | null;
  res06: string | null;
  res07: string | null;
  res08: string | null;
  res09: string | null;
  res10: string | null;
  res11: string | null;
  res12: string | null;
  res13: string | null;
  res14: string | null;
  res15: string | null;
  res16: string | null;
}

/**
 * UI Table model for data table display
 */
export interface MormTableModel {
  testId: string;
  testType: string;
  testIntp: string;
  setNumber: number;
  effDate: string;
  termDate: string;
  res01: string;
  res02: string;
  res03: string;
  res04: string;
  res05: string;
  res06: string;
  res07: string;
  res08: string;
  res09: string;
  res10: string;
  res11: string;
  res12: string;
  res13: string;
  res14: string;
  res15: string;
  res16: string;
  insertDate: string;
  insertUser: string;
  programId: string;
}

/**
 * Result value options for band dropdowns
 *
 * Note: Empty string ('') represents "Not Tested" and is normalized to null before API submission.
 * This matches Oracle Forms behavior where blank fields are treated as null in VALID_TEST_BAND_MATRIX_DETAIL.
 * The normalization happens in onSave() where empty strings are converted to null for backend processing.
 */
export const RESULT_VALUES: LookUp[] = [
  { key: '', value: 'Not Tested' },
  { key: '?', value: '?' },
  { key: 'P', value: 'P' },
  { key: 'N', value: 'N' },
  { key: 'I', value: 'I' }
];

/**
 * LOV DTOs from backend
 */
export interface TestLovDto {
  testId: string;
  testDescription: string | null;
}

export interface TestTypeLovDto {
  testType: string;
  testTypeDescription: string | null;
}

export interface ResultInterpretationLovDto {
  resultCode: string;
  description: string | null;
}

export interface ResultValueLovDto {
  result: string;
  description: string;
}

/**
 * Dropdown DTOs for filter selections (UI models)
 */
export interface TestDropdownDto {
  testId: string;
  description: string;
  display: string; // formatted as "testId - description"
}

export interface TestTypeDropdownDto {
  testType: string;
  description: string;
  display: string;
}

export interface TestInterpretationDropdownDto {
  testIntp: string;
  description: string;
  display: string;
}

/**
 * Editable row model for MORM table
 */
export interface MormRow {
  // Composite key fields
  testId: string;
  testType: string;
  testIntp: string;
  setNumber?: number;

  // Band values (dynamic based on testBands returned from API)
  // Keys are like "Band 1", "Band 2", etc.
  results: Record<string, string | null>;

  // Result interpretation fields
  effDate: Moment | null;
  termDate: Moment | null;

  // UI state
  isNew: boolean;
  isDirty: boolean;
  isDeleted: boolean;
  errors: Record<string, string>;
  originalData?: MatrixResultDto;

  bandsTouched?: Record<string, boolean>;
  testIntpTouched?: boolean;
  effDateTouched?: boolean;
  termDateTouched?: boolean;
  effDateRawInput?: string;
  termDateRawInput?: string;
}

/**
 * Filter form value
 */
export interface MormFilterFormValue {
  testId: string | null;
  testType: string | null;
}

/**
 * Filter value model (for filter panel - currently unused)
 */
export interface MormFilterValue {
  testId?: string | null;
  testType?: string | null;
  testIntp?: string | null;
  includeInactive?: boolean;
}

/**
 * API Error Code constants for MORM
 */
export const MORM_ERROR_CODES = {
  DUPLICATE_RECORD: '1033',
  INVALID_TEST_INTERPRETATION: '1201',
  INVALID_TEST_TYPE_OR_RESULT: '1809',
  TERMINATION_DATE_PAST: '3115',
  TEST_NOT_FOUND: '5010',
  EFFECTIVE_DATE_PAST: '8044',
  TERMINATION_BEFORE_EFFECTIVE: '8045',
  TERM_DATE_BEFORE_EFF_DATE: '8052'
} as const;

/**
 * Error message mapping for user-friendly display
 */
export const MORM_ERROR_MESSAGES: Record<string, string> = {
  [MORM_ERROR_CODES.DUPLICATE_RECORD]: 'A record with this Test ID, Test Type, and Test Interpretation already exists.',
  [MORM_ERROR_CODES.INVALID_TEST_INTERPRETATION]: 'Invalid test interpretation. Please verify the test interpretation exists in valid test results.',
  [MORM_ERROR_CODES.INVALID_TEST_TYPE_OR_RESULT]: 'Invalid test type or result value. Please verify the test type exists and result values are ?, P, N, I, or blank.',
  [MORM_ERROR_CODES.TERMINATION_DATE_PAST]: 'Termination date cannot be in the past.',
  [MORM_ERROR_CODES.TEST_NOT_FOUND]: 'Test not found or has no active bands. Please verify the test ID exists.',
  [MORM_ERROR_CODES.EFFECTIVE_DATE_PAST]: 'Effective date cannot be in the past.',
  [MORM_ERROR_CODES.TERMINATION_BEFORE_EFFECTIVE]: 'Termination date must be on or after effective date.',
  [MORM_ERROR_CODES.TERM_DATE_BEFORE_EFF_DATE]: 'Termination date must be on or after effective date.'
};
