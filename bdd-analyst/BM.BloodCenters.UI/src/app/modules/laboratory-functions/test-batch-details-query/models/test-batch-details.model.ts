/**
 * Test Batch Details Query - TypeScript Interfaces
 * Aligned to API Documentation (test-batch-details-query)
 * JIRA: MLT-13523
 */

export interface TestBatchDetailsResult {
  worksheetId: string;
  testId: string;
  testDesc: string | null;
  firstUnitId: string | null;
  firstChkDigit: string | null;
  lastUnitId: string | null;
  lastChkDigit: string | null;
  testKitId: string | null;
  testType: string | null;
  cutOffValue: string | null;
  reconcileFlag: string | null;
  parmCheckFlag: string | null;
  kitLotNumber: string | null;
  totalUnits: number;
  hasScheduledTests: boolean;
  hasUnscheduledTests: boolean;
  hasHoldingTests: boolean;
  hasParameters: boolean;
  hasDocuments: boolean;
  reagents: ReagentInfoDto[];
}

export interface ReagentInfoDto {
  reagentType: string;
  reagentTypeDesc: string;
  reagentName: string | null;
  expiryDate: string | null;
  channel: number | null;
  supplierName: string | null;
  lotNumber: string | null;
}

export interface ScheduledTestDto {
  unitId: string | null;
  chkDigit: string | null;
  collDate: string | null;
  testSeqNo: number | null;
  testState: string | null;
  tbId: string | null;
  tbSeqNo: number | null;
  wellNumber: string | null;
  absorbance: string | null;
  ratio: string | null;
  resultDats: string | null;
  testingLabCode: string | null;
  resultStatus1: string | null;
  interpDesc: string | null;
}

export interface UnscheduledTestDto {
  unitId: string | null;
  chkDigit: string | null;
  collDate: string | null;
  testSeqNo: number | null;
  testState: string | null;
  tbId: string | null;
  tbSeqNo: number | null;
  wellNumber: string | null;
  absorbance: string | null;
  ratio: string | null;
  resultDats: string | null;
  testingLabCode: string | null;
  resultStatus1: string | null;
  resultStatus2: string | null;
  tempResult1: string | null;
  tempResult2: string | null;
  interpCode: string | null;
  interpDesc: string | null;
}

export interface HoldingTestDto {
  unitId: string | null;
  chkDigit: string | null;
  collDate: string | null;
  resultStatus1: string | null;
  interpDesc: string | null;
  tbSeqNo: number | null;
  wellNumber: string | null;
  absorbance: string | null;
  ratio: string | null;
  resultDats: string | null;
  testingLabCode: string | null;
  resultUserId: string | null;
}

export interface TestBatchParmDto {
  parmCode: string;
  description: string;
  parmValue: string;
  acceptFlag: string;
  firstTech: string | null;
  firstDate: string | null;
  secondTech: string | null;
  secondDate: string | null;
}

export interface BatchNoteDto {
  noteId: string;
  noteSequence: number;
  note: string;
  auditKey: number;
  insertDate: string;
  insertUser: string;
  insertUserName: string;
  programId: string;
  chapterId: string;
}

export interface BatchNotesResponse {
  success: boolean;
  statusCode: number;
  message: string;
  total: number;
  data: BatchNoteDto[];
}

export interface BatchNoteDeleteResponse {
  success: boolean;
  statusCode: number;
  message: string;
  item: boolean;
}

export interface WorksheetLovDto {
  tbId: string;
  testId: string;
}

export interface TestIdLovDto {
  testId: string;
  testDesc: string | null;
}

export interface ApiListResponse<T> {
  data: T[];
  message: string;
}

export interface ApiSingleResult<T> {
  data: T[];
  item: T;
  message: string;
}


export enum ReagentType {
  Reagent = 'R',
  Control = 'C',
  Substrate = 'S'
}

export enum TestType {
  Enzyme = 'E',
  Manual = 'M'
}

export enum TestState {
  Complete = 'C',
  Pending = 'P'
}
