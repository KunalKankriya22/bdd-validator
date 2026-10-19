/**
 * Report Action Models
 * Defines interfaces and types for Report Actions feature
 */

/**
 * Report Status enum
 */
export enum ReportStatus {
  Completed = 'C',
  Submitted = 'S',
  Executing = 'E'
}

/**
 * Main Report Action interface
 */
export interface ReportAction {
  applId: string;
  reportName: string;
  parmId: string;
  userName: string;
  submitDate: Date;
  reportStatus: ReportStatus;
  repJobId?: string;
  repServer?: string;
  chapterId?: string;
  outputFile?: string;
  fileName?: string;
  formsType?: string;
  statusMessage?: string;

  // UI-specific computed fields
  displayStatus: string;
  localSubmitDate: Date;
  canReview: boolean;
  canDelete: boolean;
  canPrint: boolean;
}

/**
 * Request body for fetching reports
 */
export interface ReportActionQuery {
  applId?: string;
  reportName?: string;
  parmId?: string;
  userName?: string;
  reportStatus?: string;
  chapterId?: string;
  submitDateFrom?: string;
  submitDateTo?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortDirection?: string;
  isSupervisor: boolean;
}

/**
 * Generic API Response
 */
export interface ReportActionResponse<T> {
  success: boolean;
  message?: string;
  data?: T[];
  item?: T;
  Data?: T[]; // PascalCase variant
  Item?: T;   // PascalCase variant
  total?: number;
  Total?: number; // PascalCase variant
  totalRecords?: number;
}

/**
 * Filter values for report actions
 */
export interface ReportActionFilterValue {
  userName?: string;
  generatedPeriodType?: 'after' | 'before';
  generatedDate?: Date;
}

/**
 * Dropdown options
 */
export interface ReportActionDropdowns {
  users: Array<{ code: string; name: string }>;
  statuses: Array<{ code: string; name: string }>;
  reportNames: Array<{ code: string; name: string }>;
}

/**
 * Distinct username entry from the distinct-usernames API
 */
export interface DistinctUsername {
  userName: string;
}

/**
 * User Details interface
 */
export interface UserDetails {
  userId: string;
  accessLevel: number;
  userName?: string;
  staffNo?: string;
  functionalGroup?: string;
  isSupervisor: boolean;
}

export interface LogReportRequest {
  parmId: string;
  userName: string;
  reportName: string;
  applId: string;
}

export interface LogReportResponse {
  newParmId: string;
  sessionId: string;
  originalParmId: string;
  jobId: string;
  status: string;
  message: string;
}

export interface ReportJobStatus {
  parmId: string;
  reportName: string;
  statusCode: string;
  statusMessage: string;
  outputFile: string;
  fileName: string;
}
