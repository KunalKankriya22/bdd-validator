/**
 * Supplier Query Models
 * Models for supplier query functionality in reagent qualification
 */

/**
 * Supplier lookup option for dropdown
 * Maps to backend supplier dropdown response
 */
export interface SupplierLookup {
  supplierCode: string;
  supplierName: string;
}

/**
 * Supplier Query Result record
 * Maps to backend SupplierQueryResultDto
 * Based on FMB file rmqspqry_fmb.xml - combines master list and detail view data
 */
export interface SupplierQueryResult {
  // Primary Key
  reagentId: string;

  // Test Information (Master List)
  testId: string;
  testDesc: string;

  // Reagent Information (Master List)
  reagentCode: string;
  reagentName: string;

  // Supplier Information
  supplierCode: string;

  // Receipt Information (Detail View)
  receivedBy: string;
  receivedDate: string;
  expiryDate: string;

  // Quantity Information (Detail View)
  noOfTests: number;           // Quantity Received
  remainingTests: number;      // Quantity Available

  // Lot Information (Detail View)
  lotNumber: string;
  kitLotNumber: string;

  // Rejection Information (Detail View)
  rejectReasonCode: string;
  rejectReasonDesc: string;
}

/**
 * Search request payload
 * Maps to backend SupplierQueryDto
 */
export interface SupplierQuerySearchRequest {
  supplierCode: string;
  dateStart?: string;
  dateEnd?: string;
  take?: number;
  skip?: number;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * API Response for suppliers lookup
 */
export interface SuppliersLookupResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: SupplierLookup[];
}

/**
 * API Response for supplier query search
 */
export interface SupplierQuerySearchResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: SupplierQueryResult[];
  total: number;
}
