/**
 * Rejected Inventory Product Item
 */
export interface RejectedInventoryItem {
  unitId: string;
  productCode: string;
  rejectionCode: string;
  rejectionReason: string;
  collDate?: string;
  bloodType?: string;
  aboRh: string;
  expirationDate: string;
  location: string;
  locationId?: string;
}

/**
 * Rejection Code Lookup Item
 */
export interface RejectionCodeItem {
  code: string;
  codeDesc?: string;
  description?: string;
}

/**
 * Product Code Lookup Item
 */
export interface ProductCodeItem {
  productCode: string;
  productDesc?: string;
  code?: string;
  description?: string;
}

/**
 * Unit Validation Request
 */
export interface UnitValidationRequest {
  unitId: string;
}

/**
 * Unit Validation Response
 */
export interface UnitValidationResponse {
  unitId: string;
  collDate: string;
  isValid: boolean;
}

/**
 * Filter Criteria for Reject Inventory Products
 */
export interface RejectInventoryFilterCriteria {
  unitId?: string;
  productCode?: string;
  rejectionCode?: string;
}

/**
 * Reject Inventory Request Payload
 */
export interface RejectInventoryRequest {
  unitId: string;
  productCode: string;
  rejectCode: string;
  rejectionCode?: string;
  codeScheme?: string;
  loggedInUserName?: string;
  chapterId?: string;
  warehouseId?: string;
  warehouseName?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  statusCode: number;
  data?: T;
  item?: T;
  errorCode?: string | null;
}

/**
 * Search Response for Rejected Inventory Items
 */
export interface RejectInventorySearchResponse {
  items: RejectedInventoryItem[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
}
