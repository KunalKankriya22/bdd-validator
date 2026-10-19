export interface RextractContract {
  contractId: string;
  company: string;
  centerId?: string;
}

export interface RextractParameter {
  resultParmId: string;
}

export interface RextractBatchSummary {
  batchId: string;
  unitCount: number;
  insertDats: string;
  profileSetId: string;
  batchChapterId: string;
  profileSeqNo: number;
}

export interface RextractBatchTest {
  testId: string;
}

export interface RextractUnitDetail {
  batchTestId: string;
  unitId: string;
  osUnitId: string;
  testId: string;
  testSeqNo: number;
  resultStatus1: string;
  chkDigit?: string;
  osChkDigit?: string;
  collDate?: string;
}

export interface ExecuteExtractRequest {
  contractId: string;
  resultParmId: string;
  extractTime: string;
  rsmAutoReport: 'Y' | 'N';
}

/** Execute re-extraction response — use ApiResponse<null> */
export type ExecuteExtractResponse = ApiResponse<null>;

export interface ReExtractBatch {
  batchId: string;
  contractId: string;
  resultParmId: string;
  chapterId: string;
  insertDate: string;
  profileSetId: string;
  profileSeqNo: number;
  unitCount: number;
}

export interface ExtractDialogData {
  contractId?: string;
  resultParmId?: string;
  selectedBatch?: ReExtractBatch;
  batches?: ReExtractBatch[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data?: T;
  totalCount?: number;
  errors?: { code: string; message: string }[];
}

export interface ResetUnderExtractDto {
  resultParmId: string;
  batchId: string | null;
  insertDate: string;
  underExtractFlag: string;
}

export interface ResetUnderExtractRequestDto {
  items: { resultParmId: string; batchId: string | null }[];
}

export interface ResetUnderExtractResult {
  successCount: number;
  failureCount: number;
  totalProcessed: number;
}

export interface ExtractDialogResult {
  success: boolean;
  extractDate?: string;
  generateRsmReport?: boolean;
}
