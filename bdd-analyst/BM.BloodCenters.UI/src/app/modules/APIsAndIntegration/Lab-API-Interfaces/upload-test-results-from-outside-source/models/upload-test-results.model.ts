/**
 * Chapter Option
 */
export interface ChapterOption {
  chapterId: string;
  chapterName: string;
  chapterCode?: string;
  effectiveDate?: string;
  terminationDate?: string;
}

/**
 * Upload Test Results Response DTO from backend
 */
export interface UploadTestResultsResponseDto {
  message: string;
  totalFilesProcessed: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  totalRecordsProcessed: number;
  ltInterfaceFilesCount: number;
  testResultStagingsCount: number;
  fileResults: FileResult[];
}

/**
 * Individual file result from backend
 */
export interface FileResult {
  fileName: string;
  status: string;
  message: string;
  recordCount: number;
  isLifetrakFormat: boolean;
}

/**
 * File location response from MASTER_CODES
 */
export interface FileLocationResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    browse_file_location: string;
  };
}

/**
 * File Upload Item for tracking individual file upload progress
 */
export interface FileUploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}
