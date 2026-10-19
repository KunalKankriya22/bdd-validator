export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T[] | null;
  total?: number;
  totalCount?: number;
}

export interface SaveResult {
  success: boolean;
  message: string;
  statusCode: number;
  item: boolean;
  errorResponse: { errorCode: string; error: string };
}

export interface ProductStorageListDto {
  productType: string;
  warehouseId: string;
  warehouseDescription: string;
  deviceType: string;
  deviceDescription: string;
  number: string;
  trayCapacity: string;
  effectiveDate: string;
  terminationDate: string | null;
  lastModifiedDate: string | null;
}

/** Shape the list POST endpoint returns from the backend */
export interface ProductStorageApiDto {
  productType: string;
  warehouseId: string;
  deviceType: string;
  deviceNumber: string;
  trayCapacity: number;
  effectiveDate: string;
  termDate: string | null;
  chapterId: string;
  lastModifiedDate: string | null;
  productTypeDesc: string | null;
  warehouseDesc: string | null;
  deviceDesc: string | null;
  deviceDescription: string | null;
}

/** Query body for the paginated list POST */
export interface ProductStorageQueryDto {
  searchKeyword: string | null;
  sortColumn: string;
  sortOrder: string;
  productType: string | null;
  warehouseId: string | null;
  deviceType: string | null;
  effectiveDate: string | null;
  effectiveDatePeriod: string | null;
  terminationDate: string | null;
  terminationDatePeriod: string | null;
}

export interface CreateProductStorageDto {
  productType: string;
  warehouseId: string;
  deviceType: string;
  deviceNumber: string;
  trayCapacity: number;
  effectiveDate: string;
  termDate: string | null;
}

export interface UpdateProductStorageDto {
  trayCapacity: number;
  effectiveDate: string;
  termDate: string | null;
}

export interface ProductStorageFilterValue {
  productType: string | null;
  warehouseCode: string | null;
  deviceType: string | null;
  effectivePeriod: string | null;
  effectiveDate: string | null;
  terminationPeriod: string | null;
  terminationDate: string | null;
}

export interface LovOption {
  code: string;
  description: string;
}
