export interface InstrumentErrorLogRecord {
  moduleName: string;
  insertDats: string;
  userId: string;
  statementId: string;
  errorKey: string;
  errorDesc: string;
  expandKey: string;
}

export interface InstrumentErrorLogSearchRequest {
  startDate: string;
  endDate: string;
  moduleName?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface InstrumentErrorLogResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: InstrumentErrorLogRecord[];
  total: number;
}
