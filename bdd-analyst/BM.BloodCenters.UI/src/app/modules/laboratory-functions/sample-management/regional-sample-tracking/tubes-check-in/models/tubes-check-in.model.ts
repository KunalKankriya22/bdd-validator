// ═══════════════════════════════════════════════════════════════════════════════
// Tubes Check-In Models
// Mnemonic: RGITUBES
// Screen: Regional Sample Tracking → Tubes Check-In
// API Documentation: D:\BC-WellSky\mdfile\tubescheckin.md
// ═══════════════════════════════════════════════════════════════════════════════

// ──────────────────────────── API Request DTOs ────────────────────────────────

/**
 * Request DTO for checking in a batch of tubes
 */
export interface CheckInRequestDto {
  contractId: string;
  profileSetId?: string | null;
  profileSeqNo?: number | null;
  receivedDate: string; // ISO 8601 DateTime
  shipmentNo?: string | null;
  shipmentArrivalDate?: string | null; // ISO 8601 DateTime
  batchId?: string | null; // null = create new batch
  collDate?: string | null; // ISO 8601 DateTime
  tubeFormat: string; // R, RP, RPS, R2
  units: TubeEntryDto[];
}

/**
 * Individual tube entry in check-in request
 */
export interface TubeEntryDto {
  osUnitIdRed?: string | null;
  unitIdRed?: string | null;
  redChkDigit?: string | null;
  osRedChkDigit?: string | null;
  osUnitIdPurple?: string | null;
  unitIdPurple?: string | null;
  purpleChkDigit?: string | null;
  osPurpleChkDigit?: string | null;
  osUnitIdSerum?: string | null;
  unitIdSerum?: string | null;
  serumChkDigit?: string | null;
  osSerumChkDigit?: string | null;
  osUnitIdRed2?: string | null; // For R2 format (2nd red tube)
  unitIdRed2?: string | null;
  duplicateReasonCode?: string | null;
  duplicateAllowed: boolean;
}

/**
 * Request DTO for real-time unit validation
 * API validates units as user scans/types - not all fields required at once
 */
export interface ValidateUnitRequestDto {
  contractId: string;                                // Required - current contract
  unitId?: string | null;                            // Optional - typed unit ID
  osUnitId?: string | null;                          // Optional - scanned barcode
  tubeType?: 'RED' | 'PURPLE' | 'SERUM' | 'RED2';   // Optional - tube type being validated
  entryMode?: 'SCAN' | 'MANUAL';                     // Optional - how user entered data
  barcodeScheme?: string | null;                     // Optional - CODABAR, ISBT, etc.
  batchId?: string | null;                           // Optional - current batch context
  collDate?: string | null;                          // Optional - ISO 8601 DateTime
}

// ──────────────────────────── API Response DTOs ───────────────────────────────

/**
 * Standard API response wrapper
 * Backend returns either 'item' (single object) or 'data' (array)
 */
export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T | null;      // For array responses
  item?: T | null;      // For single object responses
  errors?: FieldError[];
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Field-level validation error
 */
export interface FieldError {
  field: string;
  code: string;
  message: string;
}

/**
 * Response from check-in submission
 */
export interface CheckInResponseDto {
  batchId: string;
  unitsProcessed: number;
  testsScheduled: number;
  success: boolean;
}

/**
 * Response from unit validation
 */
export interface ValidateUnitResponseDto {
  isValid: boolean;
  isDuplicate: boolean;
  requiresReason: boolean;
  decodedOsUnitId: string | null;
  decodedUnitId: string | null;
  checkDigit: string | null;
  oldUnitId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  codeScheme: string | null;
}

/**
 * Contract lookup response
 */
export interface ContractLookupDto {
  contractId: string;
  company: string;
  centerId: string;
  conBarCode: string | null;
  copyIsbtFlag: 'Y' | 'N';
  dupCheckinFlag: 'Y' | 'N';
  noOfDuplicates: number;
  effDate: string; // ISO 8601 DateTime
  termDate: string | null; // ISO 8601 DateTime
}

/**
 * Batch lookup response
 */
export interface BatchLookupDto {
  batchId: string;
  receivedDate: string; // ISO 8601 DateTime
  contractId: string;
  profileSetId: string | null;
  profileSeqNo: number | null;
  checkinUserId: string;
  qcDate: string | null; // ISO 8601 DateTime - null = open batch
}

/**
 * Profile set lookup response
 */
export interface ProfileSetDto {
  profileSetId: string;
}

/**
 * Batch unit response
 * Each tube type (RED1, RED2, PURPLE, SERUM) is returned as a separate record
 */
export interface BatchUnitDto {
  tubeType: string; // RED1, RED2, PURPLE, SERUM
  unitId: string;
  osUnitId: string;
  collDate: string; // ISO 8601 DateTime
  receivedDate: string; // ISO 8601 DateTime
  batchId: string;
  checkDigit: string | null;
}

/**
 * Duplicate unit history response
 */
export interface DuplicateUnitDto {
  unitId: string;
  chkDigit: string;
  receivedDate: string; // ISO 8601 DateTime
  contractId: string;
  redTubeFlag: 'Y' | 'N';
  purpleTubeFlag: 'Y' | 'N';
  serumPlasmaInd: 'S' | 'P' | null;
}

/**
 * Test lookup response (for additional tests and contract tests)
 */
export interface TestLookupDto {
  testId: string;
  testDesc: string;
}

/**
 * Tube format lookup response
 */
export interface TubeFormatDto {
  code: string;
  description: string;
}

/**
 * Duplicate reason code lookup response
 */
export interface DuplicateReasonDto {
  code: string;
  description: string;
}

// ──────────────────────────── Frontend UI Models ──────────────────────────────

/**
 * Contract details for UI (mapped from ContractLookupDto)
 */
export interface TubesContract {
  contractId: string;
  company: string; // Company name from API
  description: string; // Maps to 'company' from API (kept for backward compatibility)
  centerId?: string;
  copyIsbtFlag?: 'Y' | 'N'; // Copy ISBT flag from API
  allowsDuplicates?: boolean; // Maps from dupCheckinFlag
  maxDuplicates?: number; // Maps from noOfDuplicates
}

/**
 * Profile Set details for UI
 */
export interface ProfileSet {
  profileSetId: string;
  description?: string; // Optional - may not be in API response
}

/**
 * Shipment details for UI
 */
export interface Shipment {
  shipmentId: string;
  shipmentDate: string; // DD-MMM-YYYY format
  shipmentTime: string; // HH:mm format
  receivedDate: string; // DD-MMM-YYYY format
  receivedTime: string; // HH:mm format
  shipmentRfid: string;
}

/**
 * Test batch details for UI
 */
export interface TestBatch {
  testBatchId: string;
  collectionDate: string; // DD-MMM-YYYY format
  sequence: number;
}

/**
 * Option for check-in mode
 */
export interface CheckInOption {
  code: string;
  description: string;
}

/**
 * Tube entry row in data table (UI model)
 */
export interface TubeCheckInEntry {
  sequence: number;
  outsideRed: string;
  red: string;
  osPurple1: string;
  purple1: string;
  osPurple2: string;
  purple2: string;
}

/**
 * Individual tube entry (working model)
 * Observation Fix: Added isSaved flag to track already-saved rows
 */
export interface TubeEntry {
  outsideRed?: string;
  outsideRedDuplicateReason?: string;
  red?: string;
  redDuplicateReason?: string;
  osPurple1?: string;
  osPurple1DuplicateReason?: string;
  purple1?: string;
  purple1DuplicateReason?: string;
  osPurple2?: string;
  osPurple2DuplicateReason?: string;
  purple2?: string;
  purple2DuplicateReason?: string;
  isSaved?: boolean; // Track if this row has been submitted to backend
}

/**
 * Request DTO for checking in tubes (DEPRECATED - use CheckInRequestDto)
 * @deprecated Use CheckInRequestDto instead
 */
export interface TubesCheckInRequest {
  contractId: string;
  profileSetId: string;
  shipmentId: string;
  optionCode: string;
  testBatchId?: string;
  batchId?: string;
  tubes: TubeEntry[];
}

/**
 * Response from check-in submission (DEPRECATED - use CheckInResponseDto)
 * @deprecated Use CheckInResponseDto instead
 */
export interface TubesCheckInResponse {
  success: boolean;
  message?: string;
  entriesAdded: number;
}

/**
 * Profile test details for UI
 */
export interface ProfileTest {
  testCode: string;
  testName: string;
  specimen?: string; // Optional - may not be in all API responses
}

/**
 * Unit in batch details for UI
 */
export interface BatchUnit {
  unitId: string;
  collectionDate: string; // DD-MMM-YYYY format
  donorName?: string;
  status?: string;
}

/**
 * Notes entry for UI
 */
export interface TubeNote {
  noteId?: string;
  noteText: string;
  createdBy?: string;
  createdDate?: string;
}

// ──────────────────────────── Error Codes ─────────────────────────────────────

/**
 * Common error codes from API
 */
export enum TubeCheckInErrorCode {
  DUPLICATE_UNIT = 'DUPLICATE_UNIT',
  INVALID_CONTRACT = 'INVALID_CONTRACT',
  INVALID_BATCH = 'INVALID_BATCH',
  INVALID_TUBE_FORMAT = 'INVALID_TUBE_FORMAT',
  MISSING_REQUIRED_TUBE = 'MISSING_REQUIRED_TUBE',
  INVALID_CHECK_DIGIT = 'INVALID_CHECK_DIGIT',
  INVALID_BARCODE_SCHEME = 'INVALID_BARCODE_SCHEME',
  UNIT_NOT_FOUND = 'UNIT_NOT_FOUND',
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
}
