/**
 * Standard Tier Pricing Models
 *
 * These models are derived from the API documentation for the
 * Standard Tier Pricing module (MLT-14180).
 *
 * API Base URL: /api/v1/standard-tier-pricing
 */

/**
 * Standard Tier Pricing Data Transfer Object (Response)
 * Used for displaying tier pricing records in the table
 */
export interface StandardTierPricingDto {
  productType: string;          // Product type code (max 5 chars)
  tier: number;                  // Tier number (NUMBER(4))
  fromDay: number;               // Minimum days to expiration (NUMBER(4))
  toDay: number;                 // Maximum days to expiration (NUMBER(4))
  unitPrice: number | null;      // Per unit price (NUMBER(11,2), nullable)
  effDate: string;               // Effective date (ISO 8601 format)
  termDate: string | null;       // Termination date (ISO 8601 format, nullable)
  lastModifiedDate: string | null; // Last modification timestamp
  chapterId: string;             // Chapter ID
  customerId: string;            // Customer ID (always 'STANDARD' for this API)
}

/**
 * Query DTO for filtering and searching tier pricing records
 * Used in POST /standard-tier-pricing/{take}/{skip}
 */
export interface StandardTierPricingQueryDto {
  productType?: string | null;
  unitPriceComparison?: 'below' | 'above' | null;
  unitPrice?: number | null;
  effectiveDatePeriod?: 'after' | 'before' | null;
  effectiveDate?: string | null;
  terminationDatePeriod?: 'after' | 'before' | null;
  terminationDate?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Create DTO for adding a new tier pricing record
 * Used in POST /standard-tier-pricing
 */
export interface CreateStandardTierPricingDto {
  productType: string;           // Required, max 5 chars, must exist in VSERV_PRODUCT_TYPES
  tier: number;                  // Required, positive number
  fromDay: number;               // Required, > 0, < lifeSpan, < toDay, no overlap
  toDay: number;                 // Required, <= lifeSpan, >= fromDay, no overlap
  unitPrice: number | null;      // Optional, format: $999999.99
  effDate: string;               // Required, not in past (YYYY-MM-DD format)
  termDate: string | null;       // Optional, >= effDate (YYYY-MM-DD format)
}

/**
 * Update DTO for modifying an existing tier pricing record
 * Used in PUT /standard-tier-pricing/{productType}/{tier}
 *
 * Note: Updating fromDay/toDay cascades to customer-specific pricing
 */
export interface UpdateStandardTierPricingDto {
  fromDay: number;               // Required, > 0, < lifeSpan, < toDay, no overlap
  toDay: number;                 // Required, <= lifeSpan, >= fromDay, no overlap
  unitPrice: number | null;      // Optional, format: $999999.99
  effDate: string;               // Required (YYYY-MM-DD format)
  termDate: string | null;       // Optional, >= effDate (YYYY-MM-DD format)
}

/**
 * Product Type DTO (Response)
 * Used for product dropdown/LOV selection
 * Returned from GET /standard-tier-pricing/products
 */
export interface ProductTypeDto {
  productType: string;           // Product type code
  productTypeDesc: string;       // Product description
  lifeSpan: number | null;       // Product lifespan value
  lifeSpanInd: string;           // Lifespan indicator (HR=Hours, DY=Days, YR=Years)
  stdPrice: number | null;       // Standard price
}

/**
 * Filter state for the filter panel
 * Used for client-side filtering (if applicable)
 */
export interface StandardTierPricingFilter {
  unitPriceComparison?: 'below' | 'above' | null;
  unitPrice?: number | null;
  effectiveDatePeriod?: 'after' | 'before' | null;
  effectiveDate?: string | null;
  terminationDatePeriod?: 'after' | 'before' | null;
  terminationDate?: string | null;
}

/**
 * API Error Response Structure
 * Standard error format from backend
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * API Success Response Structure
 * Generic success response wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data?: T;
  totalCount?: number;
}

/**
 * Error code mappings for user-friendly messages
 */
export const StandardTierPricingErrorMessages: Record<string, string> = {
  '0322': 'Invalid product type',
  '0500': 'Termination date cannot be before effective date',
  '0501': 'Effective date cannot be before today',
  '7315': 'Minimum days overlap another defined tier',
  '7316': 'Maximum days overlap another defined tier',
  '7317': 'Tier encompasses another tier\'s definition',
  '7318': 'Tier is already defined for this product',
  '7500': 'Minimum days must be less than life span of the product',
  '7501': 'Maximum days cannot be greater than life span of the product',
  '7502': 'Maximum days cannot be less than minimum days'
};
