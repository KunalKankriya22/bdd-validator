/**
 * Data Transfer Objects for Verify Test Observations: Tech 2
 *
 * API Documentation: verify-test-observations-tech2-api-documentation.md
 * JIRA: MLT-12688
 * Base URL: /api/v1/verify-test-observations-tech2
 */

/**
 * Worksheet DTO
 * Represents a test batch/worksheet with pending units for Tech 2 verification
 */
export interface WorksheetDto {
  /** Test Batch ID (Worksheet ID) */
  tbId: string;
  /** Count of units pending Tech 2 verification */
  pendingUnitsCount: number;
}

/**
 * Test DTO
 * Represents a test within a worksheet that has units pending Tech 2 verification
 */
export interface TestDto {
  /** Test identifier */
  testId: string;
  /** Test description */
  testDesc: string;
  /** Test type code (e.g., "M" for Manual) */
  testType: string | null;
  /** Test type description */
  testTypeDesc: string | null;
  /** Count of units pending Tech 2 verification */
  pendingUnitsCount: number;
}

/**
 * Test Band DTO
 * Represents a valid test band for result entry
 * Band columns are dynamically generated from this data
 */
export interface TestBandDto {
  /** Band sequence number (order) */
  bandSeq: number;
  /** Band name/label (e.g., "A1", "B", "riba1") */
  bandName: string;
}

/**
 * Band Result DTO
 * Represents a single band result entry
 */
export interface BandResultDto {
  /** Band sequence number */
  bandSeq: number;
  /** Band name */
  bandName: string;
  /** Result code (e.g., "+", "-", "W", "1+", "2+") */
  resultCode?: string;
}

/**
 * Additional Band DTO
 * Represents a band detected between two standard bands
 */
export interface AdditionalBandDto {
  /** First band name */
  band1: string;
  /** Second band name */
  band2: string;
}

/**
 * Pending Unit DTO
 * Represents a unit pending Tech 2 verification
 */
export interface PendingUnitDto {
  /** Unit identifier */
  unitId: string;
  /** Check digit */
  chkDigit: string | null;
  /** Collection date */
  collDate: string | null;
  /** Test Batch ID */
  tbId: string;
  /** Test identifier */
  testId: string;
  /** Sequence number within batch */
  tbSeqNo: number;
  /** Tech 1 result (comma-separated) */
  tempResult1: string | null;
  /** Tech 1 user ID */
  tempResult1UserId: string | null;
  /** Array of band results */
  bandResults: BandResultDto[];
  /** Additional bands (optional) */
  additionalBands?: AdditionalBandDto[];
  /** Result interpretation (computed from band results) */
  resultInterpretation?: string;
  /** Description (computed from result) */
  description?: string;
}

/**
 * Verify Results Request DTO
 * Request payload for verifying unit results
 */
export interface VerifyResultsRequestDto {
  tbId: string;
  testId: string;
  unitId: string;
  bandResults: BandResultDto[];
  tempResult2?: string;
  otherBands?: OtherTestBandDto[];
  notes?: string;
  testType?: string;
  controlValue?: string;
  tbSeqNo: number;
  confirmOverride?: boolean;
}

export interface BandResultLookupDto {
  result: string;
  resultDesc: string | null;
  resultSeq: number;
}

export interface ValidResultDto {
  resultStatus: string;
  description: string | null;
}

export interface TestTypeMetadataDto {
  testType: string;
  testTypeDesc: string | null;
  resUpdate: string | null;
  othBnd: string | null;
  defaultControlValue: string | null;
  fullTechTwo: string | null;
}

export interface CombinationResultDto {
  sysResult: string | null;
  sysResultDesc: string | null;
  isMatch: boolean;
}

export interface ValidateCombinationRequestDto {
  testId: string;
  testType: string;
  bandResults: BandResultDto[];
  controlValue?: string;
}

export interface OtherTestBandDto {
  band1: string;
  band2?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface TestTypeDto {
  testType: string;
  testTypeDesc: string;
}

export interface ControlValueDto {
  resultCode: string;
  resultDesc: string;
}

export interface NoteResponseDto {
  noteId: number;
  note: string;
  insertUser: string;
  insertDate: string;
  programId?: string;
}

export interface CreateNoteRequestDto {
  tbId: string;
  testId: string;
  unitId: string;
  tbSeqNo: number;
  note: string;
  noteId?: number;
}

export interface CheckExistingResultDto {
  hasExistingResult: boolean;
  tempResult2?: string;
  tempResult2UserId?: string;
}

export interface ClearVerificationRequestDto {
  tbId: string;
  testId: string;
  unitId: string;
  tbSeqNo: number;
}

export interface SaveOtherBandsRequestDto {
  tbId: string;
  testId: string;
  unitId: string;
  tbSeqNo: number;
  testType: string;
  otherBands: AdditionalBandDto[];
}

export interface NoteDto {
  id: string;
  noteId?: number;
  author: string;
  version: string;
  date: string;
  content: string;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Unit Row ViewModel
 * Used for rendering the observation values table
 * Contains dynamic band result properties
 */
export interface UnitRowViewModel extends PendingUnitDto {
  tempResult2?: string;
  _originalBands?: Record<string, string>;
  /** Dynamic band results keyed by band name */
  [key: string]: any;
}
