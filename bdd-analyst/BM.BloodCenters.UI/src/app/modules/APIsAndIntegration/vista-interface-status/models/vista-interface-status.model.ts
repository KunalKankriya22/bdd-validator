/**
 * Vista Interface Status Models
 *
 * DTOs and interfaces for Vista Interface Status API
 * API Base URL: /api/vista-interface-status
 */

/**
 * Main response DTO for Vista Interface Status records
 */
export interface VistaInterfaceStatusDto {
  transactionId: string;
  driveDate: string;
  driveId: string | null;
  donorId: string | null;
  name: string | null;
  donationType: string | null;
  procedureCode: string | null;
  idpProcStatus: string | null; // R = Registered, P = Processed, C = Complete
  statusDescription: string | null;
  lkupUpdtBy: string | null;
  lkupUpdtTime: string | null;
  hlthUpdtBy: string | null;
  hlthUpdtTime: string | null;
  phyUpdtBy: string | null;
  phyUpdtTime: string | null;
  phelobUpdtBy: string | null;
  phelobUpdtTime: string | null;
  printDate: string | null;
}

/**
 * Query/Filter DTO for searching Vista Interface Status records
 */
export interface VistaInterfaceStatusQueryDto {
  driveId?: string | null;
  driveFromDate?: string | null; // YYYY-MM-DD format for API
  driveToDate?: string | null; // YYYY-MM-DD format for API
  status?: string | null; // R, P, or C
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
}

/**
 * Update DTO for changing status
 */
export interface UpdateVistaInterfaceStatusDto {
  idpProcStatus: 'P' | 'X'; // Only P (Pending) or X (Cancel) allowed
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
}

/**
 * Paginated list response
 */
export interface VistaInterfaceStatusListResponse extends ApiResponse<VistaInterfaceStatusDto[]> {
  total: number;
}

/**
 * Single record response
 */
export interface VistaInterfaceStatusSingleResponse extends ApiResponse<VistaInterfaceStatusDto> {
}

/**
 * Update response
 */
export interface VistaInterfaceStatusUpdateResponse extends ApiResponse<{
  transactionId: string;
  idpProcStatus: string;
}> {
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: string;
  message?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Status options for dropdown
 */
export interface StatusOption {
  value: string;
  label: string;
}

/**
 * Drive LOV option for dropdown
 */
export interface DriveOption {
  driveId: string;
  sponsorName: string | null;
  driveDate: string | null;
}

/**
 * Drive LOV response with truncation info
 */
export interface DriveLovResponse {
  data: DriveOption[];
  isTruncated?: boolean;
  lovLimit?: number;
}

/**
 * Filter values for UI
 */
export interface VistaFilterValues {
  driveId: string | null;
  driveFromDate: Date | null;
  driveToDate: Date | null;
  status: string | null;
  sponsor: string | null; // Display-only field
}

/**
 * IDP_TARGET_CHANGE record from the uploaded-data API endpoint
 */
export interface IdpTargetChangeDto {
  targetChangeId: number;
  targetSystem: string;
  targetId: string;
  targetTable: string | null;
  targetField: string;
  targetValue: string;
  targetChangeDate: string;
}

/**
 * Uploaded data field mapping for detail modal
 */
export interface UploadedDataField {
  label: string;
  value: string | null;
}

/**
 * Status enum for type safety
 */
export enum VistaStatus {
  All = 'A',
  Pending = 'P',
  Completed = 'C',
  Registered = 'R',
  Working = 'W',
  Sent = 'S',
  ErrorInReceiving = 'ER',
  NeverReceived = 'NR',
  Cancel = 'X'
}

/**
 * Status descriptions
 */
export const STATUS_DESCRIPTIONS: Record<string, string> = {
  'A': 'All',
  'P': 'Pending',
  'C': 'Completed',
  'R': 'Registered',
  'W': 'Working',
  'S': 'Sent',
  'ER': 'Error in Receiving',
  'NR': 'Never Received',
  'X': 'Cancel'
};

/**
 * Business rule: Valid status transitions for edit dropdown
 * Edit dropdown only allows: P (Pending) and X (Cancel)
 * R -> P: NOT allowed (Error 23009)
 */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  'R': ['X'],    // Registered can only go to Cancel (R->P blocked by error 23009)
  'P': ['X'],    // Pending can go to Cancel
  'C': ['P', 'X'], // Completed can go to Pending or Cancel
  'W': ['P', 'X'],
  'S': ['P', 'X'],
  'ER': ['P', 'X'],
  'NR': ['P', 'X'],
  'X': ['P']     // Cancel can go back to Pending
};

/**
 * Error codes
 */
export const ERROR_CODES = {
  CANNOT_CHANGE_R_TO_P: '23009',
  NO_SEARCH_CRITERIA: '19108'
} as const;
