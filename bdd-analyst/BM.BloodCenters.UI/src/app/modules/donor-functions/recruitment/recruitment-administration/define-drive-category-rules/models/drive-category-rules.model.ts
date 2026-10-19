/**
 * DriveCategoryRuleModel
 * Represents a single drive category rule from API
 */
export interface DriveCategoryRuleModel {
  ruleId?: string;
  driveCategory?: string;
  description?: string;
  numberAllowed?: number;
  maxSize?: number;
  effDate?: string; // YYYY-MM-DD format from API
  termDate?: string; // YYYY-MM-DD format from API
  modificationDate?: string; // YYYY-MM-DD format from API
  lastModifiedBy?: string;
  lastModifiedDate?: string; // YYYY-MM-DD format from API
}

/**
 * Request DTO for querying drive category rules
 */
export interface DriveCategoryRuleQueryDto {
  searchTerm?: string;
  showTerminated?: boolean;
  chapterId?: string;
  effectiveDatePeriod?: string; // 'Before' or 'After'
  effectiveDateValue?: string; // YYYY-MM-DD format
  terminationDatePeriod?: string; // 'Before' or 'After'
  terminationDateValue?: string; // YYYY-MM-DD format
  sortBy?: string;
  sortDirection?: string; // 'A' or 'D'
}

/**
 * DTO for creating new drive category rule
 */
export interface CreateDriveCategoryRuleRequestDto {
  ruleId: string;
  driveCategory: string;
  numberAllowed: number;
  maxSize: number;
  effDate: string; // YYYY-MM-DD format
  termDate?: string; // YYYY-MM-DD format
}

/**
 * DTO for updating existing drive category rule
 */
export interface UpdateDriveCategoryRuleRequestDto {
  driveCategory?: string;
  numberAllowed: number;
  maxSize: number;
  effDate: string; // YYYY-MM-DD format
  termDate?: string; // YYYY-MM-DD format
}

/**
 * Category dropdown option from API
 */
export interface DriveCategoryRuleCategoryDto {
  code: string;
  description: string;
}

/**
 * Filter Form Value Interface
 */
export interface DriveCategoryRuleFilterValue {
  showTerminated: boolean;
  effectiveDatePeriod: string | null; // 'Before' or 'After'
  effectiveDateValue: string | null; // YYYY-MM-DD format
  terminationDatePeriod: string | null; // 'Before' or 'After'
  terminationDateValue: string | null; // YYYY-MM-DD format
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
