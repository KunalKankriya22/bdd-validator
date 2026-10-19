/**
 * DaylightSavingsModel
 * Represents a daylight savings time record from the API
 */
export interface DaylightSavingsModel {
  chapterId?: string;
  chapterName?: string;
  startTime?: string; // ISO 8601 format
  endTime?: string; // ISO 8601 format
  timeZone?: string; // Formatted Time Zone (e.g., GMT-05:00)
  timeZoneRegion?: string | null;
  baseOffSet?: string;
  dstOffSet?: number;
}

/**
 * Request DTO for fetching Daylight Savings data
 * POST /api/v1/admin/daylight-savings/{take}/{skip}
 */
export interface DaylightSavingsParamsDto {
  chapterId?: string;
  chapterName?: string;
  timeZone?: string;
  timeZoneRegion?: string;
  dstOffSet?: number;
  searchKeyword?: string;
  sort?: string; // "A" for ascending, "D" for descending
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
export interface DaylightSavingsFilterValue {
  chapterId: string | null;
  chapterName: string | null;
  timeZone: string | null;
  dstOffSet: number | null;
}

/**
 * Filter LOV Model
 * Response from GET /api/v1/admin/daylight-savings-filters
 */
export interface DaylightSavingsFilterLov {
  chapterId?: string[];
  chapterName?: string[];
  timeZone?: string[];
  timeZoneRegion?: string[];
  dstOffSet?: number[]; // Note: API returns with capital S
}

/**
 * Dropdown LOV Model for Add/Edit Form
 * Response from GET /api/v1/admin/daylight-savings-dropdown
 */
export interface DaylightSavingsDropdownLov {
  timeZone?: string[];
  timeZoneRegion?: string[];
}

/**
 * DTO for adding new Daylight Savings record
 * POST /api/v1/admin/daylight-savings
 */
export interface DaylightSavingsDto {
  chapterId: string;
  startTime: string; // ISO 8601 format: "2026-02-10T07:13:32.453Z"
  endTime: string; // ISO 8601 format: "2026-02-10T07:13:32.453Z"
  timeZone: string;
  timeZoneRegion: string;
  baseOffSet: string; // API uses capital S
  dstOffSet: number; // API uses capital S
}

/**
 * DTO for updating existing Daylight Savings record
 * PUT /api/v1/admin/daylight-savings
 */
export interface UpdateDaylightSavingsDto {
  chapterId: string;
  startTime: string; // ISO 8601 format: "2026-02-10T07:13:32.453Z"
  endTime: string; // ISO 8601 format: "2026-02-10T07:13:32.453Z"
  timeZone: string;
  timeZoneRegion: string;
  baseOffSet: string; // API uses capital S
  dstOffSet: number; // API uses capital S
  originalStartTime?: string; // Original start time for WHERE clause in UPDATE
}
