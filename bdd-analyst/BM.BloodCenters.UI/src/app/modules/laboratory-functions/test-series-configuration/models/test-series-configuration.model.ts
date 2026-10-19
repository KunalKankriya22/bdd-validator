/**
 * Test Series/Test Configuration Models
 * Based on API Documentation for LAB.VALID_SERIES_TEST_CONFIG table
 */

/**
 * Base DTO for Test Series Configuration (Response)
 */
export interface TestSeriesConfigDto {
  testSeriesId: string | null;
  levelCode: number | null;
  setNo: number | null;
  testId: string | null;
  resultCode: string | null;      // Comma-separated result codes
  scheduleTest: string | null;    // Comma-separated test IDs (max 500 chars)
  cancelTest: string | null;      // Comma-separated test IDs (max 500 chars)
  anotationCode: string | null;
  finalFlag: string | null;       // 'Y' or 'N'
  effDate: string;                 // ISO DateTime string
  termDate: string | null;         // ISO DateTime string
  insertDate: string;              // ISO DateTime string (readonly)
  insertUser: string;              // Username (readonly)
}

/**
 * Create Request DTO
 */
export interface CreateTestSeriesConfigDto {
  testSeriesId?: string | null;
  levelCode?: number | null;
  setNo?: number | null;
  testId?: string | null;
  resultCode?: string | null;
  scheduleTest?: string | null;
  cancelTest?: string | null;
  anotationCode?: string | null;
  finalFlag?: string | null;
  effDate: string;                 // Required, YYYY-MM-DD format
  termDate?: string | null;        // Optional, YYYY-MM-DD format
}

/**
 * Update Request DTO (same structure as Create)
 */
export type UpdateTestSeriesConfigDto = CreateTestSeriesConfigDto;

/**
 * Query/Filter DTO for List endpoint
 */
export interface TestSeriesConfigQueryDto {
  testSeriesId?: string | null;
  testId?: string | null;
  levelCode?: number | null;
  resultCode?: string | null;
  finalFlag?: string | null;
  effDateFrom?: string | null;     // YYYY-MM-DD format
  effDateTo?: string | null;       // YYYY-MM-DD format
  includeInactive?: boolean;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
}

/**
 * Test Series Dropdown Item
 */
export interface TestSeriesDropdownItem {
  testSeriesId: string;
  description: string;
}

/**
 * Valid Test Item for dropdowns
 */
export interface ValidTestItem {
  testId: string;
  testDesc: string;
  testGroup: string;
}

/**
 * Result Code Option from VALID_TEST_RESULTS (API response)
 */
export interface ResultCodeOption {
  resultCode: string;
  description: string;
}

/**
 * Notation Code Option from VALID_NOTATION_CODES (API response)
 */
export interface NotationCodeOption {
  notationCode: string;
  description: string;
}

/**
 * Composite Key for GET/UPDATE/DELETE operations
 */
export interface TestSeriesConfigCompositeKey {
  testSeriesId?: string | null;
  levelCode?: number | null;
  setNo?: number | null;
  testId?: string | null;
}

/**
 * Maps to API's ReturnResult<T> response shape
 */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T[];
  item?: T;
  total?: number;
  error?: string;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  totalRecords: number;
}

/**
 * Extended DTO for UI grid (includes edit state and display fields)
 */
export interface TestSeriesConfigGridRow extends TestSeriesConfigDto {
  isEditing?: boolean;
  isNew?: boolean;
  originalData?: TestSeriesConfigDto;
  // Display fields for description columns
  testSeriesDescription?: string;
  testIdDescription?: string;
  // Parsed arrays for multi-select chips
  resultCodes?: string[];
  scheduleTests?: string[];
  cancelTests?: string[];
}

/**
 * Filter Form Model
 */
export interface TestSeriesConfigFilters {
  testSeriesId: string | null;
  testId: string | null;
}

/**
 * Error code mappings from API documentation
 */
export const ERROR_CODES = {
  BOTH_IDS_REQUIRED: '1402',          // Either Test Series ID or Test ID must be entered
  INVALID_TEST_SERIES: '1809',        // Invalid Test Series ID entered
  INVALID_TEST_ID: '1227',            // Invalid Test ID entered
  INVALID_LEVEL_CODE: '0425',         // Invalid numeric value for Level Code
  EFFECTIVE_DATE_REQUIRED: '5002',    // Effective date required
  INVALID_DATE_RANGE: '5016',         // Term date must be >= Eff date
  TERM_DATE_IN_PAST: '5020',          // Term date cannot be in past
  DUPLICATE_RECORD: '2050',           // Duplicate record
  NO_TESTS_SELECTED: '5170',          // At least one test must be selected
} as const;
