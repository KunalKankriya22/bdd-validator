/**
 * Standard API response wrapper
 */
export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

/**
 * Lookup dropdown item from GET /lbl-barcode-config/lookups/*
 * Response is a plain array: [{ code, description }]
 */
export interface LookupItem {
  code: string;
  description: string | null;
}

/**
 * BarCodeModel
 * Matches backend model for LBL_BARCODE_CONFIG table row data.
 * PK: barcodeValue + testId + resultCode (composite)
 */
export interface BarCodeModel {
  barcodeValue?: string;
  barcodeDesc?: string | null;
  testId?: string;
  resultCode?: string;
  prioritySeq?: number | null;
  effDate?: string | null;
  termDate?: string | null;
  auditKey?: number;
  insertDate?: string | null;
  insertUser?: string;
  programId?: string;
}

/**
 * Request body for POST /lbl-barcode-config/list
 * All filter fields are optional. Pass null or omit to skip filter.
 */
export interface BarCodeListRequestDto {
  testId?: string | null;
  resultCode?: string | null;
  effDateAfter?: string | null;
  effDateBefore?: string | null;
  termDateAfter?: string | null;
  termDateBefore?: string | null;
  searchKeyword?: string | null;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface BarCodeFilterValue {
  testId: string | null;
  resultCode: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: any | null;
  terminationDatePeriod: string | null;
  terminationDate: any | null;
}

/**
 * DTO for creating a new Bar Code Configuration record
 * POST /lbl-barcode-config
 */
export interface BarCodeCreateDto {
  barcodeValue: string;
  testId: string;
  resultCode: string;
  prioritySeq?: number | null;
  effDate?: string | null;
  termDate?: string | null;
  loggedInUserName?: string;
}

/**
 * DTO for updating an existing Bar Code Configuration record
 * PUT /lbl-barcode-config/{barcodeValue}/{testId}/{resultCode}
 * URL parameters use original values, body contains updated values
 */
export interface BarCodeUpdateDto {
  testId?: string;
  resultCode?: string;
  prioritySeq?: number | null;
  effDate?: string | null;
  termDate?: string | null;
}
