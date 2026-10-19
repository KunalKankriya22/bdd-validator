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
 * Lookup dropdown item from GET /lbl-product-type-config/lookups/*
 * Response is a plain array: [{ code, description }]
 */
export interface LookupItem {
  code: string;
  description: string | null;
}

/**
 * ProductTypePrioritizationModel
 * Matches backend model for LBL_PRODUCT_TYPE_CONFIG table row data.
 * PK: productType + barcodeValue (composite)
 */
export interface ProductTypePrioritizationModel {
  productType?: string;
  barcodeValue?: string;
  prioritySeq?: number | null;
  effDate?: string | null;
  termDate?: string | null;
  auditKey?: number;
  insertDate?: string | null;
  insertUser?: string;
  programId?: string;
}

/**
 * Request body for POST /lbl-product-type-config/list
 * All filter fields are optional. Pass null or omit to skip filter.
 */
export interface ProductTypePrioritizationListRequestDto {
  productType?: string | null;
  barcodeValue?: string | null;
  effDateAfter?: string | null;
  effDateBefore?: string | null;
  termDateAfter?: string | null;
  termDateBefore?: string | null;
  searchKeyword?: string | null;
  sort?: string | null;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface ProductTypePrioritizationFilterValue {
  productType: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: any | null;
  terminationDatePeriod: string | null;
  terminationDate: any | null;
}

/**
 * DTO for creating a new Product Type Prioritization record
 * POST /lbl-product-type-config
 */
export interface ProductTypePrioritizationCreateDto {
  productType: string;
  barcodeValue: string;
  prioritySeq?: number | null;
  effDate?: string | null;
  termDate?: string | null;
  shiftPriorities?: boolean;
  loggedInUserName?: string;
}

/**
 * DTO for updating an existing Product Type Prioritization record
 * PUT /lbl-product-type-config/{productType}/{barcodeValue}
 * URL parameters use original PK values to identify the record
 * Body contains editable fields including updated barcodeValue
 */
export interface ProductTypePrioritizationUpdateDto {
  barcodeValue?: string;
  prioritySeq?: number | null;
  effDate?: string | null;
  termDate?: string | null;
  shiftPriorities?: boolean;
}
