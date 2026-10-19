/**
 * Models for Scan Units for CRYO Processing (CRYO1)
 * Based on actual backend API from PR #1401
 */

/**
 * Worksheet DTO - matches CryoWorksheetDto from backend
 */
export interface CryoWorksheetDto {
  cryoWorksheetId: string;
  insertDats: Date;
  totalUnits: number;
  processedUnits: number;
  unprocessedUnits: number;
}

/**
 * Unit DTO - matches CryoUnitDto from backend
 */
export interface CryoUnitDto {
  unitId: string;
  chapterId: string;
  collDate: Date;
  cryoWorksheetId: string | null;
  worksheetSeqNo: number | null;
  prodCode: string | null;
  aboDesc: string | null;
  productDesc: string | null;
  thawMethod: string | null;
  insertDats: Date;
}

/**
 * Component DTO - matches CryoComponentDto from backend
 */
export interface CryoComponentDto {
  productCode: string;
  productDesc: string;
}

/**
 * Request DTO for adding unit to worksheet - matches AddCryoUnitRequestDto
 */
export interface AddCryoUnitRequestDto {
  unitId: string;
  prodCode: string;
  cryoWorksheetId?: string;
  overrideInterdiction?: boolean;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  errorCode: string;
  error: string;
}

/**
 * Backend ReturnResult wrapper
 */
export interface ReturnResult<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data?: T | T[];
  errorResponse?: ErrorResponse;
}
