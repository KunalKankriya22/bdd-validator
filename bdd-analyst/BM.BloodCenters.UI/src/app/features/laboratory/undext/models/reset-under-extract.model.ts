/**
 * Model definitions for Reset Under Extract Flag feature
 * Based on API Documentation: MLT-13548-api-documentation.md
 */

/**
 * DTO for eligible records returned from GET /reset-under-extract
 */
export interface ResetUnderExtractDto {
  resultParmId: string;
  batchId: string | null;
  insertDate: string; // ISO datetime format
  underExtractFlag: string; // 'Y' or 'N'
  rowId?: string; // Computed: array index for unique DataTable row selection
}

/**
 * Request DTO for POST /reset-under-extract/reset
 */
export interface ResetUnderExtractRequestDto {
  items: ResetUnderExtractItemDto[];
}

/**
 * Individual item in reset request
 */
export interface ResetUnderExtractItemDto {
  resultParmId: string; // Max 15 chars, required
  batchId?: string | null; // Max 15 chars, optional
}

/**
 * Response from GET /reset-under-extract
 */
export interface ResetUnderExtractGetResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ResetUnderExtractDto[];
  totalCount: number;
}

/**
 * Response from POST /reset-under-extract/reset
 */
export interface ResetUnderExtractResetResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    successCount: number;
    skippedCount: number;
    totalProcessed: number;
  };
}
