/**
 * Error code reference for Components Made from Unit (ISBT) API
 * Based on API documentation dated 2026-06-04
 */

export interface ApiError {
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
  error?: {
    errorCode?: string;
    errorResponse?: {
      errorCode: string;
      error: string;
    };
    message?: string;
  };
  message?: string;
}

/**
 * Complete error codes reference from API documentation
 */
export const ERROR_CODES = {
  // validate-unit errors
  '1245': 'Invalid product type',
  '0063': 'Collection date not present - initial check-in not done',
  'INTR': 'Unit has in-transit interdiction',
  '0095': 'This is a pheresis donation',
  '0065': 'Bleed start/end time missing',
  '0039': 'No bag code recorded',
  '0135': 'Bag count less than 1',
  '0155': 'A component of the same product type has already been made',
  '0137': 'Invalid product matrix combination',

  // determine-product errors
  '9719': 'Invalid catalog number',
  '0041': 'RBC catalog number does not match unit original',
  '0042': 'WB catalog number does not match unit original',
  '9732': 'No core conditions found for this combination',
  '9735': 'No products found for formula',
  '1100': 'Invalid attribute code',
  '0035': 'Attribute not valid for product type',
  '0484': 'Attribute not configured for this form/chapter',
  '9935': 'Intended use code too long',

  // create component errors
  '9728': 'Product verification failed, mismatch in product codes',
  '4317': 'Weight Not Entered',
  '0250': 'A note must be entered',  // Weight out of range
  '0260': 'Whole blood cannot be made after first separation',
  '0083': 'First separation time required (FFP/RPL)',
  '0084': 'First separation time required (RBC/LEUKO)',
  '0138': 'Two separation times required (PLT)',
  '0079': 'FFP cannot have all three separation times',
  '9793': 'PLSM requires existing CRYO component',
  '9741': 'Insufficient information,label cannot be printed',
  '0230': 'Component creation failed (database error)',
  '8010': 'Component successfully added',

  // get-components errors
  '0131': 'No acceptable components have been made from this unit'
} as const;

/**
 * Extracts a formatted error message from API error response
 * Following the pattern from API documentation:
 * - Try errorResponse.error first
 * - Then try message
 * - Fall back to fallback message
 * - Prepend error code if available
 *
 * @param error - API error object
 * @param fallback - Fallback message if error details not found
 * @returns Formatted error message with code (e.g., "Error 0095: This is a pheresis donation")
 */
export function extractErrorMessage(error: ApiError, fallback: string): string {
  let errorMessage = fallback;
  let errorCode = '';

  // Extract error code from multiple possible locations
  if (error?.errorCode) {
    errorCode = error.errorCode;
  } else if (error?.error?.errorCode) {
    errorCode = error.error.errorCode;
  } else if (error?.error?.errorResponse?.errorCode) {
    errorCode = error.error.errorResponse.errorCode;
  }

  // Extract error message from multiple possible locations
  if (error?.errorResponse?.error) {
    errorMessage = error.errorResponse.error;
  } else if (error?.error?.errorResponse?.error) {
    errorMessage = error.error.errorResponse.error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.error?.message) {
    errorMessage = error.error.message;
  }

  // Format with error code if available
  return errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
}

/**
 * Checks if an API error is a validation error that should clear the unit field
 * Based on documentation, these errors require clearing the unit field
 */
export function shouldClearUnitField(errorCode?: string): boolean {
  if (!errorCode) return false;

  const clearOnErrors = [
    '0063',  // Collection date not present
    'INTR',  // In-transit interdiction
    '0095',  // Pheresis donation
    '0065',  // Bleed time missing
    '0039',  // No bag code
    '0135',  // Bag count < 1
    '0155',  // Product type already made
    '0137'   // Invalid product matrix
  ];

  return clearOnErrors.includes(errorCode);
}

/**
 * Checks if weight is required based on product type weightRequired flag
 */
export function isWeightRequired(weightRequired?: string): boolean {
  return weightRequired === 'Y';
}

/**
 * Checks if attributes should be shown based on product type attribFlag
 */
export function shouldShowAttributes(attribFlag?: string): boolean {
  return attribFlag === 'Y';
}

/**
 * Validates weight is in acceptable range (1-999.99)
 */
export function isValidWeight(weight: number | null): boolean {
  if (weight === null || weight === undefined) return false;
  return weight >= 1 && weight <= 999.99;
}

/**
 * Calculates volume from weight and specific gravity
 * Volume = weight / specificGravity
 * Returns null if calculation is not possible
 */
export function calculateVolume(weight: number | null, specificGravity: number | null): number | null {
  if (!weight || !specificGravity || specificGravity === 0) return null;
  return parseFloat((weight / specificGravity).toFixed(2));
}

/**
 * Formats date for API requests (ISO 8601 without timezone)
 * Input: "2011-05-25T00:00:00" or Date object
 * Output: "2011-05-25"
 */
export function formatDateForApi(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

/**
 * Checks if an object has a property (for handling null fields from API)
 * JSON serializer omits null fields, so use 'field' in obj not obj.field !== null
 */
export function hasProperty<T extends object>(obj: T, prop: keyof T): boolean {
  return prop in obj;
}
