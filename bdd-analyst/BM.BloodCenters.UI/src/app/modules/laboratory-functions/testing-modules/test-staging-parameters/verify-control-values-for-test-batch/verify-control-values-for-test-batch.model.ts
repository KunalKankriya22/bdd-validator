/**
 * Models for Verify Control Values for Test Batch (TSIENTPM)
 * MLT-13692
 */

// LOV DTOs
export interface TestBatchLovDto {
  tbId: string;
  testId?: string;
  status?: string;
  testName?: string;
  unitCount?: number;
}

export interface TestBatchTestLovDto {
  testId: string;
  testName?: string;
  description?: string;
}

export interface TestRunLovDto {
  runId: string;
  insertDate?: string;
}

export interface TestKitLovDto {
  testKitId: string;
  kitLotNumber?: string;
  insertDate?: string;
}

export interface ParmValueLovDto {
  value: string;
  description?: string;
}

// Batch Detail
export interface TestBatchDetail {
  tbId: string;
  testId: string;
  testName?: string;
  unitCount?: number; // Frontend field
  testsTotal?: number; // API field name - maps to unitCount
  parmType?: string;
  tech1Reqd?: string;
  tech2Reqd?: string;
  parmCheckFlag?: string;
  testKitId?: string;
  runId?: string;
  configMsg?: string;
}

// Test Batch Parameter
export interface TestBatchParm {
  sequence: number;
  parmCode: string;
  description?: string; // From VALID_TEST_PARMS
  parmValue?: string;
  firstTech?: string;
  acceptFlag?: string;
  confirmFlag?: string;
  voidCode?: string;
  firstDate?: string;
  secondTech?: string;
  secondDate?: string;
  datatype?: string;
  relatedCode?: string;
  techNo?: number;
  programId?: string;
  acceptMin?: number;
  acceptMax?: number;
}

// Test Batch Reagent
export interface TestBatchReagent {
  channel?: number;
  reagentName?: string;
  reagentType?: string;
  manufacturer?: string;
  lotNumber?: string;
  expiryDate?: string;
  supplierCode?: string;
  reagentCode?: string;
}

// Holding Test (Unit Result)
export interface TestBatchHoldingTest {
  seq?: number; // API returns 'seq', not 'sequence'
  sequence?: number; // Calculated on frontend (row index)
  unitId: string;
  chkDigit?: string; // API field name (backend returns 'ChkDigit')
  checkDigit?: string; // Frontend alias for compatibility
  testId: string;
  result?: string; // Mapped from resultStatus1 on frontend
  resultStatus?: string;
  resultStatus1?: string; // API field name
  absorbance?: string;
  ratio?: string;
  wellNumber?: number;
  tbSeqNo?: number;
}

// Verify DTO (for save/commit)
export interface TestBatchParmVerifyDto {
  runId?: string;
  testKitId?: string;
  parameters: ParameterEntry[];
}

export interface ParameterEntry {
  parmCode: string;
  parmValue: string;
  confirmFlag?: string;
}

// Page Header Config
export interface PageHeaderConfig {
  title?: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
}

export interface Breadcrumb {
  label: string;
  link: string | null;
}
