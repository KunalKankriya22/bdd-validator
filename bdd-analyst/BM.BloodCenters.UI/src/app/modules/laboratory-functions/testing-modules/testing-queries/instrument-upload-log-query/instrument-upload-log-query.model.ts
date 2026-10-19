/**
 * Instrument Upload Log Query Models
 * DTOs and interfaces for instrument upload log query functionality
 */

/**
 * Instrument upload log record
 */
export interface InstrumentUploadLogRecord {
  machineId: string;
  tbId: string;
  testId: string;
  stationNo: string | null;
  okCount: number | null;
  voidCount: number | null;
  statusDats: string | null;
  statusDesc: string | null;
  reconcileUserId: string | null;
  readDats: string;
}

/**
 * Query parameters for fetching instrument upload logs
 */
export interface InstrumentUploadLogQueryParams {
  readDate: string; // Format: YYYY-MM-DD
  tbId?: string | null;
  testId?: string | null;
  machineId?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC';
  take?: number;
  skip?: number;
}

/**
 * API response for instrument upload logs query
 */
export interface InstrumentUploadLogResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: InstrumentUploadLogRecord[];
  totalCount: number;
}

/**
 * Filter options for dropdowns (matches backend DTO)
 */
export interface InstrumentUploadLogFilterOptions {
  availableTbIds: string[];
  availableTestIds: string[];
  availableMachineIds: string[];
}

/**
 * Filter options API response
 */
export interface FilterOptionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: InstrumentUploadLogFilterOptions;
}

/**
 * Form state for the query component
 */
export interface InstrumentUploadLogFormState {
  enterDate: Date | null;
  batchId: string;
  testId: string;
  machine: string;
}
