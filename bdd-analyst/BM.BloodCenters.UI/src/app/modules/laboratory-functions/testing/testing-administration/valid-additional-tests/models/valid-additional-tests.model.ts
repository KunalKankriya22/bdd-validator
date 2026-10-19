import { Moment } from 'moment';

/**
 * ValidAdditionalTest response DTO
 * Represents a valid additional test record from the API
 */
export interface ValidAdditionalTestDto {
  chapterId: string;
  testId: string;
  testDesc: string | null;
  effDate: string;
  termDate: string | null;
}

/**
 * Form value interface for add/edit dialog
 * Uses Moment for date handling in form controls
 */
export interface ValidAdditionalTestFormValue {
  testId: string | null;
  testDesc: string | null;
  effDate: Moment | null;
  termDate: Moment | null;
}

/**
 * Filter value interface for filter panel
 */
export interface ValidAdditionalTestFilterValue {
  testId?: string | null;
  effectivePeriod?: string | null;
  effDateFrom?: Moment | null;
  terminationPeriod?: string | null;
  effDateTo?: Moment | null;
}

/**
 * Query parameters DTO for filtering/sorting/searching
 * Sent to the LIST endpoint
 */
export interface ValidAdditionalTestQueryDto {
  testId?: string;
  effDatePeriod?: string;
  effectiveDate?: string;
  termDatePeriod?: string;
  terminationDate?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Response DTO for list endpoint
 */
export interface ValidAdditionalTestResponseDto {
  data: ValidAdditionalTestDto[];
  totalCount: number;
}

/**
 * Create request DTO
 * Sent to CREATE endpoint
 */
export interface CreateValidAdditionalTestRequestDto {
  testId: string;
  effDate: string;
  termDate?: string;
}

/**
 * Update request DTO
 * Sent to UPDATE endpoint
 */
export interface UpdateValidAdditionalTestRequestDto {
  effDate: string;
  termDate?: string | null;
}

/**
 * Valid test dropdown item for LOV
 * From tests-dropdown endpoint
 */
export interface ValidTestDropdownDto {
  testId: string;
  testDesc: string;
}

/**
 * Tests dropdown response DTO
 */
export interface TestsDropdownResponseDto {
  tests: ValidTestDropdownDto[];
}
