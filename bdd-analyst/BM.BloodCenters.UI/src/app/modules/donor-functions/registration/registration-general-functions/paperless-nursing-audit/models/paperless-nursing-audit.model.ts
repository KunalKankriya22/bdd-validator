export interface ReturnResult<T> {
  success: boolean;
  message: string | null;
  error: string | null;
  errorCode: string | null;
  statusCode: number;
  data: T[] | null;
  item: T | null;
  total: number | null;
  errorResponse: ValidErrorModel | null;
}

export interface ValidErrorModel {
  errorCode?: string;
  errorMessage?: string;
  fieldName?: string;
}

export interface AuditOptionDto {
  code: string;
  description: string;
}

export interface StartAuditProcessRequest {
  idType: string;
  fromDate: string;
  toDate: string;
}

export interface NursingAuditRecordDto {
  sessionId: string;
  chapterId: string;
  idType: string | null;
  idValue: string | null;
  displayIdValue: string | null;
  collDate: string | null;
  donorId: string | null;
  status: string | null;
  reason: string | null;
  excludeFlag: string | null;
  driveId: string | null;
}

export interface AuditSummaryDto {
  totalCount: number;
  okCount: number;
  holdCount: number;
}

export interface NursingAuditResponse {
  sessionId: string;
  records: NursingAuditRecordDto[];
  summary: AuditSummaryDto;
}

export interface UpdateExcludeFlagRequest {
  items: ExcludeFlagItem[];
}

export interface ExcludeFlagItem {
  idValue: string;
  excludeFlag: string | null;
}

export interface AuditFilter {
  status: string | null;
}
