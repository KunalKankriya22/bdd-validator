/**
 * Models for Query by Interdictions & Holds feature
 * Based on Oracle Forms DPQUTINT (dpqutint_fmb.xml)
 */

/**
 * Query filter criteria for interdiction/hold search
 */
export interface InterdictionQueryFilters {
  /** Option type: Interdiction or Hold */
  option: 'Interdiction' | 'Hold';
  /** Interdiction code - single code or 'MULTI' for multiple selection */
  interCode: string | 'MULTI';
  /** Interdiction description (read-only, populated from code selection) */
  interDesc?: string;
  /** From collection date (MM-DD-YYYY format) */
  fromDate: Date | null;
  /** To collection date (MM-DD-YYYY format) */
  toDate: Date | null;
  /** Donation type filter (optional) */
  donationType?: string;
  /** Show released interdictions (default: false = show only unreleased) */
  showReleased: boolean;
  /** Unit ID filter (7-char Codabar or 15-char ISBT format) */
  unitId?: string;
  /** Logical operation for MULTI code selection (AND/OR) */
  operation?: 'AND' | 'OR';
  /** Array of selected interdiction codes for MULTI mode */
  multipleCodes?: string[];
}

/**
 * Interdiction/Hold query result record
 * Maps to InterdictionQueryResultDto from API
 */
export interface InterdictionResult {
  /** Unit ID from donor_interdictions or donation_interdictions */
  unitId?: string;
  /** Display unit ID with check digit appended */
  displayUnitId?: string;
  /** Interdiction code */
  interCode?: string;
  /** Interdiction type */
  interType?: string;
  /** Effective date of the interdiction */
  effDate?: string | Date;
  /** Termination date of the interdiction */
  termDate?: string | Date | null;
  /** Release date of the interdiction */
  releaseDate?: string | Date | null;
  /** User who released the interdiction */
  releaseUser?: string | null;
  /** Origin of the interdiction */
  originatedFrom?: string;
  /** Reason code for the interdiction */
  reasonCode?: string;
  /** Donor ID associated with the interdiction */
  donorId?: string;
  /** Date the interdiction record was inserted */
  insertDate?: string | Date;
  /** Chapter ID */
  chapterId?: string;
  /** Transaction ID */
  transactionId?: string;
  /** Note ID associated with the interdiction */
  noteId?: string | null;
  /** Termination reason */
  termReason?: string | null;
  /** Source of the interdiction: 'D' for donor_interdictions, 'U' for donation_interdictions */
  source?: string;
  /** Collection date from donations table */
  collDate?: string | Date;
  /** Donation type from donations table */
  donationType?: string;
  /** Procedure code from donations table */
  procedureCode?: string;
  /** Computed donor name: LastName, FirstName */
  donorName?: string;
  /** Donor date of birth */
  dateOfBirth?: string | Date;
  /** Donor gender */
  gender?: string;
  /** Drive ID */
  driveId?: string;
  /** Group mode from donor_interdictions */
  groupMode?: string;
  /** Group ID from donor_interdictions */
  groupId?: string;

  // UI state
  /** Expansion state for row details */
  isExpanded?: boolean;
}

/**
 * Valid interdiction code for LOV (List of Values)
 * Maps to InterdictionCodeLovDto from API
 */
export interface InterdictionCode {
  /** Interdiction code (max 5 chars) */
  code: string;
  /** Interdiction description (max 50 chars) */
  description: string;
  /** Effective date from lookup API */
  effDate?: string;
}

/**
 * Valid interdiction type for LOV
 * Maps to InterdictionLookupDto from API
 */
export interface InterdictionType {
  /** Interdiction type code (max 5 chars) */
  code: string;
  /** Type description */
  description: string;
}

/**
 * Valid donation type for LOV
 * Maps to InterdictionLookupDto from API
 */
export interface DonationType {
  /** Donation type code (max 5 chars) */
  code: string;
  /** Type description */
  description: string;
}

/**
 * Interdiction item for multiple selection dialog
 */
export interface MultipleInterdictionItem {
  /** Interdiction code */
  interCode: string;
  /** Description */
  description: string;
  /** Interdiction type */
  type: string;
  /** Effective date */
  effDate: Date;
  /** Termination date (optional) */
  termDate?: Date | null;
  /** Selected state in dialog */
  selected: boolean;
}

/**
 * Data passed to filter dialog
 */
export interface FilterDialogData {
  /** Current donation type filter */
  donationType: string | null;
  /** Current show released filter */
  showReleased: boolean;
  /** Period effective date after */
  periodEffDateAfter: Date | null;
  /** Period termination date before */
  periodTermDateBefore: Date | null;
}

/**
 * Result from filter dialog
 */
export interface FilterDialogResult {
  /** Selected donation type */
  donationType: string | null;
  /** Show released flag */
  showReleased: boolean;
  /** Period effective date after */
  periodEffDateAfter: Date | null;
  /** Period termination date before */
  periodTermDateBefore: Date | null;
}

/**
 * Data passed to multiple interdiction selection dialog
 */
export interface MultipleInterdictionDialogData {
  /** Current interdiction type filter */
  interType?: string;
  /** Current logical operation */
  operation: 'AND' | 'OR';
  /** Currently selected codes */
  selectedCodes: string[];
}

/**
 * Result from multiple interdiction selection dialog
 */
export interface MultipleInterdictionDialogResult {
  /** Selected interdiction codes */
  selectedCodes: string[];
  /** Logical operation (AND/OR) */
  operation: 'AND' | 'OR';
  /** Display string for selected codes */
  displayString: string;
}

/**
 * API query parameters for interdiction search
 * Maps to InterdictionQueryRequestDto
 */
export interface InterdictionQueryParams {
  /** Option type: "Interdiction" or "Hold" */
  option?: string;
  /** Single interdiction code (max 5 chars) */
  interCode?: string;
  /** Multiple interdiction codes for multi-select filtering */
  interCodes?: string[];
  /** Operator for multi-select logic: "AND" or "OR" */
  interCodesOperator?: string;
  /** Collection date range start (ISO format: YYYY-MM-DD) */
  fromDate?: string;
  /** Collection date range end (ISO format: YYYY-MM-DD) */
  toDate?: string;
  /** Donation type filter (max 30 chars) */
  donationType?: string;
  /** Unit ID filter (max 30 chars) */
  unitId?: string;
  /** Donor last name filter (starts-with match, max 30 chars) */
  lastName?: string;
  /** Donor gender filter ("M" or "F") */
  gender?: string;
  /** Whether to include released interdictions (for Interdiction option) */
  showReleased?: boolean;
  /** Whether to include terminated holds (for Hold option) */
  showTerminated?: boolean;
  /** Effective date filter (ISO format: YYYY-MM-DD) */
  effDateFilter?: string;
  /** Effective date period: "After" or "Before" */
  effDatePeriod?: string;
  /** Termination date filter (ISO format: YYYY-MM-DD) */
  termDateFilter?: string;
  /** Termination date period: "After" or "Before" */
  termDatePeriod?: string;
  /** User ID for access control filtering */
  userId?: string;
  /** Chapter filter */
  chapterId?: string;
  /** Column to sort by */
  sortColumn?: string;
  /** Sort direction: ASC or DESC */
  sortDirection?: string;
}

/**
 * API response for interdiction query
 * Maps to InterdictionQuerySearchResponseDto wrapped in ReturnResult
 */
export interface InterdictionQueryResponse {
  /** Result records */
  data?: {
    /** List of results */
    results: InterdictionResult[];
    /** Operation applied: "-" for single code, "AND" or "OR" for multi-select */
    operation?: string;
    /** Total count of records */
    totalRecords: number;
  };
  /** Success flag */
  success?: boolean;
  /** Error message if any */
  message?: string;
  /** Total count of records */
  totalRecords?: number;
  /** Results list (for backward compatibility) */
  results?: InterdictionResult[];
}

/**
 * API response for LOV endpoints
 */
export interface LovResponse<T> {
  /** List of items */
  data: T[];
  /** Success flag */
  success: boolean;
  /** Error message if any */
  message?: string;
}

/**
 * Donor information response
 */
export interface DonorInfo {
  /** Donor ID */
  donorId: string;
  /** Last name */
  lastName: string;
  /** First name */
  firstName: string;
  /** Date of birth */
  dateOfBirth: Date;
  /** Gender */
  gender: string;
}

/**
 * Active filter chip for display
 */
export interface FilterChip {
  /** Filter label */
  label: string;
  /** Filter value for display */
  value: string;
  /** Key to identify which filter to remove */
  key: keyof InterdictionQueryFilters;
}

/**
 * Validation error messages
 * Based on Oracle Forms error codes from dpqutint_fmb.xml
 */
export const VALIDATION_MESSAGES = {
  // Date validation
  FROM_DATE_FUTURE: '2140', // From date cannot be in the future
  INVALID_DATE_RANGE: '9192', // From date must be <= To date
  TO_DATE_FUTURE: '0060', // To date cannot be in the future

  // Interdiction validation
  INVALID_INTER_CODE: '18033', // Invalid interdiction code or no access
  NO_INTER_SELECTED: '17026', // No interdiction code selected for MULTI
  MAX_INTER_EXCEEDED: '16221', // Maximum 130 interdictions exceeded

  // Donation validation
  INVALID_DON_TYPE: '18035', // Invalid donation type

  // Unit ID validation
  INVALID_UNIT_FORMAT: '0312', // Invalid unit ID format
  UNIT_NOT_FOUND: '16070', // Unit ID not found in donations

  // General
  REQUIRED_FIELD: '0080', // Required field is empty
  TOO_MANY_RESULTS: 'Too many matches found. Enter more specific criteria.', // > 700 records
} as const;

/**
 * Context menu action types
 */
export enum ContextMenuAction {
  OTHER_HOLDS = 'OTHER_HOLDS',
  DONOR_INFO = 'DONOR_INFO',
}

/**
 * Navigation action types for bottom buttons
 */
export enum NavigationAction {
  OTHER_INTER = 'OTHER_INTER', // DPWDNINT
  ATTRIBUTES = 'ATTRIBUTES', // DPWPROPR
  DEMOGRAPHICS = 'DEMOGRAPHICS', // DPWDEMGR
  DONATIONS = 'DONATIONS', // DPWDNDTL
}

/**
 * Request DTO for Other Holds query
 * Maps to OtherHoldsRequestDto in backend
 */
export interface OtherHoldsRequest {
  transactionId: string;
  showTerminated: boolean;
}

/**
 * Result DTO for Other Holds query
 * Maps to OtherHoldsResultDto in backend
 */
export interface OtherHoldsResult {
  interCode?: string;
  interDesc?: string;
  originatedFrom?: string;
  reasonCode?: string;
  effDate?: string | Date | null;
  termDate?: string | Date | null;
}

/**
 * Result DTO for Donor Address query
 * Maps to DonorAddressResultDto in backend
 */
export interface DonorAddressResult {
  streetName?: string;
  homePhone?: string;
  businessPhone?: string;
  email?: string;
  intlAddr?: string;
  intlHomePhone?: string;
  intlWorkPhone?: string;
  isInternational: boolean;
}
