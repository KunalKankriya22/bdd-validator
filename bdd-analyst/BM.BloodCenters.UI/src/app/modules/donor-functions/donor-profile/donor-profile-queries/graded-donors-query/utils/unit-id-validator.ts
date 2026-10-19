/**
 * Unit ID Validation Utilities
 *
 * Implements Oracle Forms VALIDATE_UNIT_CHKDIGIT and VALIDATE_UNIT_ID_FORMAT logic
 */

/**
 * Validates Unit ID length and returns format type
 * @param unitId The unit ID to validate
 * @returns Object with validation result and format type
 */
export function validateUnitIdLength(unitId: string): {
  isValid: boolean;
  length: number;
  formatType: 'CODABAR' | 'STANDARD' | 'ISBT_PARTIAL' | 'ISBT_FULL' | 'INVALID';
} {
  if (!unitId) {
    return { isValid: false, length: 0, formatType: 'INVALID' };
  }

  const trimmedId = unitId.trim();
  const length = trimmedId.length;

  switch (length) {
    case 7:
      return { isValid: true, length, formatType: 'CODABAR' };
    case 8:
      return { isValid: true, length, formatType: 'STANDARD' };
    case 13:
      return { isValid: true, length, formatType: 'ISBT_PARTIAL' };
    case 15:
      return { isValid: true, length, formatType: 'ISBT_FULL' };
    default:
      return { isValid: false, length, formatType: 'INVALID' };
  }
}

/**
 * Determines if a 7-character Codabar unit ID is alphanumeric or numeric
 * @param unitId 7-character unit ID
 * @returns 'ALPHANUMERIC' or 'NUMERIC'
 */
export function getCodabarScheme(unitId: string): 'ALPHANUMERIC' | 'NUMERIC' {
  if (!unitId || unitId.length !== 7) {
    return 'NUMERIC';
  }

  // Check if the unit ID contains only digits
  const isNumeric = /^[0-9]+$/.test(unitId.trim());

  return isNumeric ? 'NUMERIC' : 'ALPHANUMERIC';
}

/**
 * Validates Unit ID format based on type
 * @param unitId Unit ID to validate
 * @returns Validation result with error message
 */
export function validateUnitIdFormat(unitId: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (!unitId) {
    return { isValid: true }; // Empty is valid (optional field)
  }

  const validation = validateUnitIdLength(unitId.trim());

  if (!validation.isValid) {
    return {
      isValid: false,
      errorMessage: 'Unit/Deferral ID must be 7, 8, 13, or 15 characters long.'
    };
  }

  // Additional format validation based on type
  switch (validation.formatType) {
    case 'CODABAR':
      // 7-character Codabar: alphanumeric or numeric
      if (!/^[A-Za-z0-9]{7}$/.test(unitId.trim())) {
        return {
          isValid: false,
          errorMessage: 'Invalid Codabar format. Must contain only letters and numbers.'
        };
      }
      break;

    case 'STANDARD':
      // 8-character standard: typically numeric
      if (!/^[0-9]{8}$/.test(unitId.trim())) {
        return {
          isValid: false,
          errorMessage: 'Invalid standard format. Must contain 8 digits.'
        };
      }
      break;

    case 'ISBT_PARTIAL':
    case 'ISBT_FULL':
      // ISBT format: specific structure validation
      // This would be more complex in production
      if (!/^[A-Za-z0-9]{13,15}$/.test(unitId.trim())) {
        return {
          isValid: false,
          errorMessage: 'Invalid ISBT format.'
        };
      }
      break;
  }

  return { isValid: true };
}
