/**
 * Find Units and Products (FINDU) Models
 * Matches backend DTOs for Find Units and Products Query
 */

/**
 * Unit Product DTO - Response model for search results
 */
export interface UnitProductDto {
  unitId: string; // 13 chars, clickable
  collectionDate: Date | string;
  productCode: string; // 8 chars
  aboRh: string;
  expirationDate?: Date | string | null;
  status: string; // Available | Packed | Allocated | In Lab
  componentPrefix?: string | null; // 2 chars
  checkDigit?: string | null;
}

/**
 * Unit Product Query DTO - Request model for search
 */
export interface UnitProductQueryDto {
  fromDate: string; // YYYY-MM-DD, required
  toDate: string; // YYYY-MM-DD, required, >= fromDate
  productType?: string | null; // max 5 chars
  attributeGroup?: string | null; // max 5 chars
  attributeCode?: string | null; // max 5 chars
  bloodType?: string | null; // max 5 chars
  expired?: string | null; // Y | N | blank
  interdicted?: string | null; // Y | N | blank
  available?: string | null; // Y | N | blank
  labeled?: string | null; // Y | N | blank
  rejected?: string | null; // Y | N | blank
  tested?: string | null; // Y | N | blank
  shipped?: string | null; // Y | N | blank
  take: number; // default 10
  skip: number; // default 0
  sortColumn?: string | null; // UnitId | CollectionDate | ProductCode | ExpirationDate
  sortOrder?: string | null; // ASC | DESC
}

/**
 * Product Type Lookup DTO - Dropdown options
 */
export interface ProductTypeLookupDto {
  productType: string;
}

/**
 * Attribute Group Lookup DTO - Attribute Group dropdown options
 */
export interface AttributeGroupLookupDto {
  attributeGroup: string;
}

/**
 * Attribute Lookup DTO - Attribute Code dropdown options (filtered by group)
 */
export interface AttributeLookupDto {
  attributeGroup: string;
  attributeCode: string;
  description: string;
}

/**
 * Blood Type Lookup DTO - Dropdown options
 */
export interface BloodTypeLookupDto {
  aboCode: string;
  description: string;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface FinduFilterValue {
  fromDate: Date | null;
  toDate: Date | null;
  productType: string | null;
  attributeGroup: string | null;
  attributeCode: AttributeLookupDto | null;
  bloodType: string | null;
  expired: string | null; // Y | N | blank
  interdicted: string | null;
  available: string | null;
  labeled: string | null;
  rejected: string | null;
  tested: string | null;
  shipped: string | null;
}

/**
 * Status-only filter value for the filter panel overlay
 */
export interface StatusFilterValue {
  expired: string | null;
  interdicted: string | null;
  available: string | null;
  labeled: string | null;
  rejected: string | null;
  tested: string | null;
  shipped: string | null;
}

/**
 * Yes/No/Blank option for boolean filters
 */
export interface YesNoBlankOption {
  value: string;
  label: string;
}

/**
 * Sort direction type
 */
export type SortDirection = 'asc' | 'desc' | 'default';

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  totalCount?: number;
}
