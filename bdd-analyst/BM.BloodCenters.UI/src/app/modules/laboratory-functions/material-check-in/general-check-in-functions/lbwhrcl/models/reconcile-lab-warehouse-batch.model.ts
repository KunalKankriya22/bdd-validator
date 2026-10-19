/**
 * Reconcile Lab Warehouse Batch Models
 * DTOs and interfaces for the Reconcile Lab Warehouse Batch module (CPIWHRCL/LBWHRCL)
 * Based on API documentation: CPIWHRCL-api-documentation.md
 */

// ==================== Request DTOs ====================

/**
 * Request DTO for reconciling batch detail records
 */
export interface ReconcileBatchRequestDto {
  batchId: string;
  details: ReconcileDetailItemDto[];
}

/**
 * Individual reconciliation detail item
 */
export interface ReconcileDetailItemDto {
  unitId: string;
  productCode: string | null;
  aliquot: string | null;
  reconReason: string;
  reconDetail?: string;
  /** Collection date - required for interdiction operations */
  collDate?: string;
}

// ==================== Response DTOs ====================

/**
 * Batch header information DTO
 */
export interface BatchHeaderDto {
  batchId: string;
  createDate: string;
  toWarehouse: string;
  toWhDesc: string;
  batchStatus: string;
}

/**
 * Batch detail item DTO (individual unit/component in batch)
 */
export interface BatchDetailDto {
  batchId: string;
  unitId: string;
  chkDigit: string | null;
  productCode: string | null;
  productCodeDesc: string | null;
  aliquot: string | null;
  reconReason: string | null;
  reasonCdDesc: string | null;
  reconDetail: string | null;
  collDate: string | null;
}

/**
 * Reason code dropdown DTO
 */
export interface ReasonCodeDto {
  code: string;
  codeDesc: string;
}

/**
 * Reconcile batch response DTO
 */
export interface ReconcileBatchResponseDto {
  batchId: string;
  itemsReconciled: number;
  pendingCount: number;
}

// ==================== API Response Wrappers ====================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[][];
  total?: number;
}

/**
 * Single item API response wrapper
 */
export interface ApiResponseSingle<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
}

// ==================== UI Models ====================

/**
 * Extended batch detail for UI with selection state
 */
export interface BatchDetailUiModel extends BatchDetailDto {
  selected: boolean;
  rowId: string;
}

/**
 * Batch dropdown option from API
 */
export interface BatchDropdownDto {
  batchId: string;
  createDate: string;
}

/**
 * Batch dropdown option (legacy - for compatibility)
 */
export interface BatchDropdownOption {
  batchId: string;
  displayText: string;
  createDate: string;
  toWarehouse: string;
  toWhDesc: string;
}
