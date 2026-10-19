export interface ValidLotDto {
  lotNumber: string;
  catalogNumber: string;
  bagCode: string;
  vendorName: string | null;
  dateReceived: string | null;
  numberOfUnits: number | null;
  numberOfCartons: number | null;
  spFlag: string | null;
  volumeTypeSet: string | null;
  supplyCode: string | null;
  effDate: string | null;
  termDate: string | null;
  lastModifiedDate: string | null;
}

export interface CreateValidLotDto {
  lotNumber: string;
  catalogNumber: string;
  vendorName?: string | null;
  dateReceived?: string | null;
  numberOfUnits?: number | null;
  numberOfCartons?: number | null;
  spFlag?: string | null;
  volumeTypeSet?: string | null;
  supplyCode?: string | null;
  effDate?: string | null;
  termDate?: string | null;
}

export interface UpdateValidLotDto {
  lotNumber: string;
  catalogNumber: string;
  bagCode: string;
  vendorName?: string | null;
  dateReceived?: string | null;
  numberOfUnits?: number | null;
  numberOfCartons?: number | null;
  spFlag?: string | null;
  volumeTypeSet?: string | null;
  supplyCode?: string | null;
  effDate?: string | null;
  termDate?: string | null;
}

export interface CatalogDropdownDto {
  catalogNumber: string;
}

export interface MasterCodeDropdownDto {
  code: string;
  description: string;
}

export interface ValidLotQueryParams {
  catalogNumber?: string;
  showExpired?: boolean;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
  effDate?: string;
  effDatePeriod?: 'after' | 'before';
  termDate?: string;
  termDatePeriod?: 'after' | 'before';
}

export interface ValidLotPaginatedResponse {
  items: ValidLotDto[];
  totalRecords: number;
}

export interface ValidLotFilterValue {
  catalogNumber?: string;
  showExpired?: boolean;
  effDatePeriod?: 'after' | 'before';
  effDate?: string;
  termDatePeriod?: 'after' | 'before';
  termDate?: string;
}

export interface ValidLotApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

export interface ValidationErrorResponse {
  success: false;
  statusCode: 400;
  errorCode?: string;
  errorResponse: {
    errorCode?: string;
    error: string;
  };
}
