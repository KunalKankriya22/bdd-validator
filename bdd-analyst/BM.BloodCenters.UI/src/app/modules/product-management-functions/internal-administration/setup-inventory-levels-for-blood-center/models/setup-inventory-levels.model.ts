// Models for Setup Inventory Levels for Blood Center

/**
 * Set Inventory Level DTO - Response model
 */
export interface SetInventoryLevelDto {
  chapterId: string;
  customerId: string;
  inventoryClass: string;
  inventoryType: string;
  inventoryTypeDesc?: string;
  productType: string;
  productTypeDesc?: string;
  bloodType: string | null;
  bloodTypeDesc?: string;
  attribGroup: string | null;
  attribCode: string | null;
  attribDesc?: string | null;
  tier?: number | null;
  qty: number;
  minQty?: number | null;
  optQty?: number | null;
  effDate: string; // ISO 8601 format
  termDate: string | null; // ISO 8601 format
  lastModifiedDate: string | null; // ISO 8601 format
}

/**
 * Create Set Inventory Level DTO - Create request (Single Mode)
 */
export interface CreateSetInventoryLevelDto {
  inventoryType: string; // "MI" or "OP"
  productType: string;
  bloodType: string | null;
  attribGroup?: string | null;
  attribCode?: string | null;
  qty: number; // Single quantity value
  effDate: string; // ISO 8601 format
  termDate?: string | null; // ISO 8601 format
}

/**
 * Update Set Inventory Level DTO - Update request
 * Single-Mode: Use qty
 * Dual-Mode: Use minQty and optQty
 */
export interface UpdateSetInventoryLevelDto {
  qty?: number; // For single-mode updates (MI or OP)
  minQty?: number; // For dual-mode updates
  optQty?: number; // For dual-mode updates
  effDate: string; // ISO 8601 format - required in body
  termDate?: string | null; // ISO 8601 format
  bloodType?: string | null; // Can be updated
  attribGroup?: string | null; // Can be updated
  attribCode?: string | null; // Can be updated
}

/**
 * Set Inventory Level Query DTO - Filter/search query
 */
export interface SetInventoryLevelQueryDto {
  inventoryType?: string | null;
  productType?: string | null;
  bloodType?: string | null;
  attribGroup?: string | null;
  attribCode?: string | null;
  searchKeyword?: string | null;
  effectiveDatePeriod?: string | null;
  effectiveDate?: string | null;
  terminationDatePeriod?: string | null;
  terminationDate?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
}

/**
 * Filter Value - Applied filters from filter panel
 */
export interface FilterValue {
  inventoryLevel?: string | null;
  productType?: string | null;
  aborh?: string | null;
  attribute?: string | null;
  effectiveDatePeriod?: 'After' | 'Before' | null;
  effectiveDate?: string | null;
  terminationDatePeriod?: 'After' | 'Before' | null;
  terminationDate?: string | null;
}

/**
 * LOV Models
 */
export interface InventoryClassLOV {
  code: string;
  codeDesc: string;
}

export interface InventoryTypeLOV {
  code: string;
  codeDesc: string;
}

export interface ProductTypeLOV {
  productType: string;
  productTypeDesc: string;
}

export interface BloodTypeLOV {
  aboCode: string;
  aboDesc: string;
}

export interface AttributeGroupLOV {
  attribGroup: string;
}

export interface AttributeCodeLOV {
  attribCode: string;
  attribDesc: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  statusCode: number;
  data: T;
  totalCount?: number;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string | null;
  errorResponse: {
    errorCode: string;
    error: string;
  } | null;
  message: string | null;
}

/**
 * Display model for table (with formatted dates)
 */
export interface SetInventoryLevelDisplay extends SetInventoryLevelDto {
  bloodTypeDesc?: string;
  productTypeDesc?: string;
  inventoryTypeDesc?: string;
  effDateDisplay: string; // DD-MON-YYYY
  termDateDisplay: string | null; // DD-MON-YYYY
  lastModifiedDateDisplay: string | null; // DD-MON-YYYY, HH:MM PST
}
