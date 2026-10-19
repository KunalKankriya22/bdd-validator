export interface VistaLifeTrakErrorLogDto {
  transactionId: string;
  insertDate: string;
  messageType: string | null;
  errorText: string | null;
}

export interface VistaLifeTrakErrorLogQueryDto {
  fromDate: string | null;
  toDate: string | null;
  messageType?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface VistaLifeTrakErrorLogResponse {
  data: VistaLifeTrakErrorLogDto[];
  total: number;
}
