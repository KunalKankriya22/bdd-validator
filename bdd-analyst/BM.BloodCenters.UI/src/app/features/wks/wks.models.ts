/**
 * TypeScript models for Test Batch/Worksheet API
 * Base URL: /api/v1/test-batch
 * Mnemonic: WKS
 * JIRA: MLT-13356
 * API Docs: MLT-13358
 */

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T | T[];
  item?: T;
  total?: number;
  totalCount?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Test Batch DTO - Response from GET /api/v1/test-batch/{tbId}
 */
export interface TestBatchDto {
  tbId: string;
  testChapterId: string;
  startWorkNumber: number | null;
  testingLabCode: string | null;
  insertDate?: string | null;
  insertUser?: string | null;
  tests: TestBatchDetailDto[];
  units: TestBatchUnitDto[];
}

/**
 * Test Batch Detail DTO - Test assigned to batch
 */
export interface TestBatchDetailDto {
  testId: string;
  testKitId?: string | null;
  testDesc?: string | null;
  testGroup?: string | null;
}

/**
 * Test Batch Unit DTO - Blood unit assigned to batch
 */
export interface TestBatchUnitDto {
  seqNo: number;
  unitId: string;
  collDate?: string | null;
  chapterId?: string | null;
  checkDigit?: string | null;
}

/**
 * Create Test Batch Request DTO
 * POST /api/v1/test-batch
 */
export interface CreateTestBatchRequestDto {
  tbId?: string | null;
  startWorkNumber: number;
  testingLabCode: string;
  tests?: AddTestRequestDto[];
  units?: AddUnitRequestDto[];
}

/**
 * Update Test Batch Request DTO
 * PUT /api/v1/test-batch/{tbId}
 */
export interface UpdateTestBatchRequestDto {
  startWorkNumber?: number;
}

/**
 * Add Test Request DTO
 * POST /api/v1/test-batch/{tbId}/tests
 */
export interface AddTestRequestDto {
  testId: string;
  testKitId?: string | null;
}

/**
 * Add Unit Request DTO
 * POST /api/v1/test-batch/{tbId}/units
 */
export interface AddUnitRequestDto {
  unitId: string;
}

/**
 * Test Kit DTO - For lookup dialog
 */
export interface TestKitDto {
  kitId: string;
  reviewedBy?: string | null;
  labCode?: string | null;
  reagentType?: string | null;
  name?: string | null;
  expiryDate?: string | null;
}

/**
 * Test Option DTO - LOV for test dropdown
 */
export interface TestOptionDto {
  testId: string;
  description?: string | null;
}

/**
 * Test Batch Option DTO - LOV for batch dropdown
 */
export interface TestBatchOptionDto {
  tbId: string;
  description?: string | null;
}

/**
 * Lab Code Option DTO - LOV for testing lab code
 */
export interface LabCodeOptionDto {
  labCode: string;
  description?: string | null;
}

/**
 * Test Row - UI Model for Select Tests table
 */
export interface TestRow {
  id: string; // Unique identifier for Angular tracking
  testId: string;
  testDesc: string;
  testKitId: string | null;
  isNew: boolean;
  availableTests?: TestOptionDto[];
  availableKits?: TestKitDto[];
}

/**
 * Unit Row - UI Model for Units table
 */
export interface UnitRow {
  id: string; // Unique identifier for Angular tracking
  seqNo: number;
  unitId: string;
  collDate: string | null;
  isNew: boolean;
}

/**
 * Error code constants from API documentation (MLT-13358)
 */
export const TestBatchErrorCodes = {
  FIELD_REQUIRED: '0080',
  BATCH_RECONCILED: '0166',
  TEST_KIT_EXPIRED: '0224',
  START_SEQUENCE_INVALID: '0270',
  BATCH_HAS_RESULTS: '1067',
  NO_MANUAL_TESTS: '1130',
  BATCH_NOT_FOUND: '1223',
  INVALID_TEST_ID: '1227',
  INVALID_TEST_KIT: '3110',
  NO_TESTS_OR_UNITS: '4010',
  DUPLICATE_TEST: '5163',
  DUPLICATE_UNIT: '9307',
  MAX_SEQUENCE_REACHED: '9318',
  UNIT_NO_COLLECTION_DATE: '9320',
} as const;

/**
 * Print Tests Dialog Data
 */
export interface PrintTestsDialogData {
  tests: TestBatchDetailDto[];
  tbId: string;
}

/**
 * Test Kit Lookup Dialog Data
 */
export interface TestKitLookupDialogData {
  testId: string;
  availableKits: TestKitDto[];
}

/**
 * Print Tests Dialog Result
 */
export interface PrintTestsDialogResult {
  selectedTestIds: string[];
  action: 'print' | 'cancel';
}

/**
 * Test Kit Lookup Dialog Result
 */
export interface TestKitLookupDialogResult {
  selectedKit: TestKitDto;
  action: 'continue' | 'cancel';
}
