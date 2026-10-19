export interface TbWsOption {
  tbId: string;
  insertDats: string;
  testId?: string;
}

export interface TestIdOption {
  testId: string;
  testDesc: string;
}

export interface ResultCodeOption {
  resultStatus: string;
  codeDesc: string;
}

export interface SecondTechTestResultRow {
  tbSeqNo: number;
  unitId: string;
  chkDigit: string;
  collDate: string;
  tempResult1: string;
  resultCodeDesc1: string;
  tempResult2: string;
  resultCodeDesc2: string;
  tempResult1UserId?: string;
  testChapterId?: string;
  tbId?: string;
  testId?: string;
}

export interface SecondTechTestResultResponse {
  results: SecondTechTestResultRow[];
  totalCount: number;
}

export interface SaveSecondTechResultsRequest {
  tbId: string;
  testId: string;
  results: SecondTechTestResultRow[];
  loggedInUserName: string;
  chapterId: string;
}

export interface SaveSecondTechResultsResponse {
  success: boolean;
  message?: string;
  hasDiscrepancy: boolean;
}

export interface SecondTechValidationResult {
  hasWarnings: boolean;
  warnings: string[];
  resultSummary: string;
  hasDiscrepancy: boolean;
}
