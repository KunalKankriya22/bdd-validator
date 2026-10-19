/**
 * API Models for Lab Warehouse Transfer Query
 * Generated from API documentation: MLT-12991
 * Base URL: /api/lab-warehouse-transfer-query
 */

/**
 * Lab Warehouse Transfer Header DTO (Response)
 * Represents a warehouse transfer batch
 */
export interface LabWhTransHdrDto {
  /** Unique batch identifier */
  batchId: string;
  /** Batch creation date */
  createDate: string;
  /** Batch name/description */
  batchName: string | null;
  /** Source warehouse code */
  fromWarehouse: string | null;
  /** Source warehouse description */
  fromWarehouseDesc: string | null;
  /** Destination warehouse code */
  toWarehouse: string;
  /** Destination warehouse description */
  toWarehouseDesc: string | null;
  /** Batch status (OPEN, CLOSED, RECON) */
  batchStatus: string;
  /** Checkout temperature */
  checkoutTemp: number | null;
  /** Reconciliation date */
  reconDate: string | null;
  /** Reconciliation user */
  reconUser: string | null;
  /** Number of units in batch */
  unitCount: number;
}

/**
 * Lab Warehouse Transfer Detail DTO (Response)
 * Represents a unit within a warehouse transfer batch
 */
export interface LabWhTransDtlDto {
  /** Unit identifier */
  unitId: string;
  /** Check digit */
  chkDigit: string | null;
  /** Product code */
  productCode: string | null;
  /** Aliquot number */
  aliquot: string | null;
  /** Receiving warehouse */
  receiveWarehouse: string | null;
  /** Receive date/time */
  receiveDate: string | null;
  /** Receiving user */
  receiveUser: string | null;
  /** Receive temperature */
  receiveTemp: number | null;
  /** Reconciliation reason code */
  reconReason: string | null;
  /** Reconciliation detail/notes */
  reconDetail: string | null;
}

/**
 * Lab Warehouse Transfer Query DTO (Request)
 * Used for filtering warehouse transfers
 */
export interface LabWhTransQueryDto {
  /** Filter by source warehouse code */
  fromWarehouse?: string;
  /** Filter by destination warehouse code */
  toWarehouse?: string;
  /** Filter by batch ID */
  batchId?: string;
  /** Filter by unit ID */
  unitId?: string;
  /** Filter by batch status */
  status?: string;
  /** Filter from date (defaults to 30 days ago) */
  fromDate?: string;
  /** Filter to date (defaults to today) */
  toDate?: string;
  /** Search across batch ID, batch name */
  searchKeyword?: string;
  /** Column to sort by (BatchId, CreateDate, BatchName, BatchStatus) */
  sortColumn?: string;
  /** Sort order (ASC or DESC) */
  sortOrder?: string;
}

/**
 * Warehouse Lookup DTO (Response)
 * Used for warehouse dropdown lists
 */
export interface WarehouseLookupDto {
  /** Warehouse code */
  code: string;
  /** Warehouse description */
  description: string;
}

/**
 * API Response wrapper for paginated queries
 */
export interface LabWhTransQueryResponse {
  /** Success indicator */
  success: boolean;
  /** HTTP status code */
  statusCode: number;
  /** Response message */
  message: string;
  /** Array of warehouse transfer headers */
  data: LabWhTransHdrDto[];
  /** Total count of records */
  total: number;
}

/**
 * Complete warehouse transfer (header + details)
 */
export interface LabWhTransCompleteDto {
  /** Warehouse transfer header */
  header: LabWhTransHdrDto;
  /** Array of unit details */
  details: LabWhTransDtlDto[];
}

/**
 * Batch ID Lookup DTO (Response) - for autocomplete
 */
export interface BatchIdLookupDto {
  batchId: string;
}

/**
 * Status Lookup DTO (Response) - for dropdown
 */
export interface StatusLookupDto {
  status: string;
}

/**
 * Batch status enum
 */
export enum BatchStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  RECON = 'RECON'
}

/**
 * Sort column options
 */
export type SortColumn = 'BatchId' | 'CreateDate' | 'BatchName' | 'BatchStatus';

/**
 * Sort order options
 */
export type SortOrder = 'ASC' | 'DESC';
