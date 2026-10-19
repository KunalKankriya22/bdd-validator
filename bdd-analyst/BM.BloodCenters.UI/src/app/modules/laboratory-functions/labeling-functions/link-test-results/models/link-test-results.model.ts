export interface TestResultDto {
  testId: string;
  testSeqNo: number;
  testDescription: string;
  resultStatus: string;
  resultStatusDescription: string;
  absorbance?: string;
  testResult?: string;
}

export interface ValidateRequest {
  sourceUnitId: string;
  targetUnitId: string;
}

export interface ValidateResponseData {
  canTransfer: boolean;
  primaryUnitId: string;
  primaryCollDate: string;
  sampleUnitId: string;
  sampleCollDate: string;
  isAutologous: boolean;
  primaryCompletedTests: TestResultDto[];
  sampleTransferableTests: TestResultDto[];
}

export interface ValidateResponse {
  success: boolean;
  message: string;
  statusCode: number;
  canTransfer: boolean;
  data: ValidateResponseData;
}

export interface SelectedTest {
  testId: string;
  testSeqNo: number;
}

export interface TransferRequest {
  sourceUnitId: string;
  targetUnitId: string;
  confirm: boolean;
  transferAll: boolean;
  selectedTests?: SelectedTest[];
}

export interface TransferResponseData {
  success: boolean;
  message: string;
  testResultsTransferred: number;
  sourceUnitId: string;
  targetUnitId: string;
}

export interface TransferResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: TransferResponseData;
}
