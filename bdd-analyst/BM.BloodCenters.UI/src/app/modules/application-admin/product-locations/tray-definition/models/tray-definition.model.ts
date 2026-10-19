/**
 * TrayDto - Response model from API
 * Represents a tray definition record
 */
export interface TrayDto {
  chapterId: string;
  trayNumber: string;
  trayDescription: string;
  itemCount: number;
  trayStatus: string;
  productType: string | null;
  effectiveDate: Date;
  termDate: Date | null;
  lastModifiedDate: Date;
}

/**
 * CreateTrayRequestDto - Request payload for creating a new tray
 */
export interface CreateTrayRequestDto {
  trayNumber: string;        // Required, max 4 chars
  trayDescription: string;   // Required, max 30 chars
  itemCount?: number;        // Optional, 0-9999, defaults to 0
  trayStatus: string;        // Required, max 2 chars
  effectiveDate: string;     // Required, ISO format YYYY-MM-DD
  termDate?: string | null;  // Optional, ISO format YYYY-MM-DD
}

/**
 * UpdateTrayRequestDto - Request payload for updating an existing tray
 */
export interface UpdateTrayRequestDto {
  trayDescription: string;   // Required, max 30 chars
  itemCount?: number;        // Optional, 0-9999, defaults to 0
  trayStatus: string;        // Required, max 2 chars
  effectiveDate: string;     // Required, ISO format YYYY-MM-DD
  termDate?: string | null;  // Optional, ISO format YYYY-MM-DD
}

/**
 * TrayQueryDto - Request payload for filtering/searching trays
 */
export interface TrayQueryDto {
  trayNumber?: string;
  trayStatus?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;

  // Effective Date filters
  effectiveDateFrom?: string;
  effectiveDateTo?: string;

  // Termination Date filters
  terminationDateFrom?: string;
  terminationDateTo?: string;
}

/**
 * TrayStatusLovDto - Status dropdown options from VSERV_MASTER
 */
export interface TrayStatusLovDto {
  code: string;
  description: string;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface TrayDefinitionFilterValue {
  trayStatus: string | null;
  effectiveDatePeriod: string | null;  // "After" or "Before"
  effectiveDate: Date | null;
  terminationDatePeriod: string | null; // "After" or "Before"
  terminationDate: Date | null;
}

/**
 * API Response wrapper matching backend ReturnResult<T>
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  item?: T;
  total?: number;
}

/**
 * TrayScanRequestDto - Request payload for barcode scan validation (S_TRAY_NUMBER)
 */
export interface TrayScanRequestDto {
  scanValue: string;
}

/**
 * TrayScanResponseDto - Response from barcode scan validation
 * trayNumber is null when scanValue is 'M' (manual-entry indicator)
 */
export interface TrayScanResponseDto {
  trayNumber: string | null;
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  success: boolean;
  statusCode: number;
  errorCode: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}
