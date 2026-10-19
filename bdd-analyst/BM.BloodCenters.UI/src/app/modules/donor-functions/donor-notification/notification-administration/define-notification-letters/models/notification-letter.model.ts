/**
 * Core interfaces for Notification Letters feature
 * Manages letter templates with version control
 */

/**
 * Base notification letter entity
 */
export interface NotificationLetter {
  letterCode: string;
  title: string;
  description?: string;
  fileName: string;
  chapterId?: string;
  createdBy?: string;
  createdDate?: string;
}

/**
 * Letter version entity - tracks individual versions of letters
 */
export interface LetterVersion {
  letterId: string;            // Unique identifier for this version
  letterCode: string;
  versionNo: number;
  effectiveDate: string;      // Format: DD-MMM-YYYY for UI display
  terminationDate?: string;    // Format: DD-MMM-YYYY for UI display, null if current
  letterMessage: string;       // Contains template variables like &&DONOR_NAME&&
  isCurrent: boolean;          // True if this is the active version
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

/**
 * Combined view of letter with current version and history
 */
export interface LetterView extends NotificationLetter {
  currentVersion?: LetterVersion;
  versionHistory?: LetterVersion[];
}

/**
 * DTO for creating a new letter
 * Matches backend API expectations
 */
export interface CreateLetterDto {
  letterCode: string;
  letterTitle: string;        // Backend expects letterTitle not title
  letterContent: string;      // Backend expects letterContent not letterMessage
  documentType: string;       // REQUIRED: Document type (always "N" for notification)
  effectiveDate: string;      // Format: YYYY-MM-DD for API
  terminationDate?: string;   // Format: YYYY-MM-DD for API, optional
  documentName?: string;      // Document file name
  datafileName?: string;      // Data file name (same as documentName)
  programId?: string;         // Program identifier (default: 'DONOR')
}

/**
 * DTO for revising an existing letter (creating a new version)
 * Matches backend ReviseValidLetterDto
 */
export interface ReviseLetterDto {
  letterId: string;            // ID of current version to terminate
  letterTitle: string;         // Title for new version
  effectiveDate: string;       // Format: YYYY-MM-DD for API
  terminationDate?: string;    // Format: YYYY-MM-DD for API, optional
  currentTerminationDate?: string; // Termination date for the current version being revised
  letterContent: string;       // Letter message content
  documentName?: string;       // Optional document name
  datafileName?: string;       // Optional data file name
  programId?: string;          // Optional program ID
}

/**
 * Filter criteria for letter search
 */
export interface LetterFilterCriteria {
  showTerminated: boolean;
  letterCode?: string;
  chapterId?: string;
  warehouseId?: string;
}

/**
 * Template variable definition - allowed placeholders in letter messages
 */
export interface TemplateVariable {
  name: string;              // Variable name, e.g., "DONOR_NAME"
  placeholder: string;       // Full placeholder, e.g., "&&DONOR_NAME&&"
  description: string;       // Human-readable description
  example?: string;          // Example value for preview
  dataType?: string;         // Data type (string, date, number)
}

/**
 * Letter code dropdown option
 */
export interface LetterCodeOption {
  code: string;
  description: string;
}

/**
 * Email preview response
 */
export interface LetterPreviewResponse {
  html: string;              // Formatted HTML content
  subject?: string;          // Email subject line
  recipients?: string[];     // Default recipients
}

/**
 * Preview report submission response
 */
export interface PreviewLetterResponse {
  jobId: string;
  parmId: string;
  reportName: string;
  status: string;
  message?: string;
}

/**
 * Send email request
 */
export interface SendEmailRequest {
  letterCode: string;
  versionNo: number;
  recipients: string[];
  subject?: string;
  additionalContent?: string;
}

/**
 * API response wrapper (if backend uses consistent response format)
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

/**
 * API response structure for valid-letters endpoint (flat structure)
 * This is the actual structure returned by the backend
 */
export interface ValidLetterApiResponse {
  letterId: string;
  letterCode: string;
  letterTitle: string;
  letterContent?: string;   // Letter message content (included in detail endpoint)
  versionNo: number;
  versionDate: string;      // ISO format: "2012-03-08T17:34:43"
  documentType: string;     // "N" for notification
  effectiveDate: string;    // ISO format: "2012-03-07T00:00:00"
  modificationDate: string; // ISO format
  terminationDate?: string | null; // ISO format or null
}
