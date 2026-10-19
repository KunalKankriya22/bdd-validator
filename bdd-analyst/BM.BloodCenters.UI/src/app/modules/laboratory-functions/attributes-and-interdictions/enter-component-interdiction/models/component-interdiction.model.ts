/**
 * Component Interdiction Models
 *
 * DTOs and interfaces for Enter Component Interdiction functionality
 * Based on FMB Analysis: CPICOINT
 */

// ===== REQUEST DTOs =====

/**
 * Request DTO for validating a scanned or manually entered unit ID
 */
export interface ValidateUnitRequest {
  scannedValue: string;      // Max 15 chars - barcode or manual entry
  barcodeScheme: string;     // 'C' for Codabar, 'I' for ISBT128
}

/**
 * Request DTO for validating a scanned or manually entered product code
 */
export interface ValidateProductRequest {
  scannedValue: string;      // Max 8 chars - barcode or product code
  barcodeScheme: string;     // 'C' for Codabar, 'I' for ISBT128
  unitId: string;            // Max 15 chars - validated unit ID
  collectionDate: string;    // ISO 8601 DateTime
}

/**
 * Request DTO for creating a new component interdiction
 */
export interface CreateComponentInterdictionRequest {
  unitId: string;            // Max 15 chars - validated unit ID
  collectionDate: string;    // ISO 8601 DateTime
  productCode: string;       // Max 8 chars - validated product code
  interdictionCode: string;  // Max 4 chars - validated interdiction code
}

// ===== RESPONSE DTOs =====

/**
 * Response DTO from unit validation endpoint
 */
export interface ValidateUnitResponse {
  unitId: string;            // Max 15 chars - validated unit ID
  collectionDate: string;    // ISO 8601 DateTime
  chapterId: string;         // Max 4 chars - chapter/facility ID
  hasComponents: boolean;    // True if unit has valid components
}

/**
 * Response DTO from product validation endpoint
 */
export interface ValidateProductResponse {
  productCode: string;       // Max 8 chars - validated product code
  productDescription: string; // Max 256 chars - product description
}

/**
 * Interdiction option DTO for dropdown list
 */
export interface InterdictionOption {
  code: string;              // Max 4 chars - interdiction code
  description: string;       // Max 50 chars - interdiction description
  type: string;              // "NFT", "Hold", or "Others"
}

/**
 * Response DTO from create component interdiction endpoint
 */
export interface ComponentInterdictionDto {
  unitId: string;                      // Max 15 chars
  checkDigit: string;                  // ISBT check digit (e.g. "F"), empty for Codabar
  collectionDate: string;              // ISO 8601 DateTime
  chapterId: string;                   // Max 4 chars
  productCode: string;                 // Max 8 chars
  productDescription: string;          // Max 256 chars
  interdictionCode: string;            // Max 4 chars
  interdictionDescription: string;     // Max 50 chars
  interdictionType: string;            // "NFT", "Hold", or "Others"
  insertDate: string;                  // ISO 8601 DateTime
  interdictionUserId: string;          // User who applied interdiction
}

/**
 * API Response wrapper (standard response format)
 * Some endpoints return 'item' (single object), others return 'data' (array)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  errorCode?: string;
  item?: T;
  data?: T;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

// ===== TABLE MODELS =====

/**
 * Table row model for displaying interdictions in the data table
 */
export interface ComponentInterdictionTableRow {
  unitId: string;
  checkDigit: string;
  productCode: string;
  productDescription: string;
  interdiction: string;
  interdictionDescription: string;
  type: string;
}



// ===== ERROR CODE MAPPING =====

/**
 * Error code to user-friendly message mapping
 * Based on FMB Error Codes
 */
export const ERROR_MESSAGES: { [key: string]: string } = {
  '0063': 'Unit not found in database',
  '0131': 'Unit has no valid components (may be relabeled or pooled)',
  '0230': 'Record not saved - validation failed or database error',
  '1185': 'Invalid interdiction code - may be inactive, already applied, or user not authorized',
  '1205': 'Invalid product code for this unit',
  '1210': 'Invalid barcode - scheme must be C (Codabar) or I (ISBT128)',
  '8010': 'Record successfully added'
};

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || `An error occurred (Code: ${errorCode})`;
}

// ===== FORM STATE INTERFACE =====

/**
 * Interface for component form state
 */
export interface ComponentInterdictionFormState {
  // Scan fields (password-style concealed in Oracle Forms)
  scannedUnitId: string;
  scannedProductCode: string;

  // Validated fields (populated after validation)
  unitId: string;
  collectionDate: string;
  chapterId: string;
  productCode: string;
  productDescription: string;
  interdictionCode: string;
  interdictionDescription: string;
  interdictionType: string;

  // Barcode scheme
  barcodeScheme: string; // 'C' or 'I'

  // State flags
  isUnitValidated: boolean;
  isProductValidated: boolean;
  isInterdictionValidated: boolean;
}

// ===== VALIDATION CONSTANTS =====

/**
 * Field length constraints from database schema
 */
export const FIELD_LENGTHS = {
  UNIT_ID: 15,
  CHAPTER_ID: 4,
  PRODUCT_CODE: 8,
  INTERDICTION_CODE: 4,
  BARCODE_SCHEME: 1,
  PRODUCT_DESCRIPTION: 256,
  INTERDICTION_DESCRIPTION: 50
};

/**
 * Valid barcode schemes
 */
export const BARCODE_SCHEMES = {
  CODABAR: 'C',
  ISBT128: 'I'
};
