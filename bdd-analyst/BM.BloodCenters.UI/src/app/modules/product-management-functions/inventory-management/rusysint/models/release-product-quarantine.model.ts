/**
 * Models for Release Product Quarantine feature
 * Generated from API documentation: release-product-quarantine-api-documentation.md
 */

// ========== Response Models ==========

/**
 * Quarantine Type lookup value
 * Used for dropdown selection
 */
export interface QuarantineType {
  code: string; // "QU" or "RT"
  description: string; // "Quarantine" or "Returns"
}

/**
 * Quarantine Product (primary response entity)
 * Represents a product in quarantine or pending return
 */
export interface QuarantineProduct {
  unitId: string;
  productCode: string;
  aliquot: string;
  chapterId: string;
  collDate: string; // ISO 8601 DateTime
  expDate: string | null; // ISO 8601 DateTime, nullable
  bloodType: string | null;
  inventoryClass: string | null;
  reasonCode: string | null;
  reasonDesc: string | null;
  locationId: string | null;
  productDesc: string | null;
  aboDesc: string | null;
}

/**
 * Quarantine Reason
 * Individual reason why a product is in quarantine
 */
export interface QuarantineReason {
  unitId: string;
  productCode: string;
  aliquot: string;
  chapterId: string;
  reasonCode: string;
  reasonDesc: string | null;
  createdDate: string; // ISO 8601 DateTime
}

/**
 * Storage Location
 * Available location for restocking products
 */
export interface StorageLocation {
  warehouseId: string;
  deviceType: string | null;
  deviceNumber: string;
  rackNumber: string;
  shelfNumber: string | null;
  trayId: string;
  locationId: string; // Full location identifier (e.g., "W01-D01-R01-T01")
  warehouseDesc: string | null;
  deviceDesc: string | null;
  trayDesc: string | null;
  trayCapacity: number | null;
  currentCount: number | null;
  productType: string | null;
  bloodType: string | null;
  storageClass: string | null;
  mixAbo: string | null; // "Y" or "N"
  mixProduct: string | null; // "Y" or "N"
}

// ========== Request DTOs ==========

/**
 * Query DTO for filtering/searching quarantine products
 * POST /release-product-quarantine/products
 */
export interface QuarantineProductQueryDto {
  take: number; // Pagination: records to return
  skip: number; // Pagination: records to skip
  quarantineType: string; // "QU" or "RT"
  unitId?: string | null;
  productCode?: string | null;
  bloodType?: string | null;
  warehouseId?: string | null;
  fromDate?: string | null; // ISO 8601 DateTime
  toDate?: string | null; // ISO 8601 DateTime
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null; // "ASC" or "DESC"
}

/**
 * Release Product Request DTO
 * POST /release-product-quarantine/release
 */
export interface ReleaseProductRequestDto {
  quarantineType: string; // "QU" or "RT"
  unitId: string; // 8-character barcode (Codabar 'C' or Code128 'I')
  productCode: string;
  aliquot: string;
  restockFlag: string; // "Y" or "N"
  locationId?: string | null; // Required if restockFlag="Y"
  warehouseId?: string | null; // Required if restockFlag="Y"
  deviceNumber?: string | null; // Required if restockFlag="Y"
  rackNumber?: string | null; // Required if restockFlag="Y"
  trayId?: string | null; // Required if restockFlag="Y"
  rejectCode?: string | null; // Required if restockFlag="N"
}

/**
 * Release Product Response
 * Success response after releasing/restocking/rejecting a product
 */
export interface ReleaseProductResponse {
  unitId: string;
  productCode: string;
  aliquot: string;
}

// ========== Filter & UI Models ==========

/**
 * Filter values for the filter panel
 */
export interface FilterValue {
  productCode?: string | null;
  bloodType?: string | null;
  warehouseId?: string | null;
  fromDate?: Date | null;
  toDate?: Date | null;
}

/**
 * Product Code LOV (List of Values)
 * For filter dropdown
 */
export interface ProductCodeLOV {
  productCode: string;
  productDesc: string | null;
}

/**
 * Blood Type LOV
 * For filter dropdown
 */
export interface BloodTypeLOV {
  bloodType: string;
  aboDesc: string | null;
}

/**
 * Warehouse LOV
 * For filter dropdown
 */
export interface WarehouseLOV {
  warehouseId: string;
  warehouseDesc: string | null;
}

/**
 * Reject Code LOV
 * TODO: Determine if this comes from API or LAB_MASTER_CODES
 */
export interface RejectCodeLOV {
  rejectCode: string;
  rejectDesc: string | null;
}

// ========== API Response Wrappers ==========

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T[];
  totalCount?: number;
  errorCode?: string;
}

/**
 * Single item API response
 */
export interface ApiSingleResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  item?: T;
  errorCode?: string;
}
