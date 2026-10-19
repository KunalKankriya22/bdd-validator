/**
 * Freeze Start Time Models
 * Based on API Documentation: freeze-start-time-api-documentation.md
 */

// ========== Request DTOs ==========

export interface ValidateUnitRequest {
  unitId: string;
  chapterId: string;
}

export interface LookupProductsRequest {
  unitId: string;
  collDate: string;
  chapterId: string;
  codeScheme: string;
}

export interface LookupAliquotsRequest {
  unitId: string;
  collDate: string;
  productCode: string;
  chapterId: string;
}

export interface RecordFreezeRequest {
  unitId: string;
  collDate: string;
  productCode: string;
  aliquot: string;
  chapterId: string;
  freezeStartDateTime: string; // Local datetime in MM-DD-YYYY HH:mm format (e.g., "06-18-2026 14:30")
  insertUser: string;
  programId: string;
}

// ========== Response DTOs ==========

export interface ValidateUnitResponse {
  unitId: string;
  collDate: string;
  bleedStartTime: string | null;
  chapterId: string;
  hasFrozpComponents: boolean;
  codeScheme: string; // I=ISBT, C=Codabar
}

export interface ProductLookup {
  productCode: string;
  productDesc: string;
}

export interface AliquotLookup {
  componentPrefix: string;
}

export interface RecordFreezeResponse {
  unitId: string;
  collDate: string;
  productCode: string;
  aliquot: string;
  processDats: string;
  cmtiGenerated: boolean;
  warningMessage: string | null;
  errorCode?: string; // Added: Error code 9789 for CMTI
}

export interface CheckDuplicateRequest {
  unitId: string;
  collDate: string;
  productCode: string;
  aliquot?: string;
  chapterId: string;
}

export interface CheckDuplicateResponse {
  isDuplicate: boolean;
  errorCode: string | null;
  message: string | null;
}

// ========== Query History DTOs ==========

export interface QueryFreezeHistoryRequest {
  chapterId: string;
  unitId?: string;
  productCode?: string;
  collectionDateFrom?: string;
  collectionDateTo?: string;
  processDateFrom?: string;
  processDateTo?: string;
  pageNumber: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: 'A' | 'D';
}

export interface QueryFreezeHistoryResponse {
  unitId: string;
  collDate: string;
  productCode: string;
  productDesc: string;
  aliquot: string;
  processDats: string;
  insertDats?: string;
  insertUser?: string;
  programId?: string;
}

export interface QueryFreezeHistoryPaginatedResponse {
  records: QueryFreezeHistoryResponse[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ========== UI Models ==========

export interface FreezeEntry {
  unitId: string;
  collDate: string;
  productCode: string;
  productDesc: string;
  freezeStart: string;
}

export interface FormData {
  unitId: string;
  collDate: string | null;
  productCode: string;
  productDesc: string;
  freezeStart: string | null;
}

// ========== Error Codes ==========

export enum FreezeErrorCode {
  COLLECTION_DATE_NULL = '0063',
  UNIT_NOT_FOUND = '0210',
  DUPLICATE_FREEZE_ENTRY = '0375',
  NO_VALID_COMPONENT = '0376',
  COMPONENT_NOT_FOUND = '0377',
  PRODUCT_NOT_ELIGIBLE = '0379',
  CMTI_GENERATED = '9789', // Added: CMTI interdiction error code
}
