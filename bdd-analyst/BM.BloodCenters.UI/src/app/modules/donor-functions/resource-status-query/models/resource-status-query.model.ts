/**
 * Resource Status Query Models
 * Based on FMB Analysis: MRQEXRES
 */


/**
 * Resource availability record displayed in data table
 * Maps to RESOURCE_STAT block in FMB
 */
export interface ResourceStatRecord {
  driveDate: string;          // MM-DD-YYYY DY format (e.g., "03-31-2026 MON")
  resourceCode: string;        // Resource code (5 chars)
  resourceDesc: string;        // Resource description (50 chars)
  maximumRes: number | null;   // Standard resource level by day of week
  exceptionRes: number | null; // Actual available resources
  bookedRes: number | null;    // Already booked resources
  availRes: number | null;     // Remaining = Exception - Booked
  criticalInd: string | null;  // Critical indicator (Y/N)
}

/**
 * Filter panel filter values
 */
export interface ResourceStatusQueryFilterValue {
  criticalInd: string | null;
}

/**
 * Filter request parameters for API
 */
export interface ResourceStatusQueryFilterRequest {
  startDate: string;                    // ISO 8601 format
  endDate: string;                      // ISO 8601 format
  resourceCode?: string;                // Optional resource filter
  searchKeyword?: string;               // Search text
  sort?: string;                        // Sort format: "column_asc" or "column_desc"
  criticalInd?: string;                 // Critical indicator filter
  take?: number;                        // Optional pagination (if API supports)
  skip?: number;                        // Optional pagination (if API supports)
}

/**
 * Resource lookup option for dropdown
 */
export interface ResourceOption {
  resourceCode: string;        // Resource code
  resourceDesc: string;        // Resource description
  criticalInd: string | null;  // Critical indicator (Y/N)
}

/**
 * API response for resource status query
 */
export interface ResourceStatusQueryResponse {
  data: ResourceStatRecord[];
  total: number;
  success: boolean;
}

/**
 * API response for resources dropdown
 */
export interface ResourcesResponse {
  data: ResourceOption[];
  success: boolean;
}
