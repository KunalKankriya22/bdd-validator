/**
 * DrivesModel
 * Represents a drive record from the backend
 */
export interface DrivesModel {
  chapterID?: string;
  type?: string;
  drive?: string;
  siteID?: string;
  description?: string;
  os?: string;
  scheduledDate?: string;
  totalRecordsCount?: number;
  lastModifiedDate?: Date | null;
}

/**
 * Chapter lookup model for dropdowns
 */
export interface ChapterLookup {
  chapterId: string;
  chapterName: string;
  chapterShortName?: string;
}

/**
 * Group Site model for Site ID dropdowns
 */
export interface GroupSite {
  groupSiteId: string;
  siteName: string;
  chapterId: string;
}

/**
 * Drive model for Drive ID dropdowns
 */
export interface Drive {
  drive: string;
}

/**
 * Drive Type model for Type filter dropdowns
 */
export interface DriveType {
  driveType: string;
  driveTypeDescription: string;
}

/**
 * Request DTO for fetching Drives data
 */
export interface DrivesParamsDto {
  searchKeyword?: string | null;
  chapterId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  type?: string | null;
  driveId?: string | null;
  siteId?: string | null;
  scheduleDate?: string | null;
  schedulePeriod?: string | null;
  pageNumber?: number;
  pageSize?: number;
  Sort?: 'A' | 'D';
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
export interface DrivesFilterValue {
  type: string | null;
  drive: string | null;
  siteId: string | null;
  period: string | null;
  scheduledDate: Date | null;
}

/**
 * Filter LOV Model
 */
export interface DrivesFilterLov {
  types?: string[];
  drives?: string[];
  siteIds?: string[];
  periods?: string[];
}

/**
 * DTO for adding new Drive record
 */
export interface AddDriveRecordDto {
  chapterId: string;
  driveType: string;
  driveId: string;
  groupSiteId: string;
  description?: string;
  os: string;
  scheduledDate: string;
}

/**
 * DTO for updating existing Drive record
 */
export interface UpdateDriveRecordDto {
  chapterId: string;
  driveType: string;
  driveId: string;
  groupSiteId: string;
  originalGroupSiteId: string;
  description: string;
  os: string | null;
  scheduledDate: string;
}
