/**
 * Generic API Response Wrapper
 */
export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T[] | null;
  total: number;
}

/**
 * ValidFfFlagModel
 * Represents a Valid FF Flag value record from the API
 */
export interface ValidFfFlagModel {
  chapterID?: string;
  collectionFacilityId?: string;
  sourceType?: string;
  ffFlagValue?: string;
  effectiveDate?: string; // ISO 8601 format
  terminationDate?: string; // ISO 8601 format
  modificationDate?: string; // ISO 8601 format
}

/**
 * Request DTO for fetching Valid FF Flag data
 * POST /api/v1/admin/valid-ff-values
 */
export interface ValidFfFlagParamsDto {
  searchKeyword?: string;
  collectionFacilityId?: string;
  sourceType?: string;
  ffFlagValue?: string;
  effectiveDatePeriod?: string; // "After" or "Before"
  effectiveDate?: string; // ISO 8601 format
  terminationDatePeriod?: string; // "After" or "Before"
  terminationDate?: string; // ISO 8601 format
  sort?: string; // "A" for ascending, "D" for descending
}

export type SortDirection = 'A' | 'D' | 'default';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface ValidFfFlagFilterValue {
  chapterId: string | null;
  collectionFacilityId: string | null;
  collectionFacilityIdDisplay?: string | null;
  sourceType: string | null;
  sourceTypeDisplay?: string | null;
  ffFlagValue: string | null;
  ffFlagValueDisplay?: string | null;
  effectivePeriod: string | null;
  effectiveDate: string | null;
  terminationPeriod: string | null;
  terminationDate: string | null;
}

/**
 * Key-value pair for dropdown options
 */
export interface DropdownOption {
  key: string;
  value: string;
}

/**
 * Filter LOV Model
 * Response from GET /api/v1/admin/valid-ff-values/filter-dropdown
 */
export interface ValidFfFlagFilterLov {
  chapterId?: DropdownOption[];
  collectionFacilityId?: DropdownOption[];
  sourceType?: DropdownOption[];
  ffFlagValue?: DropdownOption[];
}

/**
 * DTO for adding new Valid FF Flag record
 * POST /api/v1/admin/valid-ff-values/create
 */
export interface ValidFfFlagDto {
  chapterID: string;
  collectionFacilityId: string;
  sourceType: string;
  ffFlagValue: string;
  effectiveDate: string; // ISO 8601 format: "2026-02-10T07:13:32.453Z"
  terminationDate?: string; // ISO 8601 format: "2026-02-10T07:13:32.453Z" (optional)
}

/**
 * DTO for updating existing Valid FF Flag record
 * PUT /api/v1/admin/valid-ff-values/update
 */
export interface UpdateValidFfFlagDto {
  originalChapterID: string;
  originalCollectionFacilityId: string;
  originalSourceType: string;
  collectionFacilityId: string;
  sourceType: string;
  ffFlagValue: string;
  effectiveDate: string; // ISO 8601 format: "2026-02-10T07:13:32.453Z"
  terminationDate?: string; // ISO 8601 format: "2026-02-10T07:13:32.453Z" (optional)
}
