/**
 * Models for Products with Antigens Query (PAGQ)
 * Maps to API documentation for /api/products-with-antigens
 */

// ============================================================================
// Request DTOs
// ============================================================================

export interface AntigenCriteriaPair {
  antigenId: string;
  result: 'P' | 'N';
}

export interface ProductAntigenSearchRequest {
  productType: string;
  aboRh?: string | null;
  inventoryClass?: string | null;
  antigenGroup?: string | null;
  warehouseId?: string | null;
  antigenCriteria?: AntigenCriteriaPair[];
  take?: number;
  skip?: number;
  sortColumn?: 'UnitId' | 'ExpirationDate' | 'ProductCode' | null;
  sortOrder?: 'ASC' | 'DESC' | null;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface UnitAntigenDetail {
  antigenId: string;
  antigenDescription: string;
  result: string;
  confirmed?: string | null;
}

export interface ProductAntigenSearchResult {
  unitId: string;
  checkDigit?: string | null;
  productCode: string;
  aboRhType: string;
  expirationDate?: string | null;
  warehouseId: string;
  antigenProfile: UnitAntigenDetail[];
}

export interface ProductAntigenSearchResponse {
  results: ProductAntigenSearchResult[];
  totalCount: number;
  pageSize: number;
  offset: number;
}

// ============================================================================
// Dropdown/Lookup DTOs
// ============================================================================

export interface ProductTypeOption {
  productType: string;
  description: string;
}

export interface AboRhTypeOption {
  aboCode: string;
  aboDescription: string;
}

export interface InventoryClassOption {
  code: string;
  description: string;
}

export interface AntigenGroupOption {
  code: string;
  description: string;
  isRarityMatrix: boolean;
}

export interface WarehouseOption {
  code: string;
  description: string;
}

export interface ValidAntigenOption {
  testId: string;
  testDescription: string;
  testGroup: string | null;
}

export interface AntigenGroupDetail {
  groupCode: string;
  groupDescription: string;
  antigens: {
    antigenId: string;
    result: string;
  }[];
}

// ============================================================================
// API Response Envelope (based on existing codebase pattern)
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success?: boolean;
  statusCode?: number;
  message?: string;
  total?: number;
}

// ============================================================================
// Component/UI Models
// ============================================================================

export interface AntigenCriteriaFormRow {
  antigenId: string;
  result: string;
}

export interface SearchFormValue {
  productType: string;
  aboRh: string | null;
  inventoryClass: string | null;
  antigenGroup: string | null;
  warehouseId: string | null;
  antigenCriteria: AntigenCriteriaFormRow[];
}

export interface TablePaginationConfig {
  pageSize: number;
  pageIndex: number;
  totalRecords: number;
  pageSizeOptions: number[];
}

export interface TableSortConfig {
  column: string | null;
  direction: 'ASC' | 'DESC' | null;
}
