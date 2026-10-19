// API Response interface matching the backend structure
export interface ErrorCodeApiResponse {
  errorCode: string;
  errorType: string;
  error: string;
  auditFlag: string;
}

// API List Response with pagination
export interface ErrorCodeListApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ErrorCodeApiResponse[];
  total: number;
}

// API Create/Update Response
export interface ErrorCodeMutationApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item?: ErrorCodeApiResponse;
  error?: string;
}

// API Code Existence Check Response
export interface CodeExistenceCheckResponse {
  success: boolean;
  message: string;
  item: {
    isExists: boolean;
  };
}

export interface ErrorCode {
  errorCode: string;
  errorType: ErrorType;
  error: string;
  auditFlag: AuditFlag;
}

export enum ErrorType {
  SHOW_MESSAGE_ONLY = 'M',
  SHOW_MESSAGE_AND_STOP = 'm',
  SHOW_WARNING_ONLY = 'W',
  SHOW_WARNING_AND_STOP = 'w',
  SHOW_ERROR_ONLY = 'E',
  SHOW_ERROR_AND_STOP = 'e'
}

export enum AuditFlag {
  YES = 'Y',
  NO = 'N'
}

export enum TabType {
  DONOR = 'donor',
  LAB = 'lab',
  DISTRIBUTION = 'distribution'
}

export interface ErrorCodeListRequest {
  searchKeyword?: string;
  codeFrom?: string;
  codeTo?: string;
  auditFlag?: string;
  errorType?: string;
  showEmpty?: boolean;
  sort?: string;
}

export interface ErrorCodeCreateRequest {
  errorCode: string;
  errorType: string;
  auditFlag: string;
  error: string;
}

export interface PaginationParams {
  take: number;
  skip: number;
}

export interface ErrorCodeResponse {
  message: string;
  success: boolean;
}

export interface ErrorCodeListResponse {
  data: ErrorCode[];
  total: number;
}

export interface ErrorCodeFilter {
  codeFrom: string;
  codeTo: string;
  errorType: ErrorType | null;
  auditFlag: AuditFlag | null;
  showEmpty: boolean;
}

// Utility function to map API response to internal model
export function mapApiResponseToErrorCode(apiResponse: ErrorCodeApiResponse): ErrorCode {
  return {
    errorCode: apiResponse.errorCode,
    errorType: apiResponse.errorType as ErrorType,
    error: apiResponse.error,
    auditFlag: apiResponse.auditFlag as AuditFlag
  };
}

// Utility function to get error type display name
export function getErrorTypeDisplayName(type: ErrorType): string {
  const displayNames: Record<ErrorType, string> = {
    [ErrorType.SHOW_MESSAGE_ONLY]: 'Show Message Only',
    [ErrorType.SHOW_MESSAGE_AND_STOP]: 'Show Message and Stop',
    [ErrorType.SHOW_WARNING_ONLY]: 'Show Warning Only',
    [ErrorType.SHOW_WARNING_AND_STOP]: 'Show Warning and Stop',
    [ErrorType.SHOW_ERROR_ONLY]: 'Show Error Only',
    [ErrorType.SHOW_ERROR_AND_STOP]: 'Show Error and Stop'
  };
  return displayNames[type];
}

// Utility function to get error type from display name
export function getErrorTypeFromDisplayName(displayName: string): ErrorType | null {
  const typeMap: Record<string, ErrorType> = {
    'Show Message Only': ErrorType.SHOW_MESSAGE_ONLY,
    'Show Message and Stop': ErrorType.SHOW_MESSAGE_AND_STOP,
    'Show Warning Only': ErrorType.SHOW_WARNING_ONLY,
    'Show Warning and Stop': ErrorType.SHOW_WARNING_AND_STOP,
    'Show Error and Stop': ErrorType.SHOW_ERROR_AND_STOP,
    'Show Error Only': ErrorType.SHOW_ERROR_ONLY,
  };
  return typeMap[displayName] || null;
}