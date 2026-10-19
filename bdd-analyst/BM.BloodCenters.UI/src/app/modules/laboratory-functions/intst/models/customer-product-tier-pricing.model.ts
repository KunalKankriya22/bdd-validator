/**
 * Customer Product Tier Pricing Query Models
 * Based on API Documentation: customer-product-tier-pricing-api-documentation.md
 * JIRA Ticket: MLT-14091
 * Mnemonic: INTST
 */

/**
 * Request DTO for querying customer product tier pricing
 * Used for filtering and sorting pricing tier queries
 */
export interface CustomerProductTierPricingQueryDto {
  customerId: string | null;  // max 10 chars
  productType: string | null; // max 5 chars
  sortOrder: 'ASC' | 'DESC' | null;
  skip: number;
  take: number;
}

/**
 * Response DTO - Detailed pricing tier information
 * Returned by /query and /customers/{customerId}/products/{productType}/tiers endpoints
 */
export interface CustomerProductTierPricingDto {
  customerId: string;
  chapterId: string;
  productType: string;
  tier: number;
  fromDay: number;
  toDay: number;
  unitPrice: number | null;
  effectiveDate: string;        // YYYY-MM-DD format
  terminationDate: string | null; // YYYY-MM-DD format
  shortName: string | null;       // Customer short name
  productTypeDesc: string | null; // Product type description
  lifespan: number | null;        // Product lifespan value
  lifespanInd: string | null;     // Lifespan indicator ("Hours", "Days", "Years")
  stdPrice: number | null;        // Standard price for product
}

/**
 * Response DTO - Customer-product combination summaries
 * Returned by /customers endpoint
 * Used for master table display
 */
export interface CustomerProductSummaryDto {
  customerId: string;
  shortName: string;              // Customer short name
  productType: string;
  productTypeDesc: string | null; // Product type description
  lifespan: number | null;        // Product lifespan value
  lifespanInd: string | null;     // Lifespan indicator ("Hours", "Days", "Years")
  stdPrice: number | null;        // Standard price for product (Unit Price column)
}

/**
 * Filter values for the filter panel
 */
export interface TierPricingFilterValue {
  customerId: string | null;
  productType: string | null;
}

/**
 * Filter dropdown option for Customer ID — carries id and display name
 */
export interface CustomerFilterOption {
  id: string;
  name: string;
}

/**
 * Filter dropdown option for Product Type — carries code and description
 */
export interface ProductTypeFilterOption {
  code: string;
  desc: string | null;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total: number;
}
