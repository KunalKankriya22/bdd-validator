/**
 * TypeScript models for Antigen Result Entry API
 * Base URL: /api/v1/antigen-result-entry
 * Mnemonic: AG
 */

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  totalCount?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Worksheet Info Response DTO
 * Response from GET /validate-worksheet/{tbId}
 */
export interface WorksheetInfoDto {
  tbId: string;
  pendingUnitCount: number;
  isValid: boolean;
}

/**
 * Pending Unit DTO - Response from GET /worksheets/{tbId}/pending-units
 */
export interface PendingUnitDto {
  unitId: string;
  tbId: string;
  collDate: string | null;
  holdingStatus: string | null;
}

/**
 * Unit Test DTO - Response from GET /worksheets/{tbId}/units/{unitId}/tests
 */
export interface UnitTestDto {
  testId: string;
  testSeqNo: number;
  unitId: string;
  resultStatus1: string | null;
  reagentLot1: string | null;
  resultDats: string | null;
}

/**
 * Pending Count DTO - Response from GET /pending-count/{tbId}
 */
export interface PendingCountDto {
  tbId: string;
  pendingCount: number;
}

/**
 * Antigen Result Entry DTO - Single test result for submit-results endpoint
 */
export interface AntigenResultEntryDto {
  unitId: string;
  testId: string;
  resultStatus1: string;
  reagentLot1: string;
}

/**
 * Submit Results Request DTO
 * POST /antigen-result-entry/submit-results
 */
export interface SubmitResultsRequestDto {
  tbId: string;
  results: AntigenResultEntryDto[];
}

/**
 * Submit Results Response DTO
 */
export interface SubmitResultsResponseDto {
  tbId: string;
  unitsProcessed: number;
  resultsSkipped: number;
  reconciled: boolean;
  reconcileDate: string;
  moveWarnings?: string[];
}

/**
 * Close Worksheet Response DTO
 */
export interface CloseWorksheetResponseDto {
  tbId: string;
  unitsMarkedNT: number;
  moveWarnings?: string[];
}

/**
 * Worksheet Option DTO - LOV Response
 */
export interface WorksheetOptionDto {
  tbId: string;
  description?: string;
}

/**
 * Valid Result DTO - LOV Response from GET /valid-results/{testId}
 */
export interface ValidResultDto {
  code: string;
  description: string;
}

/**
 * Test Result Row - UI Model for table display
 */
export interface TestResultRow {
  unitId: string;
  testId: string;
  testSeqNo: number;
  resultStatus1: string | null;
  resultDescription: string;
  reagentLot1: string;
  isModified: boolean;
  hasExistingResult: boolean;
  validResults: ValidResultDto[];
}

/**
 * Unit Display Model - UI Model for unit list display
 */
export interface UnitDisplayModel {
  unitId: string;
  displayText: string;
  collectionDate: string;
  tests: UnitTestDto[];
  isSelected: boolean;
}

/**
 * Error code constants from API documentation
 */
export const AntigenResultEntryErrorCodes = {
  INVALID_WORKSHEET: '1233',
  RESULT_CODE_REQUIRED: '1201',
  REAGENT_LOT_REQUIRED: '1017',
  ALL_TESTS_NEED_REAGENTS: '9313',
  WORKSHEET_ID_REQUIRED: '3106',
} as const;
