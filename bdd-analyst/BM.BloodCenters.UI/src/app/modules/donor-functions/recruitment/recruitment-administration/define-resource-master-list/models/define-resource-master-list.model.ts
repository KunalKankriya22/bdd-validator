/**
 * DefineResourceMasterListModel
 * Represents resource code configuration data from API
 */
export interface DefineResourceMasterListModel {
  resourceCode?: string;
  resourceDesc?: string;
  resourceType?: string;
  resourceTypeDesc?: string;
  sortSeq?: number;
  criticalInd?: string; // "Y" or "N"
  effDate?: string | Date | null;
  termDate?: string | Date | null;
  programId?: string;
  chapterId?: string;
}

/**
 * API Response wrapper
 */
export interface DefineResourceMasterListResponse {
  success: boolean;
  message: string;
  statuscode: number;
  data: DefineResourceMasterListModel[];
}

/**
 * Request DTO for fetching Define Resource Master List data
 * Matches API payload structure
 */
export interface DefineResourceMasterListParamsDto {
  searchText?: string;
  criticalInd?: string; // "Y" or "N"
  effDate?: string; // ISO datetime string
  effDatePeriod?: string; // "Before" or "After"
  termDate?: string; // ISO datetime string
  termDatePeriod?: string; // "Before" or "After"
  sort?: string; // 'A' for ascending, 'D' for descending
  showTerminated?: string; // "Y" or "N"
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
export interface DefineResourceMasterListFilterValue {
  resourceCode: string | null;
  type: string | null;
  sequence: number | null;
  critical: string | null;
  showTermination: string | null;
  periodType1: string | null;
  effectiveDate: Date | null;
  periodType2: string | null;
  terminationDate: Date | null;
}

/**
 * DTO for adding new Define Resource Master List record
 */
export interface DefineResourceMasterListDto {
  resourceCode: string;
  resourceDesc: string;
  resourceType: string;
  sortSeq: number;
  criticalInd: string; // "Y" or "N"
  effDate: string; // ISO datetime string
  termDate?: string; // ISO datetime string
}

/**
 * DTO for updating existing Define Resource Master List record
 */
export interface UpdateDefineResourceMasterListDto {
  resourceCode: string;
  resourceDesc: string;
  resourceType: string;
  sortSeq: number;
  criticalInd: string; // "Y" or "N"
  effDate: string; // ISO datetime string
  termDate?: string; // ISO datetime string
}
