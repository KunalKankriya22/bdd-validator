/**
 * Health History Response Groups Data Models
 * Defines interfaces for HH Response Groups feature including
 * response groups, filters, search parameters, and API responses
 */

/**
 * Main HH Response Group model
 * Represents a health history response group record
 */
export interface HHResponseGroupModel {
  groupCode: string;
  description: string;
  questionCode: string;
  questionDescription?: string;
  responseCode: string;
  responseDescription?: string;
  effectiveDate: string; // ISO date string
  terminationDate?: string; // ISO date string, optional
  chapterId?: string;
  // Read-only audit fields (populated by backend)
  insertDate?: string; // ISO date string
  insertUser?: string;
  programId?: string;
  auditKey?: number;
}

/**
 * Filter values for HH Response Groups
 * Used to store active filter state
 */
export interface HHResponseFilterValue {
  questionCode?: string;
  responseCode?: string;
}

/**
 * Search and filter parameters DTO
 * Sent to API for filtering and sorting
 */
export interface HHResponseParamsDto {
  searchKeyword?: string;
  questionCode?: string;
  responseCode?: string;
  sort?: 'A' | 'D'; // A = Ascending, D = Descending
}

/**
 * Dropdown option model
 * Generic structure for dropdown lists
 */
export interface DropdownOption {
  code: string;
  description: string;
}

/**
 * Filter dropdown LOV (List of Values)
 * Contains options for filter dropdowns
 */
export interface HHResponseFilterLov {
  questionCodes?: DropdownOption[];
  responseCodes?: DropdownOption[];
}

/**
 * Add/Edit dropdown LOV
 * Contains options for add/edit form dropdowns
 */
export interface HHResponseAddDropdownLov {
  questionCodes?: DropdownOption[];
  responseCodes?: DropdownOption[];
}

/**
 * Health History Question model
 * Used for sidebar question list
 */
export interface HHQuestionModel {
  questionCode: string;
  questionText: string;
  responseCode?: string;
  groupCode?: string;
  description?: string;
}

/**
 * DTO for creating new HH Response Group
 */
export interface HHResponseGroupCreateDto {
  questionCode: string;
  responseCode: string;
  groupCode: string;
  description: string;
  effectiveDate: string; // ISO date string, required
  terminationDate?: string; // ISO date string, optional
  chapterId: string;
}

/**
 * DTO for updating existing HH Response Group
 */
export interface HHResponseGroupUpdateDto {
  questionCode: string; // Primary key, not editable
  responseCode: string; // Primary key, not editable
  groupCode: string; // Primary key, not editable
  description: string;
  effectiveDate: string; // Primary key, not editable
  terminationDate?: string;
  chapterId: string;
}

/**
 * Generic API Response wrapper
 * Wraps API responses with metadata
 */
export interface ApiResponse<T> {
  data: T[];
  total?: number;
  success?: boolean;
  message?: string;
}
