/**
 * Batch In-Progress Query Models
 * Based on API Documentation: /api/v1/batch-in-progress-query
 * JIRA: MLT-13593, MLT-13595
 * Mnemonic: BIPQ
 */

// Standard API Response Wrapper
export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T | null;
  errorCode?: string | null;
  errorResponse?: {
    errorCode: string;
    error: string;
  } | null;
  totalCount?: number;
}

// Request DTO for POST /batch-in-progress-query/search
export interface BatchInProgressQueryDto {
  contractId: string;
  batchId?: string | null; // Can be single "BATCH001" or CSV "BATCH001,BATCH002,BATCH003"
  chapterId?: string; // Can be single "0001" or CSV "0001,0002,0003"
  includeNoTestResults?: string; // "Y" or "N", default "Y"
  queryMode?: string; // "A" (All) or "E" (Exceptions only), default "A"
  take?: number; // default 10, range 1-100
  skip?: number; // default 0
  sortColumn?: string | null;
  sortOrder?: string; // "ASC" or "DESC", default "ASC"

  // NOTE: Backend doesn't support array properties yet (planned enhancement)
  // When backend adds support, uncomment these:
  // batchIds?: string[] | null;
  // chapterIds?: string[] | null;
}

// Response DTO for batch search results
export interface BatchInProgressDto {
  batchId: string;
  chapterId: string;
  receivedDate: string | null;
  collectionDate: string | null;
  age: number | null;
  unitsCount: number;
  resultsQcDate: string | null;
  contractId: string;
  units: UnitInProgressDto[];
}

// Response DTO for unit details
export interface UnitInProgressDto {
  unitId: string;
  checkDigit: string;
  chapterId: string;
  collDate: string;
  batchId: string;
  skipReason: string | null;
  testBaseCount: number;
  holdingTestCount: number;
  testResults: UnitTestResultDto[];
  interdictions: UnitInterdictionDto[];
  unitTestBase: UnitTestBaseDto[];
  holdingTests: HoldingTestDto[];
}

// Unit Test Result (UTRS)
export interface UnitTestResultDto {
  unitId: string;
  chapterId: string;
  testId: string;
  testSeqNo: number;
  resultStatus: string | null;
  resultDesc: string | null;
  interimResult: string | null;
}

// Unit Interdiction
export interface UnitInterdictionDto {
  unitId: string;
  chapterId: string;
  collDate: string;
  interCode: string;
  interDesc: string | null;
}

// Unit Test Base
export interface UnitTestBaseDto {
  unitId: string;
  chapterId: string;
  collDate: string;
  testId: string;
  resultStatus: string | null;
  resultDesc: string | null;
}

// Holding Test
export interface HoldingTestDto {
  unitId: string;
  chapterId: string;
  collDate: string;
  tbId: string;
  testId: string;
  resultStatus: string | null;
  resultDesc: string | null;
}

// Contract dropdown option
export interface ContractDto {
  contractId: string;
  company: string;
}

// Batch lookup option
export interface BatchLookupDto {
  batchId: string;
  receivedDate: string;
  lastQcStatus: string | null;
  lastQcDate: string | null;
}
