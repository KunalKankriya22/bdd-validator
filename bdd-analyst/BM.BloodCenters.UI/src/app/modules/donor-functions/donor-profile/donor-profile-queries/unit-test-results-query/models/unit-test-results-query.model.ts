/**
 * Unit Test Results Query - Model Interfaces
 *
 * Purpose: Query and review unit test results and donor interdictions associated with a unit
 * API Endpoints: /api/v1/unit-test-results
 * JIRA: MLT-10914
 * Oracle Form: DPQUNTST
 */

/**
 * API Request Parameters for Unit Test Results Query
 */
export interface UnitTestResultQueryDto {
  unitId: string;              // Required: Blood unit identifier (7, 13, or 15 characters)
  collDate?: string;           // Optional: Collection date filter (YYYY-MM-DD format)
}

/**
 * API Response for Unit Test Results Query (matches backend ApiResponse<UnitTestResultResponseDto>)
 */
export interface UnitTestResultsApiResponse {
  success: boolean;
  statusCode: number;
  message?: string;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
  data: UnitTestResultResponseDto[];
  total: number;
}

/**
 * Unit Test Result Response DTO (from API documentation)
 */
export interface UnitTestResultResponseDto {
  unitId: string;                              // Blood unit identifier
  donorId: string | null;                      // Donor identifier
  collDate: string | null;                     // Collection date (ISO format)
  donorName: string | null;                    // Donor full name (Last, First Middle)
  dateOfBirth: string | null;                  // Donor date of birth (ISO format)
  gender: string | null;                       // Donor gender (M/F)
  testResults: TestResultDto[];                // List of test results
  hlaAntigens: HlaAntigensDto | null;          // HLA antigen results
  rbcAntigens: RbcAntigenGroupDto[];           // RBC antigen groups
}

/**
 * Test Result DTO
 */
export interface TestResultDto {
  testId: string;                              // Test identifier (e.g., "ALT", "HIV", "HTLV-I/II")
  resultCode: string | null;                   // Raw result code (e.g., "NEG", "POS")
  formattedResult: string | null;              // Formatted result (special formatting for ALT, CHOL, ABORH)
  absorbance: string | null;                   // Absorbance value (for ALT, CHOL)
  cutOff: string | null;                       // Cut-off value
  bandDetails: BandDetailDto[] | null;         // Test band details (if applicable)
}

/**
 * Band Detail DTO
 */
export interface BandDetailDto {
  bandName: string;                            // Band name
  bandValue: string | null;                    // Band value (SuperBandVal or Tech2BandVal)
  intensity: string | null;                    // Intensity (SuperIntensity or Tech2Intensity)
}

/**
 * HLA Antigens DTO
 */
export interface HlaAntigensDto {
  a1TestId: string | null;                     // HLA A1 test identifier
  a1Result: string | null;                     // HLA A1 result
  a2TestId: string | null;                     // HLA A2 test identifier
  a2Result: string | null;                     // HLA A2 result
  b1TestId: string | null;                     // HLA B1 test identifier
  b1Result: string | null;                     // HLA B1 result
  b2TestId: string | null;                     // HLA B2 test identifier
  b2Result: string | null;                     // HLA B2 result
}

/**
 * RBC Antigen Group DTO
 */
export interface RbcAntigenGroupDto {
  groupId: string;                             // Antigen group ID (A-K)
  tests: AntigenTestDto[];                     // Test results in this group
}

/**
 * Antigen Test DTO
 */
export interface AntigenTestDto {
  testId: string;                              // Test identifier
  result: string | null;                       // Result code
}

/**
 * Collection Date DTO (from API)
 */
export interface CollectionDateDto {
  collDate: string;
}

/**
 * API Response for Collection Dates
 */
export interface CollectionDatesApiResponse {
  success: boolean;
  statusCode: number;
  message?: string;
  data: CollectionDateDto[];
  total: number;
}

/**
 * Validation Error Messages (Oracle Forms error codes from API documentation)
 */
export const UNIT_TEST_RESULTS_VALIDATION_MESSAGES = {
  ERROR_0080: 'Field must be entered',                                    // Unit ID is required
  ERROR_0312: 'Invalid Unit ID format',                                   // Unit ID must be 7, 13, or 15 characters
  ERROR_1230: 'Unit not found',                                           // Unit ID doesn't exist
  ERROR_9188: 'No test results found',                                    // Unit exists but has no test results
  API_ERROR: 'An error occurred while retrieving data. Please try again.',
  UNIT_ID_REQUIRED: 'Unit ID is required',
  INVALID_UNIT_ID_LENGTH: 'Unit ID must be 7, 13, or 15 characters',
  COLL_DATE_REQUIRED: 'Please select a collection date'
};

/**
 * Empty state messages
 */
export const EMPTY_STATE_MESSAGES = {
  SEARCH_TITLE: 'Unit Test Results Query',
  INSTRUCTION: 'Scan or enter a Unit ID to view test results.',
  NO_RESULTS: 'No test results found for this unit.'
};
