/**
 * Reconcile Transport Batch Models
 * DTOs and interfaces for the Reconcile Transport Batch module (IMIWHRCL)
 * Based on API documentation: imiwhrcl-api-documentation.md
 */

// ==================== Request DTOs ====================

/**
 * Request DTO for reconciling batch units
 */
export interface ReconcileBatchRequestDto {
  units: ReconcileUnitDto[];
}

/**
 * Individual unit reconciliation action
 */
export interface ReconcileUnitDto {
  unitId: string; // Required, max 15 chars
  productCode: string; // Required, max 8 chars
  aliquot: string; // Required, max 2 chars
  reconReason?: string; // Optional, max 5 chars (if provided, unit is quarantined)
  reconDetail?: string; // Optional, max 240 chars (additional notes)
}

// ==================== Response DTOs ====================

/**
 * Batch header information DTO for dropdown options
 */
export interface BatchHeaderDto {
  batchId: string; // Batch identifier, max 10 chars
  createDate: string; // Batch creation date (ISO 8601)
  toWarehouse: string; // Destination warehouse code, max 5 chars
  toWarehouseDescription: string; // Warehouse name/description
}

/**
 * Full batch details with unreceived units
 */
export interface BatchReconciliationDto {
  batchId: string; // Batch identifier
  createDate: string; // Batch creation date
  toWarehouse: string; // Destination warehouse code
  toWarehouseDescription: string; // Destination warehouse name
  currentWarehouse: string; // User's current warehouse
  unreceivedUnits: TransportDetailDto[]; // Units pending reconciliation
}

/**
 * Individual unit in a transport batch
 */
export interface TransportDetailDto {
  unitId: string; // Blood unit identifier, max 15 chars
  checkDigit: string; // Unit check digit, max 2 chars
  productCode: string; // Product code, max 8 chars
  aliquot: string; // Aliquot number, max 2 chars
  collectionDate?: string; // Collection date (nullable, ISO 8601 or YYYY-MM-DD)
  expirationDate?: string; // Expiration date (nullable, ISO 8601)
  reconReason?: string | null; // Reconciliation reason code (nullable)
  reasonDescription?: string | null; // Reason description (nullable)
  reconDetail?: string | null; // Additional details (nullable)
}

/**
 * Rejection reason code for warehouse reconciliation
 */
export interface ReasonCodeDto {
  code: string; // Reason code, max 5 chars (WHREJ type)
  description: string; // Human-readable description
}

/**
 * Reconcile batch response DTO
 */
export interface ReconcileBatchResponseDto {
  batchId: string;
  unitsReconciled: number;
  unitsQuarantined: number;
  batchStatus: string;
  unitsRemaining?: number;
}

// ==================== API Response Wrappers ====================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
}

// ==================== UI Models ====================

/**
 * Extended transport detail for UI with selection state
 */
export interface TransportDetailUiModel extends TransportDetailDto {
  selected: boolean;
  rowId: string; // Composite key for table selection
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message?: string;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
