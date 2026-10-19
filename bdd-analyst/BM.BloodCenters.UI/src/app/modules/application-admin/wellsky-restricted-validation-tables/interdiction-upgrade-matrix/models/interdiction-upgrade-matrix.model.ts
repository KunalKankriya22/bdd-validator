export interface InterdictionCodeOption {
  interCode: string;
  interDesc: string;
}

export interface InterdictionUpgradeMatrixModel {
  sourceInterdiction?: string;
  existingInterdiction?: string;
  actionInterdiction?: string;
  action?: string;
  effectiveDate?: Date | string | null;
  terminationDate?: Date | string | null;
}

/**
 * Request DTO for fetching Interdiction Upgrade Matrix data
 */
export interface InterdictionUpgradeMatrixParamsDto {
  SearchKeyword?: string;
  SourceInterdiction?: string;
  ExistingInterdiction?: string;
  ActionInterdiction?: string;
  Action?: string;
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
 * Represents the structure of the filter panel form (using clean property names internally)
 */
export interface InterdictionUpgradeMatrixFilterValue {
  sourceInterdiction: string | null;
  existingInterdiction: string | null;
  actionInterdiction: string | null;
  action: string | null;  // Contains 'P' or 'R' when sent to backend
}

/**
 * Filter LOV Model - matches backend InterdictionUpgradeMatrixFilterModel
 */
export interface InterdictionUpgradeMatrixFilterLov {
  sourceInterdiction?: string[];
  existingInterdiction?: string[];
  actionInterdiction?: string[];
  action?: string[];
}

/**
 * DTO for adding new Interdiction Upgrade Matrix record
 */
export interface InterdictionUpgradeMatrixDto {
  sourceInterdiction: string;
  existingInterdiction: string;
  actionInterdiction: string;
  action: string;
  effectiveDate: string | null;
  terminationDate?: string | null;
}

/**
 * DTO for updating existing Interdiction Upgrade Matrix record
 * Requires current values to identify the record
 * Note: sourceInterdiction and effectiveDate are not editable
 */
export interface UpdateInterdictionUpgradeMatrixDto {
  // Current values (to identify the record)
  currentSourceInterdiction: string;
  currentExistingInterdiction: string;
  currentActionInterdiction: string;

  // New values
  existingInterdiction: string;
  actionInterdiction: string;
  action: string;
  effectiveDate?: string | null;
  terminationDate?: string | null;
}
