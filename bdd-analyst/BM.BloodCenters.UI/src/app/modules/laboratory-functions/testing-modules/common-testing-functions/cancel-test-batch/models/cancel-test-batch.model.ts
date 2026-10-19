export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  item: T;
  total: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface WorksheetDto {
  tbId: string;
}

export interface TestIdDto {
  testId: string;
  testDesc: string;
}

export interface UnitDisplayDto {
  unitId: string;
  chkDigit?: string | null;
  collDate: string | null;
}

export interface CancelBatchRequest {
  tbId: string;
  testId: string;
}

export interface CancelBatchResponseDto {
  success: boolean;
  message: string;
  unitsAffected: number;
  batchHeaderDeleted: boolean;
}
