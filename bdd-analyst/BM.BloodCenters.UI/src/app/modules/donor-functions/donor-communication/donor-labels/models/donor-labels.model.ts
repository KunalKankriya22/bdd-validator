/**
 * Models for Donor Labels functionality
 * Interfaces for API requests and responses
 */

/**
 * Search type options for donor labels
 */
export type SearchType = 'FirstTimeFixed' | 'GallonDonors';

/**
 * Print flag values
 */
export type PrintFlag = 'Y' | 'N' | 'P';

/**
 * Donor Label DTO - Response model from search endpoint
 */
export interface DonorLabelDto {
  donorId: string;
  donorName: string;
  dateOfBirth: string | null;
  gender: string | null;
  totalDonations: number;
  gallons: number | null;
  lastDonationDate: string | null;
  lastUnitId: string | null;
  collectionDate: string;
  communicationCode: string | null;
  printFlag: PrintFlag | null;
  insertDate: string;
  insertUser: string;
  homePhone?: string | null;
  dayPhone?: string | null;
  address?: string | null;
}

/**
 * Donor Label Search Request - Request model for search endpoint
 */
export interface DonorLabelSearchRequest {
  searchType: SearchType;
  startDate: string;
  endDate: string;
  gallonNumber?: number | null;
  printerName?: string | null;
  take?: number;
  skip?: number;
}

/**
 * Update Print Flags Request - Request model for bulk print flag updates
 */
export interface UpdatePrintFlagsRequest {
  printFlag: PrintFlag;
  records: PrintFlagRecord[];
}

/**
 * Print Flag Record - Individual record for print flag update
 */
export interface PrintFlagRecord {
  donorId: string;
  collectionDate: string;
}

/**
 * Generate Labels Request - Request model for label generation
 */
export interface GenerateLabelsRequest {
  searchType: SearchType;
  startDate: string;
  endDate: string;
  gallonNumber?: number | null;
}

/**
 * Print Labels Request - Request model for print job submission
 */
export interface PrintLabelsRequest {
  searchType: SearchType;
  startDate: string;
  endDate: string;
  gallonNumber?: number | null;
  printerName: string;
}

/**
 * Printer Option - Dropdown option for printer selection
 */
export interface PrinterOption {
  printerName: string;
  printerDescription?: string;
}

/**
 * Search Response - Generic response wrapper for search results
 */
export interface SearchResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  totalCount: number;
}

/**
 * Action Response - Generic response for actions (update, generate, print)
 */
export interface ActionResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
}

/**
 * Update Print Flags Response Data
 */
export interface UpdatePrintFlagsResponseData {
  updatedCount: number;
  message: string;
}

/**
 * Generate Labels Response Data
 */
export interface GenerateLabelsResponseData {
  generatedCount: number;
  skippedCount: number;
  totalProcessed: number;
  message: string;
}

/**
 * Print Labels Response Data
 */
export interface PrintLabelsResponseData {
  parmId: string;
  serverName: string;
  reportName: string;
  jobId?: string;
  status?: string;
}

/**
 * Option dropdown for search type
 */
export interface SearchTypeOption {
  value: SearchType;
  label: string;
}

/**
 * Backend dropdown option structure
 */
export interface BackendDropdownOption {
  code: string;
  description?: string;
}

/**
 * Dropdown values response from backend
 */
export interface DropdownValuesResponse {
  searchTypes: BackendDropdownOption[];
  printers: BackendDropdownOption[];
}

/**
 * Error Response structure
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: string;
  errorResponse?: {
    errorCode?: string;
    error: string;
  };
  message?: string;
}
