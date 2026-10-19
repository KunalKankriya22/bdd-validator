/**
 * Models and interfaces for Verify Component Suitability feature
 * Based on API Documentation: verify-component-suitability-api-documentation.md
 * Generated: 2026-05-21
 * JIRA: MLT-13129
 */

// ===========================
// Response DTOs (from API)
// ===========================

/**
 * Process code dropdown item
 * Endpoint: GET /verify-component-suitability/process-codes
 */
export interface ProcessCodeDto {
  code: string;
  description: string;
}

/**
 * Product type dropdown item
 * Endpoint: GET /verify-component-suitability/product-types
 */
export interface ProductTypeDto {
  productType: string;
  description: string;
}

/**
 * Product code dropdown item (filtered by product type)
 * Endpoint: GET /verify-component-suitability/product-codes?productType=
 */
export interface ProductCodeDto {
  productCode: string;
  productShortName: string;
  productType: string;
}

/**
 * Eligible product dropdown item
 * Endpoint: GET /verify-component-suitability/eligible-products
 */
export interface EligibleProductDto {
  productCode: string;
  description: string;
}

/**
 * Unit eligibility validation response
 * Endpoint: POST /verify-component-suitability/validate-unit
 */
export interface UnitEligibilityDto {
  unitId: string;
  collectionDate: string;
  isEligible: boolean;
  errorMessage: string | null;
}

/**
 * Component details validation response
 * Endpoint: POST /verify-component-suitability/validate-product
 */
export interface ComponentDetailDto {
  unitId: string;
  productCode: string;
  productDescription: string;
  componentPrefix: string | null;
  aboRh: string | null;
  expiryDate: string | null;
  collectionDate: string;
}

/**
 * Special process assignment result
 * Endpoint: POST /verify-component-suitability/assign
 */
export interface WarningDto {
  code: string;
  message: string;
}

export interface SpecialProcessResultDto {
  unitId: string;
  productCode: string;
  productDescription: string;
  aboRh: string | null;
  expiryDate: string | null;
  processCode: string;
  insertDate: string;
  warnings: WarningDto[];
}

// ===========================
// Request DTOs (to API)
// ===========================

/**
 * Validate unit request
 * Endpoint: POST /verify-component-suitability/validate-unit
 */
export interface ValidateUnitRequestDto {
  processCode: string;
  unitId: string;
}

/**
 * Assign special process request
 * Endpoint: POST /verify-component-suitability/assign
 */
export interface AssignSpecialProcessRequestDto {
  processCode: string;
  unitId: string;
  productCode: string;
  componentPrefix?: string;
}

// ===========================
// UI Models (for component state)
// ===========================

/**
 * Scanned component for data table display
 */
export interface ScannedComponentModel {
  unitId: string;
  productCode: string;
  description: string;
  aboRh: string;
  expiryDate: string; // Formatted as DD-MMM-YYYY HH:mm
  componentPrefix: string | null;
  processCode: string;
  status: 'pending' | 'saved' | 'error';
  errorMessage?: string;
}

/**
 * Filter form value for product type/code filtering
 */
export interface FilterFormValue {
  productType: string | null;
  productCode: string | null;
}

// ===========================
// API Response Wrapper
// ===========================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data: T;
  errorCode?: string | null;
  errorResponse?: {
    errorCode: string | null;
    error: string;
  };
}
