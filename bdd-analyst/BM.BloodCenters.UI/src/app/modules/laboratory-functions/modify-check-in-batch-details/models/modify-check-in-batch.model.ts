import { Moment } from 'moment';

// ===================== DTOs (from API) =====================

export interface CheckInBatchDto {
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
  hasComments?: boolean | string;
  comments?: BatchCommentDto[];
}

export interface BatchCommentDto {
  noteId: number;
  noteSeq: number;
  note: string;
  auditKey: number | null;
  insertUser: string;
  insertUserName: string;
  insertDate: string;
}

export interface BatchCommentApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: BatchCommentDto[];
}

export interface BatchCommentSingleApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: BatchCommentDto;
}

export interface CheckInBatchListResponse {
  data: CheckInBatchDto[];
  total: number;
}

export interface CheckInBatchQueryParams {
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

export interface UpdateCheckInBatchRequest {
  minTemp: number;
  maxTemp: number;
  productType: string;
  shippedDate: string;
  receivedDate: string;
  qcDate: string;
}

export interface CreateBatchCommentRequest {
  note: string;
}

export interface UpdateBatchCommentRequest {
  note: string;
}

// ===================== Filter Models =====================

export interface CheckInBatchFilterValue {
  productType?: string;
  checkinUserId?: string;
  shippedDatePeriod?: 'Before' | 'After' | 'On';
  shippedDate?: Moment;
  receivedDatePeriod?: 'Before' | 'After' | 'On';
  receivedDate?: Moment;
  qcDatePeriod?: 'Before' | 'After' | 'On';
  qcDate?: Moment;
  batchDatePeriod?: 'Before' | 'After' | 'On';
  batchDate?: Moment;
}

// ===================== Form Models =====================

export interface CheckInBatchFormValue {
  minTemp: number;
  maxTemp: number;
  productType: string;
  cartonCount: number;
  numberOfUnits: number;
  shippedDate: Moment;
  receivedDate: Moment;
  qcDate: Moment;
  batchDate: Moment;
}

// ===================== Dropdown Options =====================

export interface ProductTypeOption {
  productType: string;
}

export interface CheckInUserOption {
  userId: string;
  userName?: string;
}

// ===================== API Response Wrapper =====================

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
}
