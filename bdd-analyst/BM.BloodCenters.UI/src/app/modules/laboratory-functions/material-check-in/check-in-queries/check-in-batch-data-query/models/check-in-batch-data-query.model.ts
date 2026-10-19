export interface CheckInBatchDataDto {
  batchId: string;
  contractId?: string;
  company?: string;
  minTemp?: number;
  maxTemp?: number;
  productType?: string;
  cartonCount: number;
  numberOfUnits: number;
  shippedDate?: string;
  receivedDate?: string;
  qcDate?: string;
  batchDate?: string;
  checkinUserId?: string;
  userName?: string;
}

export interface CheckInBatchDataQueryRequest {
  batchId?: string;
  checkinUserId?: string;
  productType?: string;
  shippedDatePeriod?: string;
  shippedDate?: string;
  receivedDatePeriod?: string;
  receivedDate?: string;
  qcDatePeriod?: string;
  qcDate?: string;
  batchDatePeriod?: string;
  batchDate?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface ProductTypeLov {
  productType: string;
  productDesc?: string;
}

export interface CheckinUserLov {
  userId: string;
  userName?: string;
}
