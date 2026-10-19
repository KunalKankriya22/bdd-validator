/**
 * TypeScript interfaces and DTOs for Void Test Batch API
 * Generated from API documentation: void-test-batch-api-documentation.md
 */

/**
 * Test Batch DTO for dropdown options
 * Endpoint: GET /void-test-batch/test-batches
 */
export interface TestBatchDto {
  tbId: string;
  testId?: string;
  testingLabCode?: string;
  insertDate?: Date | string;
  unitCount?: number;
}

/**
 * Test in Batch DTO for Test ID dropdown
 * Endpoint: GET /void-test-batch/tests/{tbId}
 */
export interface TestInBatchDto {
  testId: string;
  testDesc?: string;
}

/**
 * Void Reason Code DTO for Void Code dropdown
 * Endpoint: GET /void-test-batch/void-reason-codes
 */
export interface VoidReasonCodeDto {
  code: string;
  codeDesc: string;
}

/**
 * Unit in Batch DTO for table display
 * Endpoint: GET /void-test-batch/units/{tbId}/{testId}
 */
export interface UnitInBatchDto {
  tbSeqNo?: number;
  unitId: string;
  chkDigit?: string;
  collDate?: Date | string;
  testId: string;
  testSeqNo?: number;
  resultStatus1?: string;
  resultDesc?: string;
  tbId: string;
  absorbance?: string;
  isReactive?: string;
}

/**
 * Request DTO for voiding test batch
 * Endpoint: POST /void-test-batch/void
 */
export interface VoidTestBatchRequestDto {
  /**
   * Test batch identifier (max 14 chars)
   */
  tbId: string;

  /**
   * Test ID or 'ALL' to void entire batch (max 10 chars)
   */
  testId: string;

  /**
   * Void reason code from MASTER_CODES (max 4 chars)
   */
  voidReasonCode: string;

  /**
   * true = two-technician workflow, false = single-tech
   */
  isTwoTechMode: boolean;

  /**
   * true = first technician, false = second technician
   * Required when isTwoTechMode = true
   */
  isFirstTech: boolean;
}

/**
 * Response DTO for void test batch operation
 * Endpoint: POST /void-test-batch/void
 */
export interface VoidTestBatchResponseDto {
  success: boolean;
  message: string;
  requiresQcConfirmation: boolean;
  isStagedForSecondTech: boolean;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  errorCode?: string;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

/**
 * Tech mode configuration
 * Endpoint: GET /void-test-batch/tech-mode
 */
export interface TechModeDto {
  techMode: string;
  isTwoTechMode: boolean;
  isFirstTech: boolean;
}

/**
 * Form filter model for component state
 */
export interface VoidTestBatchFilters {
  selectedBatchId: string | null;
  selectedTestId: string | null;
  selectedVoidCode: string | null;
}
