/**
 * Release Component Hold - Data Models
 * MLT-13694: Release Component Hold functionality
 */

/**
 * Component Hold (Interdiction) row in the table
 */
export interface ComponentHoldRow {
  unitId: string;
  collectionDate: string; // ISO date string
  chapterId: string;
  productCode: string;
  interdictionCode: string;
  interdictionDescription: string;
  selected: boolean; // For checkbox selection
}

/**
 * Request to retrieve component holds
 * Note: chapterId is populated from user context by backend (not sent in request)
 */
export interface RetrieveComponentHoldsRequest {
  unitId: string;
  collectionDate: string; // ISO date string
  chapterId: string; // Kept in interface for response mapping, but not sent to backend
  productCode: string;
  searchKeyword?: string; // Optional search filter for interdiction code/description
}

/**
 * Response from retrieve component holds API
 */
export interface RetrieveComponentHoldsResponse {
  unitId: string;
  collectionDate: string;
  chapterId: string;
  productCode: string;
  productDescription: string;
  holds: ComponentHold[];
}

/**
 * Component Hold (Interdiction) details
 */
export interface ComponentHold {
  interdictionCode: string;
  interdictionDescription: string;
}

/**
 * Request to release selected holds
 * Note: chapterId is populated from user context by backend (not sent in request)
 */
export interface ReleaseHoldsRequest {
  unitId: string;
  collectionDate: string; // ISO date string
  chapterId: string; // Kept in interface for internal tracking, but not sent to backend
  productCode: string;
  interdictionCodes: string[]; // Selected interdiction codes to release
}

/**
 * Response from release holds API
 */
export interface ReleaseHoldsResponse {
  success: boolean;
  message: string;
  releasedCount: number;
}

/**
 * Product option for dropdown
 */
export interface ProductOption {
  productCode: string;
  productDescription: string;
}

/**
 * Unit validation response
 */
export interface UnitData {
  unitId: string;
  collectionDate: string; // ISO date string
  chapterId: string;
  availableProducts: ProductOption[];
}

/**
 * Form state for the component
 */
export interface ReleaseComponentHoldFormState {
  unitId: string;
  collectionDate: string;
  chapterId: string;
  productCode: string;
  productDescription: string;
  isUnitValidated: boolean;
  isProductValidated: boolean;
}

/**
 * Field length constraints (from database)
 */
export const FIELD_LENGTHS = {
  UNIT_ID: 15,
  PRODUCT_CODE: 8,
  INTERDICTION_CODE: 4
} as const;

/**
 * Error code mappings from Oracle Forms
 */
export const ERROR_CODES = {
  UNIT_NOT_FOUND: '0210',
  COLLECTION_DATE_NOT_FOUND: '0063',
  NO_HOLDS_FOUND: '0196',
  INVALID_PRODUCT_CODE: '0066',
  INVALID_SELECTION: '0077',
  SUCCESS: '8010',
  TRANSACTION_FAILED: '0230',
  INTERDICTION_DESC_NOT_FOUND: '0100'
} as const;

/**
 * Get user-friendly error message by error code
 */
export function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    [ERROR_CODES.UNIT_NOT_FOUND]: 'Unit ID not found',
    [ERROR_CODES.COLLECTION_DATE_NOT_FOUND]: 'Collection date not found for this unit',
    [ERROR_CODES.NO_HOLDS_FOUND]: 'No holds found for this unit or product',
    [ERROR_CODES.INVALID_PRODUCT_CODE]: 'Product code is invalid for this unit',
    [ERROR_CODES.INVALID_SELECTION]: 'Invalid selection - at least one hold must be selected',
    [ERROR_CODES.SUCCESS]: 'Holds released successfully',
    [ERROR_CODES.TRANSACTION_FAILED]: 'Transaction failed - changes have been rolled back',
    [ERROR_CODES.INTERDICTION_DESC_NOT_FOUND]: 'Interdiction description not found'
  };
  return messages[errorCode] || 'An error occurred';
}
