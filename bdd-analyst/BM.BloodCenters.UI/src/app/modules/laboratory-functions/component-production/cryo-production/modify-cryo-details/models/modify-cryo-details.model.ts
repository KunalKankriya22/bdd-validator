/**
 * Modify CRYO Details Models
 * Maps to CryoModifyDetailsController backend endpoints
 */

/**
 * Response from GET /cryo-modify-details/{unitId}
 * Complete CRYO record with separation details
 */
export interface CryoModifyDetailsDto {
  unitId: string;
  checkDigit: string;
  collDate: string;              // ISO DateTime
  thawMethod: string;
  methodDesc: string;
  thawTemperature: number | null;
  oldProductCode: string;
  newProductCode: string;
  freezeTime: string | null;     // ISO DateTime (LOCAL time from backend)
  cryoOkFlag: string;            // 'Y' or 'N'
  sepInd: number;                // 2 = second separation, 3 = third separation
  sepWeight: number | null;
  centrifugeId: string | null;
  sepTime: string | null;        // ISO DateTime
  catalogNumber: string | null;
  firstSepWeight: number | null;
  secondSepWeight: number | null;
}

/**
 * Request for PUT /cryo-modify-details/{unitId}
 * Update CRYO details (multi-table transaction)
 */
export interface UpdateCryoDetailsRequestDto {
  unitId: string;
  collDate: string;              // ISO DateTime
  thawMethod: string;
  thawTemperature: number | null;
  centrifugeId: string;
  catalogNumber: string;
  freezeTime: string | null;     // ISO DateTime (local time - backend converts to GMT)
  sepTime: string | null;        // ISO DateTime (needed for validation)
  cryoOkFlag: string;            // 'Y' or 'N'
  newProductCode: string;
  sepInd: number;
  sepWeight: number | null;
}

/**
 * Thaw Method LOV from GET /cryo-modify-details/thaw-methods
 */
export interface ThawMethodDto {
  thawMethod: string;
  methodDesc: string;
}

/**
 * Centrifuge LOV from GET /cryo-modify-details/centrifuges
 */
export interface CentrifugeDto {
  centrifugeId: string;
  manufacturer: string;
}

/**
 * Catalog Number LOV from GET /cryo-modify-details/catalog-numbers
 */
export interface CatalogNumberDto {
  catalogNumber: string;
}

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  errorCode?: string;
  errorResponse?: {
    error: string;
    severity: string;
  };
}
