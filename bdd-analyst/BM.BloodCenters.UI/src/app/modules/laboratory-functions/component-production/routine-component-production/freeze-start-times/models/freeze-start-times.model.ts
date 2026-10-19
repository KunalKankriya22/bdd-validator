/**
 * DTOs and interfaces for Freeze Start Times (Offline) feature
 * Based on API documentation: cpifrzm-api-documentation.md
 */

/**
 * Request DTO for recording freeze start time
 * POST /api/v1/freeze-start-times
 */
export interface RecordFreezeStartTimeDto {
  /** Unit/donation identifier (max 13 chars) */
  unitId: string;
  /** Product code (max 8 chars, must be FROZP type) */
  productCode: string;
  /** Aliquot/component number (max 2 chars) */
  aliquot: string;
  /** Freeze start time (ISO 8601 format - will be converted to GMT on server) */
  freezeStartTime: string;
}

/**
 * Response DTO for record freeze start time operation
 * Returned in ApiResponse<FreezeStartTimeResponseDto[]>
 */
export interface FreezeStartTimeResponseDto {
  /** Operation success status */
  success: boolean;
  /** Response message */
  message: string;
  /** Indicates if CMTI (Component Manufacturing Time Interdiction) warning was generated */
  cmtiInterdictionGenerated: boolean;
  /** CMTI warning message (if generated) */
  interdictionMessage: string | null;
}

/**
 * DTO for eligible components that can have freeze time recorded
 * GET /api/v1/freeze-start-times/eligible-components/{unitId}
 */
export interface EligibleComponentDto {
  /** Product code */
  productCode: string;
  /** Product description */
  productDescription: string;
  /** Aliquot number */
  aliquot: string;
}

/**
 * DTO for unit bleed information
 * GET /api/v1/freeze-start-times/unit-info/{unitId}
 */
export interface UnitBleedInfoDto {
  /** Unit identifier */
  unitId: string;
  /** Collection date (ISO 8601) */
  collDate: string;
  /** Bleed start time (ISO 8601, nullable) */
  bleedStartTime: string | null;
  /** Bleed end time (ISO 8601, nullable) */
  bleedEndTime: string | null;
}

/**
 * Display model for table rows
 * Combines selected product info with freeze start time
 */
export interface FreezeStartTimeDisplay {
  /** Unit ID */
  unitId: string;
  /** Collection date formatted for display (DD-MMM-YYYY) */
  collectionDate: string;
  /** Product code */
  productCode: string;
  /** Product description */
  productDescription: string;
  /** Freeze start date and time formatted for display (DD-MMM-YYYY HH:mm) */
  freezeStart: string;
  /** Original freeze start time (for internal use) */
  freezeStartTime?: string;
  /** Aliquot number */
  aliquot: string;
  /** CMTI interdiction flag */
  cmtiInterdictionGenerated?: boolean;
  /** CMTI warning message */
  interdictionMessage?: string | null;
}

/**
 * Product option for dropdown (combines product code and aliquot)
 */
export interface ProductOption {
  /** Display value for dropdown (e.g., "E0701V00 - 01") */
  displayValue: string;
  /** Product code */
  productCode: string;
  /** Product description */
  productDescription: string;
  /** Aliquot number */
  aliquot: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
  errorCode?: string;
}
