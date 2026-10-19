/**
 * Product Type API Response
 * Represents the actual response from the API
 */
export interface ProductTypeApiResponse {
  productType: string;          // Product type code from API
  productTypeDesc: string;      // Product type description
}

/**
 * Product Type Detail DTO
 * Represents a single product type with code and description
 */
export interface ProductTypeDetailDto {
  productTypeCode: string;      // Product type code (max 5 chars)
  productTypeDesc: string;       // Product type description (max 30 chars)
}

/**
 * Bag Code DTO
 */
export interface BagCodeDto {
  bagCode: string;
}

/**
 * Matrix Product Type DTO (from PRODUCT_MATRIX table)
 */
export interface MatrixProductTypeDto {
  bagCode: string;
  setId: number;
  productType: string;
  productTypeDesc: string;
}

/**
 * Product Combination DTO (Response from search endpoint)
 */
export interface ProductCombinationDto {
  bagCode: string;                    // Bag code
  setId: number;                      // Set ID
  productTypes: MatrixProductTypeDto[]; // Array of product types in this combination
}

/**
 * Create Product Combination Request DTO
 * Used when creating a new product combination
 */
export interface CreateProductCombinationRequestDto {
  numberOfBags: number;               // Required: Number of bags (1-15)
  productTypes: string[];             // Required: Array of product type codes
                                      // Length must equal numberOfBags
                                      // No duplicates allowed
                                      // Each must be valid and active
}

/**
 * Product Combination Query DTO (Request - for filtering)
 * All fields are optional for filtering the list
 */
export interface ProductCombinationQueryDto {
  bagCode?: string | null;            // Filter by bag code
  productType?: string | null;        // Filter by product type code
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  totalCount?: number;  // Total record count for paginated responses (legacy)
  total?: number;       // Total record count for search endpoint
}

/**
 * Validation error response (with error code)
 */
export interface ValidationErrorResponse {
  success: false;
  statusCode: 400;
  errorCode: string;
  message: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * UI Table model for displaying product combinations in the data table
 */
export interface ProductCombinationTableModel {
  bagCode: string;                    // Bag code from PRODUCT_MATRIX
  setId: number;                      // Set ID
  bagCount: number;                   // Number of bags (derived from productTypes.length)
  productTypesDisplay: string;        // Comma-separated product type codes for display
  productTypes: ProductTypeDetailDto[]; // Full product type details
}

/**
 * Form value model for Add Product Combination dialog
 */
export interface ProductCombinationFormValue {
  bagCount: number | null;
  productTypes: string[];  // Array of selected product type codes
}

/**
 * Filter value model for filter panel
 */
export interface ProductCombinationFilterValue {
  bagCount?: number | null;
  productType?: string | null;
  description?: string | null;
}

/**
 * Lookup model for dropdowns
 */
export interface LookUp {
  key: string;
  value: string;
}

/**
 * Lookup model with description for enhanced dropdowns
 */
export interface LookUpWithDescription {
  key: string;
  value: string;
  description: string;
}

/**
 * Error code mappings for user-friendly messages
 */
export const ProductCombinationErrorMessages: Record<string, string> = {
  '0069': 'Duplicate product types are not allowed in a combination',
  '0156': 'This product combination already exists',
  '0216': 'Number of bags must be between 1 and 15',
  '1245': 'One or more product types are invalid or inactive'
};

/**
 * Get user-friendly error message from error code
 * @param errorCode The error code from the API
 * @returns User-friendly error message
 */
export function getErrorMessage(errorCode: string): string {
  return ProductCombinationErrorMessages[errorCode] || 'An error occurred. Please try again.';
}
