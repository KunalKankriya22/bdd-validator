/**
 * GroupSitesModel
 * Represents a Group/Site record
 *
 * API Response Mapping:
 * - groupSiteInd -> type (G = Group, S = Site)
 * - groupSiteId -> code
 * - siteName -> name
 * - osokFlag -> outOfState ("Y" = true, "N" = false)
 * - lastModifiedDate -> modificationDate
 */
export interface GroupSitesModel {
  chapterId: string;
  groupSiteId: string; // Code (e.g., "S1540")
  groupSiteInd: string; // Type indicator: "G" = Group, "S" = Site
  siteName: string; // Name/Description
  osokFlag?: string; // "Y" or "N" for Out of State flag
  effectiveDate: string | Date | null;
  terminationDate?: string | Date | null;
  lastModifiedDate?: string | Date | null;

  // UI-friendly aliases (computed/transformed fields)
  type?: string; // Computed from groupSiteInd
  code?: string; // Alias for groupSiteId
  name?: string; // Alias for siteName
  status?: string; // Computed from dates
  outOfState?: boolean; // Computed from osokFlag
}

/**
 * Request DTO for fetching Group/Sites data
 */
export interface GroupSitesParamsDto {
  SearchKeyword?: string;
  chapterIds?: string;
  Type?: string;
  Status?: string;
  Sort?: string;
  SortDirection?: 'ASC' | 'DESC';
}

export type SortDirection = 'ASC' | 'DESC' | 'default';

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
export interface GroupSitesFilterValue {
  chapterId: string | null;
}

/**
 * Type indicator constants
 */
export const GroupSiteType = {
  GROUP: 'G',
  SITE: 'S'
} as const;

export type GroupSiteTypeValue = typeof GroupSiteType[keyof typeof GroupSiteType];

/**
 * Filter LOV Model
 */
export interface GroupSitesFilterLov {
  chapters?: Array<{ chapterId: string; chapterName: string }>;
  types?: string[];
}

/**
 * Chapters dropdown response
 */
export interface GroupSitesChaptersResponse {
  chapters: Array<{ chapterId: string; chapterName: string }>;
}

/**
 * Chapter lookup item for dropdowns
 */
export interface ChapterLookup {
  chapterId: string;
  chapterName: string;
}

/**
 * DTO for adding new Group/Site record
 * Uses API field names
 */
export interface GroupSitesDto {
  chapterId: string;
  groupSiteInd: string; // "G" = Group, "S" = Site
  groupSiteId: string; // Code
  siteName: string; // Name/Description
  osokFlag?: string; // "Y" = Yes, "N" = No (Out of State)
  effectiveDate: string | null;
  terminationDate?: string | null;
}

/**
 * DTO for updating existing Group/Site record
 * Uses API field names with "current" prefix for key fields
 */
export interface UpdateGroupSitesDto {
  currentChapterId: string;
  currentGroupSiteId: string; // Code
  groupSiteInd: string; // "G" = Group, "S" = Site
  siteName: string; // Name/Description
  osokFlag?: string; // "Y" = Yes, "N" = No (Out of State)
  effectiveDate: string | null;
  terminationDate?: string | null;
}
