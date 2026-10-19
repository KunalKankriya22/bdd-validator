/**
 * Assign Interdiction Class Model
 * Represents a single interdiction class record
 */
export interface AssignInterdictionClassModel {
  interdictionCode: string;
  description: string;
  type: string;
  class: string;
  effectiveDate: Date | null;
  terminationDate: Date | null;
  modificationDate: Date | null;
}

/**
 * Request DTO for fetching Assign Interdiction Class data
 */
export interface AssignInterdictionClassParamsDto {
  SearchKeyword?: string;
  InterdictionCode?: string;
  Type?: string;
  Class?: string;
  EffectiveDate?: string;
  TerminationDate?: string;
  EffectiveDatePeriod?: string;
  TerminationDatePeriod?: string;
  Sort?: 'A' | 'D';
}

/**
 * Filter LOV Model for dropdown options
 */
export interface AssignInterdictionClassFilterLov {
  interdictionCode?: string[];
  type?: string[];
  class?: string[];
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface AssignInterdictionClassFilterValue {
  interdictionCode: string | null;
  type: string | null;
  class: string | null;
  effectiveDatePeriod: 'After' | 'Before' | null;
  effectiveDate: string | null;
  terminationDatePeriod: 'After' | 'Before' | null;
  terminationDate: string | null;
}


/**
 * Response from GET /api/v1/application-admin/lab-interdictions/{inter_code}
 * Returns interdiction details including description and type
 */
export interface InterdictionDetailDto {
  interCode: string;
  interType: string;
  interDesc: string;
  systemInterCode: string;
  systemInterFlag: string;
  effDate: string;
  lastModifiedDate: string;
  auditKey: number;
  programId: string;
  changeControlFlag: string;
  termDate?: string | null;
}

/**
 * DTO for Add/Update Interdiction Class
 * Matches backend AssignInterdictionClassDto (PascalCase for C# compatibility)
 */
export interface AssignInterdictionClassDto {
  InterdictionCode: string;
  Class: string;
  EffectiveDate: string;
  TerminationDate?: string | null;
}

/**
 * Panel State Interface
 */
export interface InterdictionClassPanelState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  data?: AssignInterdictionClassModel;
}