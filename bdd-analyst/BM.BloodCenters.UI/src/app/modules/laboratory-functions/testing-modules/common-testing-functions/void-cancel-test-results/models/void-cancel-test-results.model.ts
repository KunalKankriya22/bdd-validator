/**
 * TypeScript interfaces and DTOs for Void/SupVoid/Cancel Test Results API
 * Backend route: void-cancel-test-results
 */

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
 * Action Type DTO for Action dropdown
 * Endpoint: GET /void-cancel-test-results/actions
 */
export interface ActionTypeDto {
  code: string;
  description: string;
}

/**
 * Active Test DTO for Test ID dropdown
 * Endpoint: GET /void-cancel-test-results/tests
 */
export interface ActiveTestDto {
  testId: string;
  testDesc: string;
  testGroup?: string;
}

/**
 * Test Group DTO for Select Tests dialog Group ID dropdown
 * Endpoint: GET /void-cancel-test-results/test-groups
 */
export interface TestGroupDto {
  code: string;
  description: string;
}

/**
 * Void Reason Code DTO for Reason dropdown
 * Endpoint: GET /void-cancel-test-results/void-reason-codes
 */
export interface VoidReasonCodeDto {
  code: string;
  codeDesc: string;
}

/**
 * Test Result DTO returned for a unit/test combination
 * Endpoint: GET /void-cancel-test-results/unit/{unitId}/test/{testId}
 */
export interface TestResultForVoidDto {
  unitId: string;
  testId: string;
  testSeqNo: number;
  resultCode: string | null;
  resultDats: string | null;
  voidCancelFlag: string | null;
  voidReason: string | null;
  voidDate: string | null;
  voidUser: string | null;
  collDate: string | null;
  tbId: string | null;
  resultStatus1: string | null;
  testDesc: string | null;
  isScheduled: string | null;
  voidReasonDesc: string | null;
}

/**
 * Request DTO for voiding test result(s)
 * Endpoint: PUT /void-cancel-test-results/void
 */
export interface VoidTestResultRequest {
  unitId: string;
  testId: string;
  testSeqNo: number;
  collDate: string | null;
  voidReason: string;
  isScheduled: string;
}

/**
 * Request DTO for cancelling test result(s)
 * Endpoint: PUT /void-cancel-test-results/cancel
 */
export interface CancelTestResultRequest {
  unitId: string;
  testId: string;
  testSeqNo: number;
  collDate: string | null;
  cancelReason?: string;
  isScheduled: string;
}

/**
 * Scanned unit entry for the left panel
 */
export interface ScannedUnit {
  unitId: string;
  collDate: string | null;
}

/**
 * Test result row with selection state for the right panel
 */
export interface TestResultRow extends TestResultForVoidDto {
  selected: boolean;
  rowKey: string;
}

/**
 * Detailed test result DTO for View Full Details panel
 * Endpoint: GET /void-cancel-test-results/unit/{unitId}/details
 */
export interface TestResultDetailDto {
  testId: string;
  testSeqNo: number;
  resultCode: string | null;
  tbId: string | null;
  tbSeqNo: number | null;
  absorbance: string | null;
  ratio: string | null;
  wellNumber: string | null;
  testChapterId: string | null;
  resultDats: string | null;
  testMode: string | null;
  testDesc: string | null;
  isScheduled: string | null;
}

/**
 * Data passed to the confirmation dialog
 */
export interface VoidCancelConfirmationDialogData {
  action: string;
  actionDescription: string;
  selectedCount: number;
  voidReasonCode: string;
  voidReasonDescription: string;
  voidReasonCodes: VoidReasonCodeDto[];
}

/**
 * Result returned from the confirmation dialog
 */
export interface VoidCancelConfirmationDialogResult {
  confirmed: boolean;
  voidReasonCode: string;
}

/**
 * Data passed to the select tests dialog
 */
export interface SelectTestsDialogData {
  testGroups: TestGroupDto[];
  availableTests: ActiveTestDto[];
  selectedTestIds: string[];
}

/**
 * Result returned from the select tests dialog
 */
export interface SelectTestsDialogResult {
  selectedTests: ActiveTestDto[];
}
