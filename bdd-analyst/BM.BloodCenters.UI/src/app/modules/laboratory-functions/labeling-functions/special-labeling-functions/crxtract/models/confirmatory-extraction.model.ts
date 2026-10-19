/**
 * Models and DTOs for Confirmatory Extraction API
 * Based on API documentation: confirmatory-extraction-api-documentation.md
 * JIRA: MLT-14234
 */

/**
 * Extract ID dropdown item
 * Response from GET /confirmatory-extraction/extract-ids
 */
export interface ExtractIdDropdownDto {
  extractId: string;
  insertDate: string; // GMT DateTime
}

/**
 * Contract dropdown item
 * Response from GET /confirmatory-extraction/contracts/{extractId}
 */
export interface ContractDropdownDto {
  contractId: string;
  company: string;
}

/**
 * Confirmatory Extract Unit
 * Response from GET /confirmatory-extraction/units
 */
export interface ConfirmatoryExtractUnitDto {
  extractId: string;
  unitId: string;
  chapterId: string | null; // Added per gap analysis - Section 1.2
  collDate: string | null; // Added per gap analysis - Section 1.2 (Collection Date)
  osUnitId: string | null;
  testSeriesId: string | null;
  testId: string | null;
  qcDate: string | null; // Chapter-local timezone DateTime
  batchId: string | null;
  receivedDate: string | null;
  extractDate: string | null;
  isSelected: boolean;
}

/**
 * Schedule Extraction Request
 * Request for POST /confirmatory-extraction/schedule-extraction
 */
export interface ScheduleExtractionRequestDto {
  extractId: string;
  selectedUnitIds: string[];
  afterTime: string; // Chapter-local timezone DateTime (will be converted to GMT by API)
  generateSeriesReport: boolean;
}

/**
 * Execute Immediate Extraction Request
 * Request for POST /confirmatory-extraction/execute-extraction
 */
export interface ExecuteExtractionRequestDto {
  extractId: string;
  selectedUnitIds: string[];
  generateSeriesReport: boolean;
}

/**
 * Extraction Result
 * Response from schedule/execute extraction endpoints
 */
export interface ExtractionResultDto {
  success: boolean;
  message: string;
  extractId: string;
  unitsProcessed: number;
  isScheduled: boolean; // true if scheduled, false if immediate
  reportGenerated: boolean;
}

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

/**
 * Extract Results Dialog Data (passed to dialog)
 */
export interface ExtractResultsDialogData {
  extractId: string;
  selectedUnitIds: string[];
  unitsCount: number;
}

/**
 * Extract Results Dialog Result (returned from dialog)
 */
export interface ExtractResultsDialogResult {
  afterTime: string | null; // null for immediate execution, DateTime string for scheduled
  generateSeriesReport: boolean;
}

export interface CrxtractFilterValue {
  qcDateFrom: string | null;
  qcDateTo: string | null;
  receivedDateFrom: string | null;
  receivedDateTo: string | null;
}
