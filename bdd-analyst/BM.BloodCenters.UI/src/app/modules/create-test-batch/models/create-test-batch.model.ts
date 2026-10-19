export interface ReturnResult<T> {
  success: boolean;
  message: string;
  data?: T[];
  item?: T;
  statusCode?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface OpenBatch {
  tbId: string;
  insertDate: string;
}

export interface ValidTest {
  testGroup: string;
  testId: string;
  testDesc: string;
}

export interface TestKitLookup {
  testKitId: string;
  qcExpiryDate: string | null;
  testingLabCode: string | null;
  reviewedBy: string | null;
  reagentType: string | null;
  reagentName: string | null;
  reagentExpiryDate: string | null;
}

export interface TestBatchDetail {
  testId: string;
  testKitId: string | null;
  testDesc: string | null;
  testGroup: string | null;
  autoSchedule: string | null;
  antigenFlag: string | null;
  testingLabCode: string | null;
  testType: string | null;
}

export interface TestBatchUnit {
  unitId: string;
  collDate: string | null;
  chapterId: string | null;
  seqNo: number | null;
  checkDigit: string | null;
}

export interface WarningDto {
  code: string;
  message: string;
}

export interface TestBatchResponse {
  status: string;
  tbId: string;
  testChapterId: string;
  startWorkNumber: number | null;
  insertDate: string | null;
  userId: string | null;
  firstUnitId: string | null;
  lastUnitId: string | null;
  tests: TestBatchDetail[];
  units: TestBatchUnit[];
  warnings: WarningDto[];
}

export interface ValidateUnitRequest {
  unitId: string;
  tbId?: string;
  existingUnitIds?: string[];
  overrides: string[];
}

export interface ValidateUnitResponse {
  unitId: string;
  chapterId: string | null;
  collDate: string | null;
  warnings: WarningDto[];
}

export interface ValidateTestRequest {
  testId: string;
  tbId?: string;
  existingTestIds?: string[];
}

export interface ValidateTestResponse {
  testId: string;
  testDesc: string | null;
  testGroup: string | null;
  autoSchedule: string | null;
  antigenFlag: string | null;
}

export interface AddTestDto {
  testId: string;
  testKitId: string | null;
}

export interface AddUnitDto {
  unitId: string;
  collDate: string | null;
  chapterId: string | null;
  seqNo: number;
}

export interface CreateTestBatchRequest {
  tbId: string | null;
  startWorkNumber: number;
  tests: AddTestDto[];
  units: AddUnitDto[];
  overrides: string[];
}

export interface PrintableTest {
  testId: string;
  testDesc: string | null;
  reportName: string | null;
}

export interface SubmitPrintRequest {
  tbId: string;
  testIds: string[];
}

export interface TestRow {
  testId: string;
  testDesc: string;
  testKitId: string | null;
  testGroup: string | null;
  autoSchedule: string | null;
  antigenFlag: string | null;
}

export interface UnitRow {
  seqNo: number;
  unitId: string;
  collDate: string | null;
  chapterId: string | null;
}
