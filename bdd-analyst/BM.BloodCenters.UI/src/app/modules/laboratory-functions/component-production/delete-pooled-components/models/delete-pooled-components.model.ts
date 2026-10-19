/**
 * Pool details returned by the API
 */
export interface PoolDetails {
  poolId: string;
  productCode: string;
  productDescription: string;
  unitCount?: number;
}

/**
 * Pooled component unit in the pool
 */
export interface PooledComponentUnit {
  unitId: string;
  collDate?: string;
  chapterId?: number;
  componentPrefix?: string;
  productCode: string;
  productDescription?: string;
  programId?: string;
  insertDats?: string;
  componentStatus?: string;
  expiryDate?: string;
  systemLabelDecision?: string;
  rejectReasonCode?: string;
  relabelProductCode?: string;
  pooledComponentId?: string;
  warehouseId?: string;
}

/**
 * Query parameters for paginated pooled units
 */
export interface PooledUnitsQueryParams {
  productCode?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Paginated response for pooled units
 */
export interface PooledUnitsPaginatedResponse {
  items: PooledComponentUnit[];
  totalRecords: number;
}

/**
 * Request DTO for deleting selected units
 */
export interface DeleteSelectedUnitsRequest {
  selectedUnitIds: string[];
}

/**
 * Response DTO after deleting selected units
 */
export interface DeleteSelectedUnitsResponse {
  deletedCount: number;
  deletedUnitIds: string[];
  message?: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}
