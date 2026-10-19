/**
 * RbcAntigenProductTypeModel
 * Matches backend LblAgPrintProdTypes entity
 * Table: LBL_AG_PRINT_PROD_TYPES
 * PK: productType (single)
 * NOTE: This table has NO insertUser column
 */
export interface RbcAntigenProductTypeModel {
  productType?: string | null;
  effDate?: string | null;
  termDate?: string | null;
  auditKey?: number | null;
  insertDate?: string | null;
  programId?: string | null;
}

/**
 * Request body for POST /lbl-ag-print-prod-types/list
 * All fields optional - pass null/omit to skip filter
 */
export interface RbcAntigenProductTypeListBody {
  productType?: string | null;
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
export interface RbcAntigenProductTypeFilterValue {
  effectiveDatePeriod: string | null;
  effectiveDate: any | null;
  terminationDatePeriod: string | null;
  terminationDate: any | null;
}

/**
 * Lookup item from GET /lbl-ag-print-prod-types/lookups/product-types
 * Response is a plain array: [{ code, description }]
 */
export interface LookupItem {
  code: string;
  description: string | null;
}

/**
 * DTO for creating a new AG Print Prod Type record
 * POST /lbl-ag-print-prod-types
 */
export interface RbcAntigenProductTypeCreateDto {
  productType: string;
  effDate?: string | null;
  termDate?: string | null;
  loggedInUserName?: string;
}

/**
 * DTO for updating an existing AG Print Prod Type record
 * PUT /lbl-ag-print-prod-types/{productType}
 * Only editable fields in body (no PK)
 */
export interface RbcAntigenProductTypeUpdateDto {
  effDate?: string | null;
  termDate?: string | null;
}
