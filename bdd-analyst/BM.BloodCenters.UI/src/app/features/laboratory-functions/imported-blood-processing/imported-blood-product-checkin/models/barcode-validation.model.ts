/**
 * Barcode Validation Models
 * Based on API documentation: imported-blood-checkin-api-documentation.md
 */

/**
 * Validate unit ID barcode request
 */
export interface ValidateUnitIdDto {
  scannedValue: string;
  barcodeProtocol: '8' | 'X' | 'C'; // 8/X=ISBT 128, C=Codabar
  scanType: 'Unit' | 'Product';
}

/**
 * Validate product code barcode request
 */
export interface ValidateProductCodeDto {
  scannedValue: string;
  barcodeProtocol: string; // Contract protocol: 8/X/I=ISBT, C=Codabar, A=Alpha, N=Numeric
}

/**
 * Barcode validation response
 */
export interface BarcodeValidationResponse {
  success: boolean;
  parsedValue?: string; // The parsed/validated value
  errorMessage?: string;
}

/**
 * ISBT 128 barcode format constants
 */
export const ISBT_128_FORMAT = {
  UNIT_ID_LENGTH: 13, // =<EEEESSSSSSSSC (Entity + Serial + Check)
  PRODUCT_CODE_LENGTH: 13, // =%EEEEPPPPPPPPC (Entity + Product + Check)
  UNIT_PREFIX: '=',
  PRODUCT_PREFIX: '=%',
  ENTITY_LENGTH: 4,
  SERIAL_LENGTH: 8,
  PRODUCT_LENGTH: 8,
  CHECK_DIGIT_LENGTH: 1
};

/**
 * Barcode protocol types
 */
export type BarcodeProtocol = '8' | 'X' | 'C';
export const BARCODE_PROTOCOL_LABELS: Record<BarcodeProtocol, string> = {
  '8': 'ISBT 128',
  'X': 'ISBT 128 (Extended)',
  'C': 'Codabar'
};
