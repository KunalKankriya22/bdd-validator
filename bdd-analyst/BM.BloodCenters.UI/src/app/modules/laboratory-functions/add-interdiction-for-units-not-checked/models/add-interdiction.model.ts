/**
 * TypeScript models for Add Interdiction for Units Not Checked
 * Based on API Documentation: MLT-13316
 */

/**
 * Valid Interdiction LOV Item
 * Response from GET /unit-interdictions/valid-interdictions/{unitId}
 */
export interface ValidInterdiction {
  interCode: string;
  interDesc: string;
  interType: string;
}

/**
 * Unit Exists Check Response
 * Response from GET /unit-interdictions/check-unit-exists/{unitId}
 */
export interface UnitExistsCheck {
  exists: boolean;
  collectionDate: string | null;
  message: string;
}

/**
 * Create Unit Interdiction Request DTO
 * Request body for POST /unit-interdictions/add-not-checked
 */
export interface CreateUnitInterdictionDto {
  unitId: string;
  interCode: string;
}

/**
 * Unit Interdiction Response DTO
 * Response from POST /unit-interdictions/add-not-checked
 */
export interface UnitInterdictionResponse {
  unitId: string;
  interCode: string;
  insertDate: string;
  insertUser: string;
}

/**
 * Added Interdiction Item (for display in table)
 * Combines user input with API response for display purposes
 */
export interface AddedInterdictionItem {
  unitId: string;
  interCode: string;
  interDesc: string;
  interType: string;
  insertDate?: string;
  insertUser?: string;
}

/**
 * API Response Wrapper (Standard format)
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data?: T;
  item?: T;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
