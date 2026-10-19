/**
 * ValidProductSubstitutionModel
 * Model for product substitution data - matches API response
 */
export interface ValidProductSubstitutionModel {
  requestProductType?: string;
  requestProductTypeDescription?: string;
  compatibleProductType?: string;
  compatibleProductTypeDescription?: string;
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
  modificationDate?: Date | null;
}

/**
 * Request DTO for fetching Valid Product Substitution data
 * Dates are serialized as strings (YYYY-MM-DD) for API
 */
export interface ValidProductSubstitutionParamsDto {
  SearchKeyword?: string;
  RequestProductType?: string;
  CompatibleProductType?: string;
  EffectiveDatePeriod?: string;
  EffectiveDate?: string | null;
  TerminationDatePeriod?: string;
  TerminationDate?: string | null;
  Sort?: string;
}

export type SortDirection = 'A' | 'D' | 'default';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface ValidProductSubstitutionFilterValue {
  requestProductType: string | null;
  compatibleProductType: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: Date | null;
  terminationDatePeriod: string | null;
  terminationDate: Date | null;
}

/**
 * Product Type Lookup Model - used for dropdowns with code and description
 * Matches backend DTO: ProductTypesLookupDto
 */
export interface ProductTypeLookup {
  code: string;
  description: string;
}

/**
 * Filter LOV Model - filter options from backend
 */
export interface ValidProductSubstitutionFilterLov {
  requestProductType?: ProductTypeLookup[];
  compatibleProductType?: ProductTypeLookup[];
}

/**
 * DTO for adding new Valid Product Substitution record
 * Dates are serialized as strings (YYYY-MM-DD) for API
 */
export interface ValidProductSubstitutionDto {
  requestProductType: string;
  compatibleProductType: string;
  effectiveDate: string;
  terminationDate?: string | null;
}

/**
 * DTO for updating existing Valid Product Substitution record
 * Dates are serialized as strings (YYYY-MM-DD) for API
 */
export interface UpdateValidProductSubstitutionDto {
  // Original values (to identify the record)
  originalRequestProductType: string;
  originalCompatibleProductType: string;

  // New values
  requestProductType: string;
  compatibleProductType: string;
  effectiveDate: string;
  terminationDate?: string | null;
}
