/**
 * Day Status Code Model - Response from API
 * Represents a day status code record with all its properties
 */
export interface DayStatusCodeModel {
  status: string;
  description: string;
  resourceCode: string;
  lower: number;
  upper: number | null;
  effectiveDate: Date | null;
  terminationDate: Date | null;
}

/**
 * Day Status Code Parameters DTO - Request filters for API calls
 * Used when querying day status codes with filters and pagination
 */
export interface DayStatusCodeParamsDto {
  searchKeyword?: string;
  resourceCode?: string;
  status?: string;
  effectiveDate?: string;
  effectiveDatePeriod?: string;
  terminationDate?: string;
  terminationDatePeriod?: string;
  sort?: string;            // 'A' | 'D'
}

/**
 * Day Status Filter Value - Internal filter state
 * Used for managing filter panel state in the component
 */
export interface DayStatusFilterValue {
  resourceCode?: string;
  status?: string;
  effectiveDatePeriod?: 'after' | 'before';
  effectiveDate?: Date | null;
  terminationDatePeriod?: 'after' | 'before';
  terminationDate?: Date | null;
}

/**
 * Add Day Status Code DTO - Request body for creating new records
 */
export interface AddDayStatusCodeDto {
  resourceCode: string;
  status: string;
  description: string;
  lower: number;
  upper: number | null;
  effectiveDate: string;
  terminationDate?: string | null;
  chapterId: string;
}

/**
 * Update Day Status Code DTO - Request body for updating existing records
 */
export interface UpdateDayStatusCodeDto {
  resourceCode: string;
  status: string;
  description: string;
  lower: number;
  upper: number | null;
  effectiveDate: string;
  terminationDate?: string | null;
  chapterId: string;
}

/**
 * Day Status Filter LOV (List of Values) - Response from filter options API
 * Contains dropdown options for resource codes and status codes
 */
export interface DayStatusFilterLov {
  resourceCodes: ResourceCodeOption[];
  statusCodes: StatusCodeOption[];
}

/**
 * Resource Code Option - Individual resource code for dropdown
 */
export interface ResourceCodeOption {
  resourceCode: string;
}

/**
 * Status Code Option - Individual status code for dropdown
 */
export interface StatusCodeOption {
  status: string;
}

/**
 * Day Status Codes Response - API response for paginated data
 */
export interface DayStatusCodesResponse {
  data: DayStatusCodeModel[];
  total: number;
}
