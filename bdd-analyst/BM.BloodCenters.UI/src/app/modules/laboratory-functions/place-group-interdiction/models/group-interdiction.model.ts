/**
 * Models for Place Group Interdiction or Hold (MLT-12686)
 * Generated from API documentation: cpinter-api-documentation.md
 */

/**
 * Control mode for grouping units
 */
export type ControlMode = 'BATCH' | 'COLL DATE' | 'DRIVE' | 'TBID' | 'ITBID' | 'LOT';

/**
 * Request DTO for placing group interdictions
 */
export interface PlaceGroupInterdictionRequestDto {
  /** Selection mode: BATCH, COLL DATE, DRIVE, TBID, ITBID, LOT */
  controlMode: ControlMode;
  /** Selection value (required unless controlMode is COLL DATE) */
  selectionValue?: string;
  /** Collection date (required if controlMode is COLL DATE) */
  collectionDate?: string;
  /** List of interdiction codes to place (at least one, no duplicates) */
  interdictionCodes: string[];
}

/**
 * Response DTO for place interdictions result
 */
export interface PlaceGroupInterdictionResultDto {
  /** Control mode used */
  controlMode: string;
  /** Selection value used */
  selectionValue: string;
  /** Total number of interdiction records created */
  interdictionsPlaced: number;
  /** Success message */
  message: string;
}

/**
 * Valid interdiction code DTO
 */
export interface ValidInterdictionDto {
  /** Interdiction code */
  interCode: string;
  /** Interdiction description */
  interDesc: string;
  /** Type: NFT or HOLD */
  interType: string;
}

/**
 * Affected units preview DTO
 */
export interface AffectedUnitsDto {
  /** Unit ID */
  unitId: string;
  /** Collection date */
  collDate?: string;
  /** Check digit */
  chkDigit?: string;
}

/**
 * Drive dropdown DTO
 */
export interface DriveDto {
  /** Drive ID */
  driveId: string;
}

/**
 * Batch dropdown DTO
 */
export interface BatchDto {
  /** Batch ID */
  batchId: string;
}

/**
 * Collection date dropdown DTO
 */
export interface CollectionDateDto {
  /** Collection date (ISO format) */
  collDate: string;
  /** Collection date display format (DD-MON-YYYY) */
  formattedDate: string;
}

/**
 * Lot number dropdown DTO
 */
export interface LotNumberDto {
  /** Lot number */
  lotNumber: string;
}

/**
 * Interdiction table row (for display in main table)
 */
export interface InterdictionDto {
  /** Interdiction code */
  interCode: string;
  /** Interdiction description */
  interDesc: string;
  /** Type: Hold or NFT */
  interType: string;
}

/**
 * Filter values for the filter panel
 */
export interface GroupInterdictionFilterValue {
  interType?: string;
  interCode?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  item?: T;
  data?: T;
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: string;
  message: string;
  error: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
