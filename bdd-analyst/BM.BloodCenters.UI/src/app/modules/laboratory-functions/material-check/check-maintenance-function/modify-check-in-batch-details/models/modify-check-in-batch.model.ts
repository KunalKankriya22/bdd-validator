import { Moment } from 'moment';

// ===================== DTOs (from API) =====================

export interface CheckInBatchDto {
  batchId: string;
  contract: string;
  description: string;
  minTemperature: number;
  maxTemperature: number;
  productType: string;
  cartonCount: number;
  numberOfUnits: number;
  shippedDate: string; // YYYY-MM-DD
  receivedDate: string; // YYYY-MM-DD
  qcDate: string; // YYYY-MM-DD
  batchDate: string; // YYYY-MM-DD
  checkInUserId: string;
  userName: string;
  comments?: BatchCommentDto[];
}

export interface BatchCommentDto {
  commentId: string;
  batchId: string;
  userId: string;
  userName: string;
  commentText: string;
  createdDate: string; // ISO datetime
  modifiedDate?: string; // ISO datetime
}

export interface CheckInBatchListResponse {
  items: CheckInBatchDto[];
  totalRecords: number;
}

export interface CheckInBatchQueryParams {
  searchKeyword?: string; // Search by batch ID
  productType?: string;
  checkInUserId?: string;
  shippedDatePeriod?: 'Before' | 'After' | 'On';
  shippedDate?: string; // YYYY-MM-DD
  receivedDatePeriod?: 'Before' | 'After' | 'On';
  receivedDate?: string; // YYYY-MM-DD
  qcDatePeriod?: 'Before' | 'After' | 'On';
  qcDate?: string; // YYYY-MM-DD
  batchDatePeriod?: 'Before' | 'After' | 'On';
  batchDate?: string; // YYYY-MM-DD
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
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
  commentText: string;
}

export interface UpdateBatchCommentRequest {
  commentText: string;
}

// ===================== Filter Models =====================

export interface CheckInBatchFilterValue {
  productType?: string;
  checkInUserId?: string;
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
  minTemperature: number;
  maxTemperature: number;
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
  code: string;
  description: string;
}

export interface CheckInUserOption {
  userId: string;
  userName: string;
}

export interface CheckInBatchDropdownResponse {
  productTypes: ProductTypeOption[];
  checkInUsers: CheckInUserOption[];
}
