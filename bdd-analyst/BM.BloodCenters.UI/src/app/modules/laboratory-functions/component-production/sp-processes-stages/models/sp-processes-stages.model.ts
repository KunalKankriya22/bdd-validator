export interface Process {
  code: string;
  description: string;
}

export interface Stage {
  sequence: number;
  stageCode: string;
  description: string;
  effectiveDate: Date | null;
  terminationDate: Date | null;
  lastModifiedDate: string | null;
  auditKey?: number | null;
  isEditable: boolean;
  errors?: Record<string, string>;
}

export interface ProcessStageRecord {
  processCode: string;
  processDesc: string;
  stageCode: string;
  stageCodeDesc: string;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string | null;
  programId: string | null;
  auditKey: number | null;
}

export interface ProcessStageQueryDto {
  processCode?: string | null;
  stageCode?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
  activeOnly?: boolean;
}

export interface BulkUpsertRecordDto {
  auditKey: number | null;
  processCode: string;
  stageCode: string;
  effDate: string;
  termDate: string | null;
}

export interface BulkUpsertRequest {
  records: BulkUpsertRecordDto[];
}

export interface BulkUpsertResponse {
  totalRecords: number;
  createdCount: number;
  updatedCount: number;
  failureCount: number;
  successCount: number;
  errors: BulkUpsertError[];
  success: boolean;
  message: string;
  errorCode: string | null;
}

export interface BulkUpsertError {
  recordIndex: number;
  processCode: string;
  stageCode: string;
  errorMessage: string;
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  totalCount?: number;
  data?: T[] | T;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
