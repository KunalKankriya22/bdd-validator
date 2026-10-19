export interface MaintainBatchDataLovDto {
  batchId: string;
  contractId: string;
  cbcChapterId: string;
}

export interface MaintainBatchDataResponseDto {
  batchId: string | null;
  chapterId: string | null;
  contractId: string | null;
  checkinUserId: string | null;
  receivedDate: string | null;
  shippedDate: string | null;
  numberOfUnits: number | null;
  cartonCount: number | null;
  maxTemp: number | null;
  minTemp: number | null;
  insertDats: string | null;
  qcDate: string | null;
  profileSeqNo: number | null;
  resultsQcUser: string | null;
  resultsQcDate: string | null;
  noteId: number | null;
  productType: string | null;
  companyName: string | null;
  contractType: string | null;
  checkinUserName: string | null;
  noteText: string | null;
}

export interface MaintainBatchDataUpdateRequestDto {
  batchId: string;
  receivedDate: string | null;
  shippedDate: string | null;
  maxTemp: number | null;
  minTemp: number | null;
  qcDate: string | null;
  resultsQcDate: string | null;
  noteText: string | null;
  cartonCount: number | null;
}

export interface MaintainBatchDataApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total: number;
  item: T;
}
