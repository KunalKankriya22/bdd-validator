/**
 * City, State, and Zip Query Models
 * Generated from API Documentation: city-state-zip-query-api-documentation.md
 * Base URL: /api/v1/valid-city-state
 */

/**
 * Response DTO for city/state/zip records
 * Used in query results and get-by-ID responses
 */
export interface ValidCityStateDto {
  uspsId: number;
  city: string;
  state: string;
  zip: string;
  county?: string | null;
  commonlyUsedFlag?: string | null;
  effectiveDate?: string;
  terminationDate?: string | null;
  placeName?: string | null;
  uspsType?: string | null;
  programId?: string;
  insertDate?: string;
  insertUser?: string;
}

/**
 * Request DTO for creating a new city/state/zip record
 */
export interface CreateValidCityStateDto {
  state: string;
  city: string;
  zip: string;
  county?: string | null;
  commonlyUsedFlag?: string | null;
  effDate: string;
  termDate?: string | null;
}

/**
 * Request DTO for updating an existing city/state/zip record
 * Same fields as CreateValidCityStateDto
 */
export interface UpdateValidCityStateDto extends CreateValidCityStateDto {}

/**
 * Request DTO for querying/filtering city/state/zip records
 */
export interface ValidCityStateQueryDto {
  state?: string;               // Filter by state code (2 chars)
  city?: string;                // Filter by city name (partial match)
  zip?: string;                 // Filter by zip code (exact match)
  county?: string;              // Filter by county name (partial match)
  commonlyUsedFlag?: string;    // Filter by commonly used flag ('Y' or 'N')
  searchKeyword?: string;       // Global search across city, state, zip, county
  sortColumn?: string;          // Column to sort by (city, zip, state, county)
  sortOrder?: string;           // Sort direction (ASC or DESC)
}

/**
 * State dropdown DTO
 */
export interface StateDto {
  code: string;
  description: string;
}

/**
 * City dropdown DTO (matches backend LovItemDto)
 */
export interface CityDto {
  code: string;
  description?: string;
}

/**
 * County dropdown DTO (matches backend LovItemDto)
 */
export interface CountyDto {
  code: string;
  description?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  totalRecords?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Filter values for the filter panel
 */
export interface CityStateZipFilterValue {
  city?: string | null;
  zip?: string | null;
  county?: string | null;
  state?: string | null;
}

/**
 * Request parameters for the query API
 */
export interface CityStateZipQueryParams {
  state?: string;
  city?: string;
  zip?: string;
  county?: string;
  commonlyUsedFlag?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Display model for data table
 * Uses ValidCityStateDto as base
 */
export type CityStateZipQueryModel = ValidCityStateDto;
