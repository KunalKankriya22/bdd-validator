/**
 * Models and DTOs for Modify Component Weight feature
 * Based on ModifyComponentWeightController.cs
 */

/**
 * Saved entry with timestamp (for session-only temporary storage)
 */
export interface SavedComponentEntry {
  unitId: string;
  productCode: string;
  productDesc: string;
  componentPrefix: string;
  collectionDate: string;
  weight: number;
  volume: number;
  anticoagulantVolume: number | null;
  specificGravity: number;
  savedAt: Date;
}

/**
 * Component weight detail for a specific component
 */
export interface ComponentWeightDetail {
  unitId: string;
  productCode: string;
  productDesc: string;
  componentPrefix: string;
  collectionDate: string;
  weight: number | null;
  volume: number | null;
  anticoagulantVolume: number | null;
  specificGravity: number;
  productType: string;
  poolProductCode?: string;
}

/**
 * Response from GET /units/{unitId} endpoint
 */
export interface ComponentWeightUnitDetailsResponse {
  unitId: string;
  collDate: string;
  chapterId: string;
  contractId: string;
  isPheresisDonation: boolean;
  codeScheme: 'I' | 'C'; // I=ISBT, C=Codabar
  components: ComponentWeightDetail[];
}

/**
 * Component prefix item returned from Codabar LOV API
 */
export interface ComponentPrefixItem {
  componentPrefix: string;
}

/**
 * Product option for dropdown
 */
export interface ProductOption {
  productCode: string;
  productDesc: string;
  productType: string;
  specificGravity: number;
  poolProductCode: string;
}

/**
 * Request DTO for updating component weight
 */
export interface UpdateComponentWeightRequestDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  productCode: string;
  componentPrefix: string;
  componentWeight: number;
  anticoagulantVolume?: number;
  codeScheme?: string;
}

/**
 * Response DTO from update endpoint
 */
export interface UpdateComponentWeightResponseDto {
  success: boolean;
  message: string;
  calculatedVolume?: number;
  interdictionApplied: boolean;
  interdictionCode?: string;
}

/**
 * Error codes from backend (from Oracle Forms ErrorStore)
 */
export enum ComponentWeightErrorCode {
  UNIT_NOT_FOUND = '0063',
  NO_COMPONENTS = '0131',
  COMPONENT_NOT_FOUND = '0151',
  PRODUCT_NOT_FOUND = '1205',
  INVALID_VALUE = '1707',
  INVALID_SCAN = '1210',
  WEIGHT_INVALID = '0250',
  ANTICOAG_VOLUME_ZERO = '0330',
  ANTICOAG_NOT_THREE_DIGITS = '4313',
  ANTICOAG_NOT_WHOLE_NUMBER = '1372',
  VOLUME_OUT_OF_RANGE = '9789',
  UPDATE_SUCCESS = '8010',
  UPDATE_FAILED = '0230',
}

/**
 * Error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<string, string> = {
  [ComponentWeightErrorCode.UNIT_NOT_FOUND]: 'Collection date not present - initial check-in not done',
  [ComponentWeightErrorCode.NO_COMPONENTS]: 'No acceptable components have been made from this unit',
  [ComponentWeightErrorCode.COMPONENT_NOT_FOUND]: 'This component does not exist',
  [ComponentWeightErrorCode.PRODUCT_NOT_FOUND]: 'Invalid product code',
  [ComponentWeightErrorCode.INVALID_VALUE]: 'Invalid number',
  [ComponentWeightErrorCode.INVALID_SCAN]: 'Invalid scanned value',
  [ComponentWeightErrorCode.WEIGHT_INVALID]: 'Weights must be between 1 and 999.99 gms',
  [ComponentWeightErrorCode.ANTICOAG_VOLUME_ZERO]: 'Number must be positive',
  [ComponentWeightErrorCode.ANTICOAG_NOT_THREE_DIGITS]: 'Value Must be an Integer. No decimal or characters are allowed',
  [ComponentWeightErrorCode.ANTICOAG_NOT_WHOLE_NUMBER]: 'This entry must be an integer value. No decimals allowed',
  [ComponentWeightErrorCode.VOLUME_OUT_OF_RANGE]: 'Component has the following interdiction',
  [ComponentWeightErrorCode.UPDATE_SUCCESS]: 'TRANSACTION COMMITTED',
  [ComponentWeightErrorCode.UPDATE_FAILED]: 'Unsuccessful commit... transaction not saved',
};
