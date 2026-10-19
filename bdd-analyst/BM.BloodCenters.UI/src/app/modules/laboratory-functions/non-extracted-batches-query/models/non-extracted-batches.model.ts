/**
 * Non-Extracted Batches Query Models
 *
 * Data models for the non-extracted batches query interface.
 * Based on API documentation for MLT-12687
 */

/**
 * Batch Data Transfer Object
 * Represents a single batch with non-extracted test results
 */
export interface BatchDto {
  /** Batch identifier (8 chars) */
  batchId: string;
  /** Count of units in this batch */
  numberOfUnits: number | null;
  /** Contract identifier */
  contractId: string | null;
  /** Chapter identifier */
  chapterId: string | null;
  /** QC date for the batch */
  qcDate: string | null;
}

/**
 * Unit Data Transfer Object
 * Represents a single unit within a batch
 */
export interface UnitDto {
  /** Unit identifier (13 chars) */
  unitId: string;
  /** Check digit for unit identification */
  checkDigit: string | null;
  /** Collection date */
  collDate: string; // DateTime
  /** Batch identifier */
  batchId: string | null;
  /** Contract identifier */
  contractId: string | null;
  /** Chapter identifier */
  chapterId: string | null;
  /** QC check-in date */
  qcCheckinDate: string | null;
}

/**
 * Test Result Data Transfer Object
 * Represents an individual test result for a unit
 */
export interface TestResultDto {
  /** Unit identifier */
  unitId: string;
  /** Collection date */
  collDate: string; // DateTime
  /** Test identifier (e.g., "ALT", "HBsAg", "HCV", "HIV") */
  testId: string;
  /** Test sequence number */
  testSeqNo: number;
  /** Result status: P (Positive), N (Negative), R (Repeat/Retest), I (Interim) */
  resultStatus1: string | null;
  /** Extract date (null if not extracted) */
  extractDate: string | null; // DateTime
  /** Chapter identifier */
  chapterId: string | null;
}

/**
 * Contract Lookup Data Transfer Object
 * Used for contract dropdown population
 */
export interface ContractLookupDto {
  /** Contract identifier */
  contractId: string;
  /** Company name */
  company: string | null;
  /** Center identifier */
  centerId: string | null;
}

/**
 * Query Batches Response
 * Response from GET /laboratory/non-extracted-batches
 */
export interface QueryBatchesResponse {
  /** List of batches matching criteria */
  batches: BatchDto[];
  /** Total number of batches */
  totalBatches: number;
  /** Total units across all batches */
  totalUnits: number;
}

/**
 * Query Parameters for Batch Search
 */
export interface NonExtractedBatchesQueryParams {
  /** Optional contract filter */
  contractId?: string;
  /** Start date (required) - cannot be in future */
  fromDate: string; // DateTime
  /** End date (required) - cannot be in future, must be >= fromDate */
  toDate: string; // DateTime
}

/**
 * Result Status Constants
 */
export enum ResultStatus {
  Positive = 'P',
  Negative = 'N',
  Repeat = 'R',
  Interim = 'I'
}

/**
 * Error Code Constants
 * From API documentation error codes reference
 */
export enum NonExtractedBatchesErrorCode {
  /** From Date cannot be in the future */
  FromDateFuture = '2137',
  /** To Date cannot be in the future */
  ToDateFuture = '2138',
  /** To Date must be >= From Date */
  ToDateBeforeFromDate = '2102',
  /** Invalid or inactive contract */
  InvalidContract = '1147',
  /** Required field validation */
  RequiredField = '0080',
  /** Invalid user or chapter */
  InvalidUserOrChapter = '1060',
  /** Record group fetch error */
  DatabaseError = '1072'
}
