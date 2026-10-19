/**
 * Pool Compatibility Matrix data model interfaces
 * Used for Pool Compatibility Matrix table component and related services
 */

/**
 * Main Pool Compatibility Matrix data model
 * Represents a single pool compatibility record from the API
 */
export interface PoolCompatibilityMatrixModel {
  chapterId: string;
  workOption: string;
  workOptionDescription: string;
  inventoryProductType: string;
  finishedInventoryProductType: string;
  effectiveDate: string;
  terminationDate: string | null;
  lastModifiedDate: string;
}

/**
 * Product Type option for dropdowns
 */
export interface ProductTypeOption {
  productType: string;
  description: string;
}

/**
 * Work Option for dropdowns
 */
export interface WorkOptionModel {
  code: string;
  description: string;
}

/**
 * Request parameters for Pool Compatibility Matrix API calls
 * Used for search, filter, and sort operations
 */
export interface PoolCompatibilityMatrixParamsDto {
  searchItem?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  terminationDateFrom?: string;
  terminationDateTo?: string;
  inventoryProductType?: string;
  finishedInventoryProductType?: string;
  sortOrder?: string;
}

/**
 * API response format for Pool Compatibility Matrix table data
 */
export interface PoolCompatibilityMatrixResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: {
    data: PoolCompatibilityMatrixModel[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
  total: number;
}

/**
 * Filter state for Pool Compatibility Matrix table
 * Tracks currently applied filters
 */
export interface PoolCompatibilityMatrixFilterValue {
  inventoryProductType: string | null;
  finishedInventoryProductType: string | null;
  effectiveDateFrom: string | null;
  effectiveDateTo: string | null;
  terminationDateFrom: string | null;
  terminationDateTo: string | null;
}

/**
 * Create DTO for Pool Compatibility Matrix
 */
export interface PoolCompatibilityMatrixCreateDto {
  workOption: string;
  inventoryProductType: string;
  finishedInventoryProductType: string;
  effectiveDate: string;
  terminationDate?: string;
}

/**
 * Update DTO for Pool Compatibility Matrix
 */
export interface PoolCompatibilityMatrixUpdateDto {
  chapterId: string;
  workOption: string;
  inventoryProductType: string;
  finishedInventoryProductType: string;
  originalInventoryProductType: string;
  originalFinishedInventoryProductType: string;
  effectiveDate: string;
  terminationDate?: string;
}

/**
 * Batch create request
 */
export interface PoolCompatibilityMatrixBatchCreateDto {
  records: PoolCompatibilityMatrixCreateDto[];
}

/**
 * Batch create response item
 */
export interface BatchCreateResultItem {
  index: number;
  success: boolean;
  errorMessage?: string;
  record: PoolCompatibilityMatrixCreateDto;
}

/**
 * Batch create response
 */
export interface PoolCompatibilityMatrixBatchResponse {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  results: BatchCreateResultItem[];
  message: string;
}
