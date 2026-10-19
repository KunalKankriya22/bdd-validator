/**
 * TypeScript models for Component Attributes API
 * Generated from: product-attributes-api-documentation.md
 * Base URL: /api/component-attributes
 */

/**
 * Component Attribute DTO - Response model
 * Represents a single component attribute record
 */
export interface ComponentAttributeDto {
  unitId: string;
  collDate: string; // DateTime as ISO string
  chapterId: string;
  productCode: string;
  productDescription: string;
  attribGroup: string; // 'ALERT' or 'SP'
  attribCode: string;
  attribDescription: string;
  procDate: string | null; // DateTime as ISO string, nullable
  newExpDate: string | null; // DateTime as ISO string, nullable
  insertDate: string; // DateTime as ISO string
  insertUser: string;
}

/**
 * Create Component Attribute Request DTO
 * Request model for creating new component attribute
 */
export interface CreateComponentAttributeRequestDto {
  unitId: string; // Required, max 13 chars
  collDate: string; // Required, DateTime as ISO string
  productCode: string; // Required, max 8 chars
  attribGroup: string; // Required, max 5 chars, must be 'ALERT' or 'SP'
  attribCode: string; // Required, max 4 chars
  procDate?: string | null; // Conditional - required if life_span defined, DateTime as ISO string
}

/**
 * Component Attribute Query DTO
 * Request model for filtering/searching attributes
 */
export interface ComponentAttributeQueryDto {
  unitId?: string | null;
  productCode?: string | null;
  attribGroup?: string | null;
  attribCode?: string | null;
  fromDate?: string | null; // DateTime as ISO string
  toDate?: string | null; // DateTime as ISO string
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
}

/**
 * Validate Unit Request DTO
 */
export interface ValidateUnitRequestDto {
  unitId: string; // Required
}

/**
 * Validate Unit Response DTO
 */
export interface ValidateUnitResponseDto {
  unitId: string;
  collDate: string; // DateTime as ISO string
  isValid: boolean;
  hasActiveComponents: boolean;
}

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  totalCount?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Dropdown/Lookup models for form fields
 */
export interface ProductDto {
  productCode: string;
  productDescription: string;
}

export interface AttributeGroupDto {
  code: string; // 'ALERT' or 'SP'
  description: string;
}

export interface AttributeCodeDto {
  attribCode: string;
  attribDescription: string;
  attribGroup: string;
  lifeSpan?: number | null; // If set, procDate is required
  lifeSpanInd?: string | null; // D=Days, H=Hours, Y=Years
}

/**
 * Error code constants from API documentation
 */
export const ComponentAttributeErrorCodes = {
  DUPLICATE_ATTRIBUTE: '0030',
  ATTRIBUTE_NOT_VALID_FOR_PRODUCT: '0035',
  UNIT_NOT_FOUND: '0063',
  NO_UNREJECT_COMPONENTS: '0312',
  NOT_IN_ACTIVE_PRODUCTS: '0321',
  INVALID_ATTRIBUTE_CODE: '1100',
  INVALID_ATTRIBUTE_GROUP: '1110',
  PRODUCT_NOT_FOUND: '1205',
  INVALID_SCAN_FORMAT: '1210',
  PROC_DATE_IN_FUTURE: '8030',
  PROC_DATE_BEFORE_COLL_DATE: '8060',
  INVALID_PRODUCT_CODE_LENGTH: '9737',
} as const;
