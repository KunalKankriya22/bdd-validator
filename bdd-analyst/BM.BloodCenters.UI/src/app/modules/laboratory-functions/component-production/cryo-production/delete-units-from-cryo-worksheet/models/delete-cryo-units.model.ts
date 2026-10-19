/**
 * Models for Delete Units from CRYO Worksheet (DELCRYO)
 * Backend API: cryo-worksheet-units
 */

/**
 * Worksheet LOV item (from GET /worksheets endpoint)
 */
export interface CryoWorksheetLovDto {
  cryoWorksheetId: string;
  worksheetDate: string; // ISO 8601 date
  unitCount: number;
  locationId: string;
}

/**
 * Response from GET /worksheets/{take}/{skip}
 */
export interface CryoWorksheetLovResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: CryoWorksheetLovDto[];
  totalCount: number;
}

/**
 * Unit entry in CRYO worksheet (from GET /{worksheetId} endpoint)
 * Backend response field names
 */
export interface CryoUnitDto {
  unitId: string;
  productCode: string;
  productDescription: string;
  bloodGroup: string;
  rh: string;
  collDate: string; // ISO 8601 date - Backend field name
  expirationDate: string; // ISO 8601 date
  status: string;
}

/**
 * Response from GET /{worksheetId}/{take}/{skip}
 */
export interface CryoUnitsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: CryoUnitDto[];
  totalCount: number;
}

/**
 * Request to delete selected units from CRYO worksheet
 */
export interface DeleteCryoUnitsRequest {
  cryoWorksheetId: string;
  unitIds: string[];
}

/**
 * Error response structure from backend
 */
export interface ErrorResponse {
  ErrorCode: string;
  Error: string;
}

/**
 * Response from DELETE /cryo-worksheet-units
 */
export interface DeleteCryoUnitsResponse {
  success: boolean;
  message: string;
  errorCode?: string;
  statusCode: number;
  errorResponse?: ErrorResponse;
}

/**
 * Frontend display model for worksheet units table
 */
export interface CryoWorksheetUnit {
  sequence: number;
  unitId: string;
  productCode: string;
  productDescription: string;
  bloodGroup: string;
  rh: string;
  collectionDate: string; // DD-MON-YYYY format for display
  expirationDate: string; // DD-MON-YYYY format for display
  status: string;
}
