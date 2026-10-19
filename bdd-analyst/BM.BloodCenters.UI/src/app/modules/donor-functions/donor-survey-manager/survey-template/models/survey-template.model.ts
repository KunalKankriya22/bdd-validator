/**
 * Survey Template Models and Interfaces
 * Generated for MLT-9709: Survey Template functionality
 */

/**
 * SurveyTemplateModel
 * Represents a single survey template from API
 */
export interface SurveyTemplateModel {
  templateId: string;
  typeOfSurvey: string;
  surveyTypeDescription?: string;
  description?: string;
  effDate: string | Date;
  termDate?: string | Date | null;
  /** Normalized from API `status` in service when present */
  templateStatus: 'Active' | 'Inactive' | 'Future';
  lastModified?: string;
  chapterId: string;
  questionCount?: number;
  isEditable?: number;
}

/**
 * Request DTO for fetching survey template data
 */
export interface SurveyTemplateParamsDto {
  searchKeyword?: string;
  effDate?: string | null;
  effDatePeriod?: string | null; // 'after' | 'before'
  termDate?: string | null;
  termDatePeriod?: string | null; // 'after' | 'before'
  sort?: string; // 'A' | 'D'
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
export interface SurveyTemplateFilterValue {
  effDatePeriod: string | null;
  effDate: Date | null;
  termDatePeriod: string | null;
  termDate: Date | null;
  status: 'Active' | 'Inactive' | 'Future' | null;
}

/**
 * Filter LOV Model - Survey types from API
 */
export interface SurveyTemplateFilterLov {
  surveyTypes?: Array<{ code: string; description: string }>;
}

/**
 * Add Dropdown Values from API
 */
export interface SurveyTemplateAddDropdownLov {
  surveyTypes?: Array<{ code: string; description: string }>;
  nextTemplateId?: string;
}

/**
 * DTO for adding new survey template
 */
export interface SurveyTemplateDto {
  templateId?: string;
  typeOfSurvey: string;
  description?: string;
  effDate: string | null;
  termDate?: string | null;
  chapterId: string;
}

/**
 * DTO for updating existing survey template
 */
export interface UpdateSurveyTemplateDto {
  templateId: string;
  typeOfSurvey?: string;
  description?: string;
  effDate: string | null;
  termDate?: string | null;
  chapterId: string;
  resolveOverlaps?: boolean;
  questions?: Array<{
    questionCode: string;
    dispQuestionCode: string;
    displayOrder: number;
    subQuestionFlag: string | null;
    parentQuesCode: string | null;
  }>;
  loggedInUserName?: string;
  warehouseId?: string;
  warehouseName?: string;
  chapterTimezone?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
  totalRecords?: number;
  error?: string | null;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
