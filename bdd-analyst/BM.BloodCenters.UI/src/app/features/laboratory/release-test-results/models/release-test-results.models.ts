/**
 * Models for Release Test Results (RGIRESQC)
 * Laboratory module - Release QC test results for reagent batches
 */

// ===========================
// Request DTOs
// ===========================

/**
 * Search request for units available for QC test release
 */
export interface ReleaseTestResultSearchRequest {
  allResults?: string | null;
  contractId?: string | null;
  batchId?: string | null;
  testSeriesId?: string | null;
  testId?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

/**
 * Request to auto-determine QC flags for units
 */
export interface AutoDetermineQcFlagRequest {
  contractId: string;
  batchId?: string | null;
  units: Array<{
    unitId: string;
    collDate: string; // ISO DateTime string
  }>;
}

/**
 * Request to release test results for units
 */
export interface ReleaseTestResultsRequest {
  contractId: string;
  batchId?: string | null;
  performCommit: boolean;
  units: Array<{
    unitId: string;
    collDate: string; // ISO DateTime string
    qcTestFlag: string; // 'Y', 'N', or 'T'
  }>;
}

// ===========================
// Response DTOs
// ===========================

/**
 * Search response containing units pending release
 */
export interface ReleaseTestResultSearchResponse {
  contractId: string;
  company: string;
  contractType: string;
  resultsMethod?: string | null;
  batchId?: string | null;
  units: ReleaseTestResultUnit[];
  totalUnits: number;
  unitsToRelease: number;
  skippedUnits: number;
  sqcReasonUnits: number;
  batchOnHold: boolean;
  batchSkipped: boolean;
  message?: string;
}

/**
 * Unit data in search response
 */
export interface ReleaseTestResultUnit {
  unitId: string;
  chapterId: string;
  collDate: string; // ISO DateTime string
  contractId?: string | null;
  batchId?: string | null;
  qcTestDate?: string | null;
  qcCheckinFlag?: string | null;
  qcTestFlag?: string | null;
  redTubeFlag?: string | null;
  redTube2Flag?: string | null;
  purpleTubeFlag?: string | null;
  purpleTube2Flag?: string | null;
  serumPlasmaInd?: string | null;
  insertDats?: string | null;
  programId?: string | null;
  testSeriesId?: string | null;
  hasReactiveResults?: boolean;
  checkDigit?: string;
}

/**
 * Auto-determine QC flags response
 */
export interface AutoDetermineQcFlagResponse {
  units: UnitQcFlag[];
  totalProcessed: number;
  message?: string;
}

/**
 * Unit with determined QC flags
 */
export interface UnitQcFlag {
  unitId: string;
  collDate: string; // ISO DateTime string
  qcTestFlag: string; // 'Y' or 'N'
  serumPlasmaInd?: string | null; // 'S' = Serum, 'P' = Plasma
  redTubeFlag?: string | null;
  redTube2Flag?: string | null;
  purpleTubeFlag?: string | null;
}

/**
 * Release test results response
 */
export interface ReleaseTestResultsResponse {
  unitsReleased: number;
  unitsSkipped: number;
  releasedUnitIds: string[];
  skippedUnitIds: string[];
  allUnitsReleased: boolean;
  message?: string;
}

// ===========================
// API Response Wrappers
// ===========================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  totalCount: number;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errorCode: string;
}

// ===========================
// UI-Specific Models
// ===========================

/**
 * Contract option for dropdown (LOV)
 */
export interface ContractOption {
  contractId: string;
  company: string;
  contractType: string;
  description: string;
  resultsMethod?: string;
}

/**
 * Batch option for dropdown (LOV)
 */
export interface BatchOption {
  batchId: string;
  description?: string;
  totalUnits?: number;
  receivedDate?: string;
  lastQcDate?: string;
  chapterId?: string;
  isInUse?: boolean;
}

/**
 * Test result data for side panel
 */
export interface TestResult {
  sequence: number;
  testId: string;
  resultCode: string;
  resultDescription: string;
  description: string;
  isReactive?: string; // 'Y' or 'N' from API
  interimResult?: string | null;
}

/**
 * Test series dropdown option from API
 */
export interface TestSeriesOption {
  testSeriesId: string;
  description: string;
}

/**
 * Test dropdown option from API
 */
export interface TestOption {
  testId: string;
  testDesc: string;
}

/**
 * Collection day legend item from Master Codes API
 */
export interface CollectionDayLegendItem {
  code: string;
  description: string;
}

/**
 * Legend entry for collection date color coding (UI display)
 */
export interface CollectionDateLegend {
  code: string;
  description: string;
  colorClass: string;
  backgroundColor: string;
}

/**
 * Collection date age categories for color coding
 */
export enum CollectionDateAge {
  ZERO_TO_TWO_DAYS = 'WHITE',
  THREE_TO_FOUR_DAYS = 'YELLOW',
  FIVE_DAYS = 'GREEN',
  SIX_TO_SEVEN_DAYS = 'RED',
  EIGHT_PLUS_DAYS = 'BLUE'
}

/**
 * Sample age configuration for collection date color coding
 */
export interface SampleAgeConfig {
  code: string;
  description: string;
  sortSequence: number;
  minDays: number;
  maxDays: number;
}

/**
 * Unit selection state for table
 */
export interface UnitSelection {
  unitId: string;
  selected: boolean;
}

/**
 * Footer statistics
 */
export interface FooterStatistics {
  totalUnits: number;
  skipped: number;
  noResult: number;
  sqc: number;
}
