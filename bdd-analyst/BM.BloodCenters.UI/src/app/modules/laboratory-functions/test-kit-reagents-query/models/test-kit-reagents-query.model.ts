/**
 * Test Kit Reagents Query - TypeScript Models
 * Based on API Documentation: test-kit-reagent-query-api-documentation.md
 * Generated: 2026-05-27
 *
 * Database Tables:
 * - LBTESTS.TEST_KITS
 * - LBTESTS.USABLE_REAGENTS
 * - LBTESTS.TEST_KIT_REAGENTS
 * - LBTESTS.TEST_BATCH_HDR
 */

// ============================================================
// API Response Wrapper (Standard)
// ============================================================

export interface ApiResponseWrapper<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  errorCode?: string;
  errorResponse?: {
    errorCode?: string;
    error: string;
  };
}

// ============================================================
// Request DTOs
// ============================================================

/**
 * Query parameters for GET /test-kit-reagents-query
 */
export interface TestKitReagentQueryParams {
  testId: string;           // Required, max 10 chars, must exist in LBTESTS.TESTS
  fromDate?: string;        // Optional, cannot be in future (ISO 8601 format)
  toDate?: string;          // Optional, cannot be in future, must be >= fromDate
  testKitId?: string;       // Optional, specific test kit ID filter
}

// ============================================================
// Response DTOs
// ============================================================

/**
 * Test Kit Reagent Result DTO
 * Response from GET /test-kit-reagents-query
 */
export interface TestKitReagentResultDto {
  testKitId: string;                // Unique test kit identifier
  insertDate: string;               // Date kit was created/inserted (ISO 8601)
  qcExpiryDate: string | null;      // Quality control expiry date (ISO 8601, nullable)
  apprLicFlag: string;              // Approved/Licensed flag (Y/N)
  isQcIncomplete: boolean;          // Indicates if QC is incomplete
}

/**
 * Reagent Detail DTO
 * Response from GET /test-kit-reagents-query/{testKitId}/reagents
 */
export interface ReagentDetailDto {
  reagentType: string;              // Reagent type code (C/R/S)
  reagentTypeDescription: string;   // Full description (Control/Reagent/Substrate)
  reagentCode: string;              // Unique reagent code
  reagentDescription: string;       // Formatted as "{Code} - {Name}"
  masterKitLotNumber: string | null; // Kit lot number from REAGENT_STORE_MST (nullable)
  lotNumber: string | null;         // Lot number of the reagent (nullable)
  expiryDate: string | null;        // Reagent expiry date (ISO 8601, nullable)
}

/**
 * Batch Detail DTO
 * Response from GET /test-kit-reagents-query/{testKitId}/batches
 */
export interface BatchDetailDto {
  tbId: string;                     // Test batch identifier
  firstUnitId: string;              // First unit ID in batch
  firstChkDigit: string | null;     // Check digit for first unit ID
  lastUnitId: string;               // Last unit ID in batch
  lastChkDigit: string | null;      // Check digit for last unit ID
}

// ============================================================
// UI-Specific Models (for component state)
// ============================================================

/**
 * Filter criteria for test kit search (UI state)
 */
export interface TestKitFilterCriteria {
  testId: string;
  testIdDescription?: string;
  fromDate: Date | null;
  toDate: Date | null;
  testKitId: string;
}

/**
 * Reagent type lookup
 */
export interface ReagentTypeLookup {
  code: string;
  description: string;
}

/**
 * Constants for reagent types
 */
export const REAGENT_TYPES: ReagentTypeLookup[] = [
  { code: 'C', description: 'Control' },
  { code: 'R', description: 'Reagent' },
  { code: 'S', description: 'Substrate' },
];

// ============================================================
// Error Codes (from API documentation)
// ============================================================

/**
 * Error codes returned by the API
 */
export enum TestKitReagentErrorCode {
  TEST_ID_NOT_FOUND = '1227',           // Test ID doesn't exist in LBTESTS.TESTS
  FROM_DATE_FUTURE = '7022',            // From date cannot be in the future
  TO_DATE_FUTURE = '7022',              // To date cannot be in the future
  TO_DATE_BEFORE_FROM = '7023',         // To date must be >= from date
}

/**
 * Error messages (from API documentation)
 */
export const ERROR_MESSAGES = {
  TEST_ID_REQUIRED: 'Test ID is required',
  TEST_ID_MAX_LENGTH: 'Test ID cannot exceed 10 characters',
  TEST_ID_NOT_FOUND: 'Test ID not found in the system',
  FROM_DATE_FUTURE: 'From date cannot be in the future',
  TO_DATE_FUTURE: 'To date cannot be in the future',
  TO_DATE_BEFORE_FROM: 'To date must be greater than or equal to from date',
  TEST_KIT_ID_REQUIRED: 'Test Kit ID is required',
  LOAD_ERROR: 'An error occurred while loading data',
};

// ============================================================
// Table Column Definitions (for DataTable component)
// ============================================================

export interface TestKitTableColumn {
  field: keyof TestKitReagentResultDto;
  header: string;
  sortable: boolean;
  width?: string;
}

export const TEST_KIT_COLUMNS: TestKitTableColumn[] = [
  { field: 'testKitId', header: 'Test Kit ID', sortable: true, width: '200px' },
  { field: 'insertDate', header: 'Creation Date', sortable: true, width: '180px' },
  { field: 'qcExpiryDate', header: 'QC Exp Date', sortable: true, width: '180px' },
  { field: 'apprLicFlag', header: 'Appr/Lic Flag', sortable: true, width: '140px' },
  { field: 'isQcIncomplete', header: 'Reason', sortable: false, width: '150px' },
];

export interface ReagentTableColumn {
  field: keyof ReagentDetailDto;
  header: string;
  width?: string;
}

export const REAGENT_COLUMNS: ReagentTableColumn[] = [
  { field: 'reagentType', header: 'Type', width: '100px' },
  { field: 'reagentDescription', header: 'Reagent Description', width: '300px' },
  { field: 'masterKitLotNumber', header: 'Kit Lot Number', width: '200px' },
  { field: 'lotNumber', header: 'Lot#', width: '150px' },
];

export interface BatchTableColumn {
  field: keyof BatchDetailDto;
  header: string;
  width?: string;
}

export const BATCH_COLUMNS: BatchTableColumn[] = [
  { field: 'tbId', header: 'Batch ID', width: '200px' },
  { field: 'firstUnitId', header: 'First Unit ID', width: '250px' },
  { field: 'lastUnitId', header: 'Last Unit ID', width: '250px' },
];
