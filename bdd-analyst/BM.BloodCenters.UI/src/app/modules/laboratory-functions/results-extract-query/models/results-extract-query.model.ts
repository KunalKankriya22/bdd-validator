/**
 * Results Extract Query Models
 * Generated from API Documentation - MLT-14239
 */

/**
 * Contract lookup option for autocomplete
 */
export interface ContractOption {
  contractId: string;
  company: string;
  centerId: string;
}

/**
 * Valid contract with full details
 */
export interface ValidContract {
  contractId: string;
  company: string;
  centerId: string | null;
  chapterId: string;
  contractType: string;
  effectiveDate: string;
  terminationDate: string | null;
  machineCode: string | null;
  barCodeProtocol: string | null;
}

/**
 * Contract information details
 */
export interface ContractInfo {
  contractId: string;
  company: string;
  centerId: string;
  chapterId: string;
}

/**
 * Test result record from API
 * ResultStatus1 is the final result from UTRS, InterimResult is from rgt_interim_results
 */
export interface TestResult {
  testId: string;
  testSeqNo: number;
  resultStatus1: string | null;
  interimResult: string | null;
}

/**
 * Unit record with test results
 */
export interface UnitRecord {
  unitId: string;
  checkDigit: string;
  collectionDate: string;
  qcTestDate: string | null;
  testResults: TestResult[];
}

/**
 * Batch record with units
 * Maps from API BatchResultDto
 */
export interface BatchRecord {
  batchId: string;
  chapterId: string;
  unitCount: number;
  extractDateTimeGmt: string;
  extractDateTime: string;
  resultParmId: string;
  insertUser: string;
  units: UnitRecord[];
}

/**
 * Results extract query response data
 * Maps from API ResultsExtractResponseDto
 */
export interface ResultsExtractData {
  contractInfo: ContractInfo;
  totalBatches: number;
  batches: BatchRecord[];
}

/**
 * Request DTO for querying results
 */
export interface ResultsExtractQueryRequest {
  contractId: string;
  fromDate?: string | null;
  toDate?: string | null;
  batchId?: string | null;
  take?: number;
  skip?: number;
}

/**
 * Request DTO for fetching batch details (units + test results) on demand
 */
export interface BatchDetailRequest {
  contractId: string;
  batchId: string;
  extractDateTime: string;
}

/**
 * Response for batch detail endpoint
 */
export interface BatchDetailResponse {
  batchId: string;
  units: UnitRecord[];
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  item?: T;
  totalCount?: number;
  total?: number;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Display model for batch table with computed properties
 */
export interface BatchDisplay extends BatchRecord {
  extractDateFormatted?: string;
  extractDateTimeFormatted?: string;
}

/**
 * Display model for unit with warning flag
 */
export interface UnitDisplay extends UnitRecord {
  hasWarning?: boolean;
  qcTestDateFormatted?: string;
  unitIdDisplay?: string;
}

/**
 * Display model for test result with color coding
 */
export interface TestResultDisplay extends TestResult {
  testIdColor?: string;
  resultColor?: string;
  interimResultColor?: string;
}
