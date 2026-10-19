export interface SPMasterCodeDto {
  codeType: string;
  code: string;
  codeDesc: string;
  effDate: string | null;
  termDate: string | null;
  lastModifiedDate: string | null;
}

export interface SPGroupedCodeTypeDto {
  codeType: string;
  codeTypeDesc: string;
  effDate: string | null;
  termDate: string | null;
  lastModifiedDate: string | null;
}

export interface SPGroupedCodeTypePaginatedResponse {
  items: SPGroupedCodeTypeDto[];
  totalRecords: number;
}

export interface CreateSPMasterCodeRequest {
  codeType: string;
  code: string;
  codeDesc: string;
  effDate: string | null;
  termDate: string | null;
}

export interface UpdateSPMasterCodeRequest {
  codeDesc: string;
  effDate: string | null;
  termDate: string | null;
}

export interface SPMasterCodeQueryParams {
  codeType?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
  effDatePeriod?: 'AFTER' | 'BEFORE' | 'after' | 'before';
  effDate?: string;
  termDatePeriod?: 'AFTER' | 'BEFORE' | 'after' | 'before';
  termDate?: string;
}

export interface SPMasterCodePaginatedResponse {
  items: SPMasterCodeDto[];
  totalRecords: number;
}

export interface SpecialProcessingFilterValue {
  effDatePeriod?: 'after' | 'before';
  effDate?: string;
  termDatePeriod?: 'after' | 'before';
  termDate?: string;
}

export interface SPMasterCodeApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  totalCount?: number;
}
