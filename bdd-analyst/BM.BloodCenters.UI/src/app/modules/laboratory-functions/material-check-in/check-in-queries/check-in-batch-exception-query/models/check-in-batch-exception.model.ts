/**
 * Check-In Batch Exception Query Models
 * Based on API documentation: check-in-batch-exception-query-api-documentation.md
 */

/**
 * Exception types returned by the API
 */
export type ExceptionType = 'MISSING_DATA' | 'HAS_ATTRIB_14';

/**
 * Check-In Batch Exception DTO
 * Represents a unit with exceptions in a check-in batch
 */
export interface CheckInBatchExceptionDto {
  unitId: string;
  chkDigit: string | null;
  collDate: string | null;
  donorDecisionCode: string | null;
  catalogNumber: string | null;
  driveId: string | null;
  groupSiteId: string | null;
  redTubeFlag: string | null;
  redTube2: string | null;
  purpleTubeFlag: string | null;
  serumPlasmaInd: string | null;
  bleedStartTime: string | null;
  bleedEndTime: string | null;
  qcCheckinDate: string | null;
  exceptionType: ExceptionType | null;
}

/**
 * Unit Attribute DTO
 * Represents an attribute assigned to a unit
 */
export interface UnitAttributeDto {
  attributeGroup: string;
  groupDescription: string | null;
  attributeCode: string;
  codeDescription: string | null;
}

/**
 * Valid Batch DTO
 * Represents a valid check-in batch for autocomplete
 */
export interface ValidBatchDto {
  batchId: string;
  insertDate: string | null;
}

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  total?: number;
}

/**
 * Batch Exception Query Response
 */
export type BatchExceptionResponse = ApiResponse<CheckInBatchExceptionDto[]>;

/**
 * Unit Attributes Query Response
 */
export type UnitAttributesResponse = ApiResponse<UnitAttributeDto[]>;

/**
 * Valid Batches Query Response
 */
export type ValidBatchesResponse = ApiResponse<ValidBatchDto[]>;

/**
 * Search criteria for filtering results
 */
export interface SearchCriteria {
  batchId: string;
}

/**
 * Display models for formatted data
 */
export interface CheckInBatchExceptionDisplay extends CheckInBatchExceptionDto {
  collDateDisplay?: string;
  bleedStartTimeDisplay?: string;
  bleedEndTimeDisplay?: string;
  qcCheckinDateDisplay?: string;
  cueDisplay?: string;
}
