/**
 * Set Drive Date and ID Models
 * API Integration models based on backend specification
 * API Endpoints: /api/v1/set-drive-date-and-id/*
 */

/**
 * User Drive Access Response
 * Endpoint: GET /api/v1/set-drive-date-and-id/user-access
 */
export interface UserDriveAccessDto {
  hasDriveBkAccess: boolean;  // Whether user has DRVBK access
  chapterLocalDate: string;   // Current date in chapter's timezone (YYYY-MM-DD)
  minDate: string;            // Minimum allowed drive date (YYYY-MM-DD)
  maxDate: string;            // Maximum allowed drive date (YYYY-MM-DD)
}

/**
 * Drive List Item Response
 * Endpoint: GET /api/v1/set-drive-date-and-id/drives?driveDate={date}
 */
export interface DriveListItemDto {
  driveId: string;      // Unique drive identifier
  driveDate: Date;      // Date of the drive
  sponsorName: string;  // Name of the drive sponsor
}

/**
 * Drive Detail Response
 * Endpoint: POST /api/v1/set-drive-date-and-id/validate
 */
export interface DriveDetailDto {
  driveId: string;      // Unique drive identifier
  driveDate: Date;      // Date of the drive
  sponsorName: string;  // Name of the drive sponsor
  status: string;       // Drive status (should be 'CNFRM')
  chapterId: string;    // Chapter ID owning the drive
}

/**
 * Set Drive Context Request
 * Endpoint: POST /api/v1/set-drive-date-and-id/validate
 */
export interface SetDriveContextDto {
  driveDate: string;  // Drive date to set (YYYY-MM-DD format)
  driveId: string;    // Drive ID to set
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  total?: number;          // For list responses
  errorCode?: string;      // Error code from API
  errorResponse?: {        // Detailed error info (from API validation)
    errorCode: string;     // Error code like 'DRIVE_DATE_REQUIRED'
    error: string;         // Error message like 'Drive Date is required'
    fieldId: string;       // Field identifier like 'DRIVE_DATE'
  };
}
