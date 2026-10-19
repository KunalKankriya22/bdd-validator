/**
 * Error code mappings for Internal Contract validation
 * Maps backend error codes to user-friendly messages
 */

export const INTERNAL_CONTRACT_ERROR_CODES: Record<string, string> = {
  // General errors
  '5003': 'Effective date cannot be in the past',
  '5004': 'Termination date must be greater than or equal to effective date',
  '5005': 'Chapter ID must exist in CHAPTERS with active date range',
  '5007': 'Contract type must match pre-set contract type',
  '5008': 'State code is required for domestic addresses',
  '5010': 'Test ID must exist in VALID_TESTS',

  // Contract-specific validation errors
  '5153': 'Tax ID form must be numeric only',
  '5154': 'Barcode protocol must exist in MASTER_CODES (BARCD)',
  '5155': 'For barcode protocol 8, unit ID pattern must be "=" or "&"',
  '5156': 'For other barcode protocols, unit ID pattern must be null',
  '5157': 'EDI input indicator must be "Y" or null',
  '5158': 'Result output indicator must be "R", "B", or "E"',
  '5159': 'Confirm test flag must be "Y" or null',

  // Contact validation errors
  '5161': 'Contact type must be "C" (Contract) or "I" (Institution)',
  '5162': 'Maximum 8 contacts allowed per contract',

  // Test validation errors
  '5163': 'Duplicate test ID within contract - test IDs must be unique',
  '5164': 'Stop label flag must be "Y" or "N"',

  // Default fallback
  'DEFAULT': 'An error occurred while processing your request'
};

/**
 * Get user-friendly error message for error code
 * @param errorCode - Backend error code
 * @returns User-friendly error message
 */
export function getErrorMessage(errorCode: string): string {
  return INTERNAL_CONTRACT_ERROR_CODES[errorCode] || INTERNAL_CONTRACT_ERROR_CODES['DEFAULT'];
}

/**
 * Result output indicator constants
 */
export const RESULT_OUTPUT_OPTIONS = [
  { value: 'R', label: 'R - Regular' },
  { value: 'B', label: 'B - Batch' },
  { value: 'E', label: 'E - Electronic' }
];

/**
 * Stop label flag constants
 */
export const STOP_LABEL_FLAG_OPTIONS = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' }
];

/**
 * Contact type constants
 */
export const CONTACT_TYPE_OPTIONS = [
  { value: 'C', label: 'C - Contract' },
  { value: 'I', label: 'I - Institution' }
];

/**
 * Unit ID pattern options (for protocol 8 only)
 */
export const UNIT_ID_PATTERN_OPTIONS = [
  { value: '=', label: '= (Equals)' },
  { value: '&', label: '& (Ampersand)' }
];
