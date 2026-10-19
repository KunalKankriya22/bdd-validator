/**
 * AccessManagementModel
 * Represents a single access management record
 */
export interface AccessManagementModel {
  chapterId?: string;
  type?: string;
  functionName?: string;
  alertRequired?: string;
  effectiveDate?: Date | string | null;
  terminationDate?: Date | string | null;
}

/**
 * Request DTO for fetching Access Management data
 */
export interface AccessManagementParamsDto {
  SearchKeyword?: string;
  ChapterId?: string;
  AlertRequired?: string;
  EffectiveDatePeriod?: string;
  EffectiveDate?: string;
  TerminationDatePeriod?: string;
  TerminationDate?: string;
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
 */
export interface AccessManagementFilterValue {
  chapterId: string | null;
  alertRequired: string | null;
  effectiveDateFrom: string | null;
  effectiveDateTo: string | null;
  terminationDateFrom: string | null;
  terminationDateTo: string | null;
}

/**
 * Filter LOV Model
 */
export interface AccessManagementFilterLov {
  chapterIds?: string[];
  alertRequiredOptions?: string[];
}

/**
 * DTO for adding new Access Management record (UI to Service)
 */
export interface AccessManagementDto {
  chapterId: string;
  type: string;
  functionName: string;
  alertRequired: string;
  effectiveDate: string | null;
  terminationDate?: string | null;
}

/**
 * DTO for updating existing Access Management record (UI to Service)
 */
export interface UpdateAccessManagementDto {
  // Current values (to identify the record)
  currentChapterId: string;
  currentType: string;
  currentFunctionName: string;

  // New values
  chapterId: string;
  type: string;
  functionName: string;
  alertRequired: string;
  effectiveDate: string | null;
  terminationDate?: string | null;
}

/**
 * API Request DTO for adding new Access Management record (Service to API)
 */
export interface AddAccessManagementApiDto {
  chapterId: string;
  donorType: string;
  funcName: string;
  alertReq: string | null;
  effDate: string | null;
  termDate: string | null;
}

/**
 * API Request DTO for updating existing Access Management record (Service to API)
 */
export interface UpdateAccessManagementApiDto {
  donorType: string;
  funcName: string;
  alertReq: string | null;
  termDate: string | null;
}
