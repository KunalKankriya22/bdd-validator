/**
 * LifeTrak API Log Information Query Models
 *
 * Models for the APILOGL mnemonic - LifeTrak API Log Information Query
 *
 * Purpose: Search API logs by Source Application and Date Range
 */

/**
 * Source Code DTO (for dropdown)
 */
export interface SourceCodeDto {
  code: string;               // Source code value
  codeDesc: string;           // Human-readable description
}

/**
 * API Log DTO (response record)
 */
export interface ApiLogDto {
  internalId: string;         // Internal identifier
  externalId: string;         // External application identifier
  insertDate: Date | string;  // Log creation timestamp (chapter local time)
  logText: string;            // Multiline log message
  sourceId: string;           // Source application ID
}

/**
 * API Log Query DTO (request)
 */
export interface ApiLogQueryDto {
  sourceId: string;           // Required - External application ID
  fromDate?: Date | string | null;  // Optional - Start date filter (ISO 8601)
  toDate?: Date | string | null;    // Optional - End date filter (ISO 8601)
  take?: number;              // Optional - Page size (default: 12)
  skip?: number;              // Optional - Pagination offset (default: 0)
}

/**
 * API Response wrapper for API Log Search
 */
export interface ApiLogSearchResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ApiLogDto[];
  totalCount: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * API Response wrapper for Source Codes
 */
export interface SourceCodeResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: SourceCodeDto[];
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Legacy aliases for backward compatibility
 * (used by component - will be phased out)
 */
export interface SourceApplicationOption extends SourceCodeDto {
  sourceAppId: string;  // Alias for code
  description: string;  // Alias for codeDesc
}

export interface LifeTrakApiLogRecord extends ApiLogDto {
  // All fields inherited from ApiLogDto
}

export interface LifeTrakApiLogFilterRequest extends ApiLogQueryDto {
  sourceApplicationId: string;  // Alias for sourceId
  // fromDate, toDate, take, skip inherited
}

export interface LifeTrakApiLogResponse {
  data: LifeTrakApiLogRecord[];
  totalRecords: number;
}

export interface SourceApplicationLovResponse {
  data: SourceApplicationOption[];
}
