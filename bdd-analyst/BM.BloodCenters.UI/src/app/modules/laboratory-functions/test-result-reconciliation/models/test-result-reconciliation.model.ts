/**
 * Test Result Reconciliation Models
 * Generated from API documentation: test-result-reconciliation-api-documentation.md
 */

/**
 * Response wrapper for API responses
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total: number;
  errorCode?: string;
}

/**
 * Test Batch DTO
 * Response from GET /test-result-reconciliation/batches
 */
export interface TestBatchDto {
  tbId: string;
  insertDate: string;
  insertDateFormatted: string;
  pendingUnitCount: number;
}

/**
 * Test For Reconciliation DTO
 * Response from GET /test-result-reconciliation/batches/{tbId}/tests
 */
export interface TestForReconciliationDto {
  testId: string;
  testDesc: string;
  pendingUnitCount: number;
  antigenFlag: string | null;
  fullTech2: string | null;
}

/**
 * Reconciliation Unit DTO
 * Response from GET /test-result-reconciliation/units
 */
export interface ReconciliationUnitDto {
  tbSeqNo: number;
  unitId: string;
  checkDigit: string | null;
  collDate: string | null;
  tempResult1: string | null;
  tempResult2: string | null;
  resultCodeDesc1: string | null;
  resultCodeDesc2: string | null;
  tech1UserId: string | null;
  tech1UserName: string | null;
  tech2UserId: string | null;
  tech2UserName: string | null;
  supervisorResult: string | null;
  resultStatDesc: string | null;
}

/**
 * Valid Test Result DTO
 * Response from GET /test-result-reconciliation/valid-results/{testId}
 */
export interface ValidTestResultDto {
  resultStatus: string;
  codeDesc: string;
}

/**
 * Unit Reconciliation DTO (nested in request)
 * Used in ReconcileResultsRequestDto
 */
export interface UnitReconciliationDto {
  tbSeqNo: number;
  unitId: string;
  supervisorResult: string;
}

/**
 * Reconcile Results Request DTO
 * Request body for POST /test-result-reconciliation/reconcile
 */
export interface ReconcileResultsRequestDto {
  tbId: string;
  testId: string;
  antigenFlag: string;
  units: UnitReconciliationDto[];
}

/**
 * Reconciliation Summary DTO
 * Response from POST /test-result-reconciliation/reconcile
 */
export interface ReconciliationSummaryDto {
  totalUnitsReconciled: number;
  resultCounts: { [key: string]: number };
  message: string;
}

/**
 * Table model for displaying units in the main list
 * Flattened structure for data table
 */
export interface ReconciliationTableModel {
  tbId: string;
  testId: string;
  testDesc: string;
  unitId: string;
  tbSeqNo: number;
  checkDigit: string | null;
  tech1Result: string | null;
  tech1ResultDesc: string | null;
  tech2Result: string | null;
  tech2ResultDesc: string | null;
  hasDiscrepancy: boolean;
}

/**
 * Side panel data model
 * Contains all data needed for the override panel
 */
export interface OverridePanelData {
  tbId: string;
  testId: string;
  testDesc: string;
  unit: ReconciliationUnitDto;
  validResults: ValidTestResultDto[];
}
