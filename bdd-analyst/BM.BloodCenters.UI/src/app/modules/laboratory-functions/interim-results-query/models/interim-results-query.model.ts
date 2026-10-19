export interface InterimContractOption {
  contractId: string;
  company: string;
  centerId: string;
}

export interface InterimTestOption {
  testId: string;
  testDescription: string;
}

export interface InterimCodeOption {
  code: string;
  codeDescription: string;
}

export interface InterimBatchOption {
  batchId: string;
  unitCount: number;
}

export interface InterimResultsQueryRequest {
  contractId: string;
  testId?: string | null;
  interimCode?: string | null;
  batchId: string;
  take?: number;
  skip?: number;
}

export interface InterimResultRecord {
  unitId: string;
  checkDigit: string;
  testId: string;
  testSeqNo: number;
  extractFlag: string;
  firstExtractDate: string | null;
  lastExtractDate: string | null;
  resultCode: string;
  resultDescription: string;
}

export interface InterimResultDisplay extends InterimResultRecord {
  unitIdDisplay: string;
  extractedFlagDisplay: string;
  firstExtractDateFormatted: string;
  lastExtractDateFormatted: string;
}

export interface InterimResultsQueryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: InterimResultRecord[];
  item?: InterimResultRecord;
  total?: number;
}
