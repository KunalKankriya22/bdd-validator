export interface HtfMappingDto {
  sequenceNo: number;
  headerName: string;
  testDesc: string;
  startPos: number;
  endPos: number;
  modifiedUser: string | null;
  modifiedDate: string | null;
}

export interface CreateHtfMappingDto {
  sequenceNo: number;
  headerName: string;
  startPos: number;
  endPos: number;
}

export interface UpdateHtfMappingDto {
  headerName: string;
  startPos: number;
  endPos: number;
}

export interface HtfMappingQueryDto {
  headerName?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface TestIdDropdownDto {
  testId: string;
  testDesc: string;
}

export interface HtfMappingReturnResult<T> {
  success: boolean | null;
  message: string | null;
  error: string | null;
  errorCode: string | null;
  statusCode: number | null;
  data: T[] | null;
  item: T | null;
  total: number | null;
  errorResponse: ErrorResponseModel | null;
}

export interface ErrorResponseModel {
  errorCode: string | null;
  error: string | null;
}
