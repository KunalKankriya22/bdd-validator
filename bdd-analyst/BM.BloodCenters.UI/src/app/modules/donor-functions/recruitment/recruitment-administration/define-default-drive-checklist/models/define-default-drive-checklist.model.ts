/**
 * DefineDefaultDriveChecklistModel
 * Represents a single drive checklist item from API
 */
export interface DefineDefaultDriveChecklistModel {
  sortSeq?: number;
  actionCode?: string;
  actionDescription?: string;
  targetDays?: number;
  timeFlag?: string; // AD, BD, DD, CD
  timeFlagDescription?: string;
  targetDateStatus?: string; // FLOATING or FIXED
  sponsorId?: string;
  actionFlag?: string;
  chapterId?: string;
}

/**
 * Request DTO for fetching drive checklist data
 */
export interface DriveChecklistParamsDto {
  searchKeyword?: string;
  targetDays?: number;
  targetDaysCondition?: string; // GE, LE, EQ
  timeline?: string; // Comma-separated values like "BD,AD"
  sort?: string; // A or D
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
 */
export interface DriveChecklistFilterValue {
  condition: string | null; // GE, LE, EQ
  noOfDays: number | null;
  timeline: string | null; // Comma-separated values
}

/**
 * Filter LOV Model - Timeline options from API
 */
export interface DriveChecklistFilterLov {
  timeline?: Array<{ key: string; value: string }>;
}

/**
 * Add Dropdown Values from API
 */
export interface DriveChecklistAddDropdownLov {
  actionCodes?: Array<{ key: string; value: string }>;
  timeline?: Array<{ key: string; value: string }>;
  nextSequence?: number;
}

/**
 * DTO for adding new drive checklist item
 */
export interface DriveChecklistDto {
  actionCode: string;
  chapterId: string;
  targetDays: number;
  timeFlag: string;
}

/**
 * DTO for updating existing drive checklist item
 */
export interface UpdateDriveChecklistDto {
  originalActionCode: string;
  chapterId: string;
  targetDays: number;
  timeFlag: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total: number;
  error: string | null;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
