// API Response wrapper
export interface ReturnResult<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data?: T;
  totalRecords?: number;
  warnings?: ErrorWarning[];
  errors?: ErrorWarning[];
}

export interface ErrorWarning {
  code: string;
  message: string;
  unitId?: string;
  field?: string;
}

// Filter Options
export interface FilterOptionsResponse {
  tbWsOptions: TestBatchWorksheet[];
  testIdOptions: TestIdOption[];
  testKitOptions: TestKitOption[];
  resultCodeOptions: ResultCodeOption[];
}

export interface TestBatchWorksheet {
  tbId: string;
  tbWsNumber: string; // Added for template compatibility
  insertDate: string;
  testId: string;
  testKitId?: string; // Test Kit ID associated with this batch/test combination
}

export interface TestIdOption {
  testId: string;
  testDesc: string;
  noOfTech: number;
  antigenFlag: string;
  autoSchedule: string;
}

export interface TestKitOption {
  testKitId: string;
  kitCode: string; // Added for template compatibility
  testId: string;
  qcExpiryDate?: string;
}

export interface ResultCodeOption {
  resultCode: string;
  code: string; // Added for template compatibility
  resultDesc: string;
}

// Test Result Data
export interface TestResultData {
  tbId: string;
  testId: string;
  tbSeqNo: number;
  unitId: string;
  collDate?: string;
  resultCode: string;
  resultDate: string;
  testKitId: string;
  chapterId: string;
  insertUser?: string;
  insertDate?: string;
  remark?: string;
}

// Create/Update Request
export interface CreateTestResultRequest {
  tbId: string;
  testId: string;
  unitId: string;
  resultCode: string;
  testKitId: string;
  remark?: string;
}

export interface UpdateTestResultRequest {
  resultCode: string;
  testKitId: string;
  remark?: string;
}

// Save Results (COMMIT_PROC)
export interface SaveResultsRequest {
  tbId: string;
  testId: string;
  testKitId: string;
  isNewBatch: boolean;
  results: SaveResultItem[];
}

export interface SaveResultItem {
  unitId: string;
  resultCode: string;
  tbSeqNo?: number;
  remark?: string;
}

export interface SavedResultItem {
  sequenceNo: number;
  unitId: string;
  collDate: string;
  tempResult1: string | null;
  status: string;
  rowsAffected: number;
}

export interface SaveResultsResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  tbId: string;
  resultsSummary: string; // Backend returns string like "Results Entered - 2:POS; 1:NEG" (matches Oracle Forms)
  recordsSaved: number;
  savedResults?: SavedResultItem[]; // Detailed save results from backend
  warnings: ErrorWarning[];
  errors: ErrorWarning[];
}

export interface ResultsSummary {
  total: number;
  saved: number;
  autoScheduled: number;
  skipped: number;
}

// Unit Validation
export interface UnitValidationResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data?: UnitValidationData;
  warnings?: ErrorWarning[];
  errorCode?: string;
}

export interface UnitValidationData {
  unitId: string;
  chapterId: string;
  contractId: string;
  collDate: string;
}

// UI Models
export interface TestResultRow {
  tbSeqNo: number;
  sequenceNumber: number; // Added for template compatibility
  unitId: string;
  collectionDate: string;
  resultCode: string;
  resultDescription: string;
  description: string; // Added for template compatibility
  testKitId?: string;
  chapterId?: string;
  remark?: string;
  isEditable?: boolean;
  isValidating?: boolean;
  validationError?: string;
  isValid?: boolean;
}

// Manual Unit Entry (Codabar/ISBT component entry)
export interface ManualUnitEntryData {
  collId: string;
  collYear: string;
  unitSerialNo: string;
}

// Search/Filter Criteria
export interface SearchCriteria {
  take?: number;
  skip?: number;
  tbId?: string;
  testId?: string;
  unitId?: string;
  resultCode?: string;
}

// Dropdown filter params
export interface FilterOptionsParams {
  tbId?: string;
  testId?: string;
  antigenFlag?: string;
}
