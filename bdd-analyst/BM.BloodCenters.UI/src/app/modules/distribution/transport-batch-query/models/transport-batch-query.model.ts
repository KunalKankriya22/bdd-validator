/**
 * Transport Batch Query Models
 *
 * TypeScript interfaces for Transport Batch Query API requests and responses.
 * Based on API documentation version 1.0
 */

/**
 * Query filter parameters for batch search
 */
export interface TransportBatchQueryDto {
  fromWarehouse?: string | null;  // Max 1 char
  toWarehouse?: string | null;    // Max 1 char
  batchId?: string | null;        // Max 10 chars
  fromDate?: string | null;       // ISO 8601 format (YYYY-MM-DD)
  toDate?: string | null;         // ISO 8601 format (YYYY-MM-DD)
  status?: string | null;         // Max 5 chars
  take?: number;                  // Default: 10, max: 100
  skip?: number;                  // Default: 0
}

/**
 * Transport batch header information
 */
export interface TransportBatchHeaderDto {
  batchId: string;                // Max 10 chars, required
  createDate: string;             // ISO 8601 DateTime, required
  batchName: string | null;       // Max 50 chars
  fromWarehouse: string;          // Max 1 char, required
  toWarehouse: string;            // Max 1 char, required
  batchStatus: string | null;     // Max 5 chars
  checkoutTemp: number | null;    // Temperature in Celsius
  reconDate: string | null;       // ISO 8601 DateTime
  reconUser: string | null;       // Max 6 chars
}

/**
 * Unit detail information within a batch
 */
export interface TransportBatchDetailDto {
  unitId: string;                 // Max 13 chars, required
  chkDigit: string | null;        // Max 2 chars, calculated
  productCode: string | null;     // Max 8 chars
  aliquot: string | null;         // Max 4 chars
  receiveWarehouse: string | null; // Max 1 char
  receiveDate: string | null;     // ISO 8601 DateTime
  receiveUser: string | null;     // Max 6 chars
  reconReason: string | null;     // Max 5 chars
  reconDetail: string | null;     // Max 240 chars
}

/**
 * Warehouse location information for dropdowns
 */
export interface WarehouseLookupDto {
  code: string;                   // Max 1 char, required
  description: string;            // Max 50 chars, required
}

/**
 * Batch status information for dropdowns
 */
export interface BatchStatusLookupDto {
  status: string;                 // Max 5 chars, required
}

/**
 * Recent batch information for dropdowns
 */
export interface RecentBatchDto {
  batchId: string;                // Max 10 chars, required
  createDate: string;             // ISO 8601 DateTime, required
}

/**
 * API response wrapper for paginated batch query results
 */
export interface TransportBatchQueryResponse {
  success: boolean;
  data: TransportBatchHeaderDto[];
  total: number;
  message: string;
  statusCode: number;
}

/**
 * API response wrapper for batch details
 */
export interface TransportBatchDetailResponse {
  success: boolean;
  data: TransportBatchDetailDto[];
  total: number;
  message: string;
  statusCode: number;
}

/**
 * API response wrapper for warehouse lookup
 */
export interface WarehouseLookupResponse {
  success: boolean;
  data: WarehouseLookupDto[];
  message: string;
  statusCode: number;
}

/**
 * API response wrapper for batch status lookup
 */
export interface BatchStatusLookupResponse {
  success: boolean;
  data: BatchStatusLookupDto[];
  message: string;
  statusCode: number;
}

/**
 * API response wrapper for recent batches
 */
export interface RecentBatchResponse {
  success: boolean;
  data: RecentBatchDto[];
  message: string;
  statusCode: number;
}

/**
 * Extended batch header with warehouse descriptions for display
 */
export interface TransportBatchDisplay extends TransportBatchHeaderDto {
  fromWarehouseDescription?: string;
  toWarehouseDescription?: string;
}

/**
 * Extended detail with formatted values for table display
 */
export interface TransportBatchDetailDisplay extends TransportBatchDetailDto {
  fullUnitId?: string;            // unitId + chkDigit combined
  formattedReceiveDate?: string;  // DD-MMM-YYYY HH:MM format
}
