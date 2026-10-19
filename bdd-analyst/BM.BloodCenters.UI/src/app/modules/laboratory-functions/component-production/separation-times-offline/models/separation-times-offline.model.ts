/**
 * Separation Times Offline Models
 * Generated from API Documentation: separation-times-offline-api-documentation.md
 */

/**
 * Request DTO for validating a unit
 */
export interface ValidateUnitRequestDto {
  unitId: string;
}

/**
 * Response DTO from unit validation
 */
export interface ValidateUnitResponseDto {
  unitId: string;
  collDate: string;
  bleedStartTime: string | null;
  bleedEndTime: string | null;
  firstSepTime: string | null;
  secondSepTime: string | null;
  canRecordFirst: boolean;
  canRecordSecond: boolean;
  firstSepDuration: string | null;
  secondSepDuration: string | null;
}

/**
 * Request DTO for recording first separation time
 */
export interface RecordFirstSeparationRequestDto {
  unitId: string;
  processDate: string;
  centrifugeId: string;
}

/**
 * Request DTO for recording second separation time
 */
export interface RecordSecondSeparationRequestDto {
  unitId: string;
  processDate: string;
  centrifugeId: string;
}

/**
 * Complete separation times offline DTO
 */
export interface SeparationTimesOfflineDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  bleedStartTime: string | null;
  bleedEndTime: string | null;
  firstSepTime: string | null;
  firstSepCentrifugeId: string | null;
  firstSepDuration: string | null;
  secondSepTime: string | null;
  secondSepCentrifugeId: string | null;
  secondSepDuration: string | null;
  canRecordFirst: boolean;
  canRecordSecond: boolean;
}

/**
 * Centrifuge DTO (matches API CentrifugeDto with CentrifugeId/Manufacturer)
 */
export interface CentrifugeDto {
  centrifugeId: string;
  manufacturer: string | null;
}

/**
 * Entry displayed in the data table
 */
export interface SeparationTimesEntry {
  unitId: string;
  collectionDate: string;
  processDate: string;
  centrifugeId: string;
  firstSeparationTime: string;
  secondSeparationTime: string;
}

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  item?: T;
  data?: T[];
  total?: number;
  errorCode?: string;
  error?: string;
}
