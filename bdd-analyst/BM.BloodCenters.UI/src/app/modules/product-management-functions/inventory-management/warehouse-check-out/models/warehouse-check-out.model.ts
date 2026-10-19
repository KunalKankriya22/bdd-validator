// --- Response DTOs (match backend WarehouseCheckOutBatchDto) ---

export interface WarehouseCheckOutProductDto {
  unitId: string | null;
  productCode: string;
  aliquot: string | null;
  collectionDate: string | null;
  expirationDate: string | null;
}

export interface WarehouseCheckOutBatchDto {
  batchId: string;
  toWarehouse: string;
  toWarehouseName: string;
  fromWarehouse: string;
  fromWarehouseName: string;
  checkoutTemp: number | null;
  batchName: string | null;
  batchStatus: string;
  createDate: string;
  createUser: string;
  products?: WarehouseCheckOutProductDto[];
}

export interface WarehouseDropdownDto {
  code: string;
  description: string;
}

// --- Request DTOs ---

export interface CreateBatchRequestDto {
  batchId?: string;
  toWarehouse: string;
  checkoutTemp: number | null;
  batchName: string | null;
}

export interface UpdateBatchRequestDto {
  checkoutTemp: number | null;
  batchName: string | null;
}

export interface AddProductRequestDto {
  unitId: string;
  productCode: string;
  aliquot?: string;
}

// --- Unit lookup (GET /warehouse-checkout/units/{unitId}/lookup) ---

export interface UnitLookupDto {
  productCode: string;
  aliquot: string | null;
  collectionDate: string | null;
  expirationDate: string | null;
}

export interface ProductCodeOption {
  productCode: string;
  productDesc?: string;
}

// --- UI table row (formatted for display) ---

export interface CheckedOutUnitRow {
  unitId: string;
  collectionDate: string;
  product: string;
  expirationDate: string;
}

// --- API response wrappers ---

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  item: T;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}
