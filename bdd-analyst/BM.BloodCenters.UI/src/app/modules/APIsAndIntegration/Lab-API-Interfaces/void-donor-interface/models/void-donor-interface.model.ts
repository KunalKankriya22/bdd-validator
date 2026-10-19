/**
 * Void Donor Interface Module Models
 * Based on updated API specification
 */

/**
 * Response from GET unit details API
 */
export interface UnitDetailsResponse {
  success: boolean;
  message?: string;
  statusCode: number;
  item: UnitDetail;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Unit detail information
 */
export interface UnitDetail {
  unitId: string;
  collectionDate: string; // ISO 8601 datetime string
  donorToLabInterfacePerformedOn: string | null; // ISO 8601 datetime string or null
}

/**
 * Request to void donor interface
 */
export interface VoidInterfaceRequest {
  unitId: string;
  collectionDate: string; // ISO 8601 datetime string
  confirmed: string; // "Y" or "N"
}

/**
 * Response from POST void interface API
 */
export interface VoidInterfaceResponse {
  success: boolean;
  message?: string;
  statusCode: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * DIN error codes mapping
 */
export enum DinErrorCode {
  INVALID_SCAN_LENGTH = 'DIN 1376',
  COLLECTION_DATE_NOT_PRESENT = 'DIN 5903',
  UNIT_NOT_FOUND = 'DIN 0063',
  TRANSACTION_FAILED = 'DIN 0230',
}
