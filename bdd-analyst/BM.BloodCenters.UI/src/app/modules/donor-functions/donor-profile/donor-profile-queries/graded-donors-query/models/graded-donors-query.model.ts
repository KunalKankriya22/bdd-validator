/**
 * Graded Donors Query - Model Interfaces
 *
 * Purpose: Investigate a donor match from entry of key data
 * Limitations: Only problem matches will be presented for query
 * Prerequisites: Donors must have been placed on hold in the Find Donor program
 */

/**
 * API Request Parameters for Graded Donors Query (matches backend GradedDonorsQueryParamDto)
 */
export interface GradedDonorsQueryParams {
  lastName?: string;            // Optional: Donor's last name (alpha, apostrophe, hyphen only)
  unitId?: string;              // Optional: Unit ID number
  unitDeferId?: string;         // Optional: Unit/Defer ID
  fromDate?: Date;              // Optional: From date for date range search
  toDate?: Date;                // Optional: To date for date range search
  take?: number;                // Optional: Number of records to retrieve for pagination (nullable, defaults to 50 on backend)
  skip?: number;                // Optional: Number of records to skip for pagination (nullable, defaults to 0 on backend)
  sortBy?: string;              // Optional: Sort field (unit_id | last_name | transaction_id | insert_date), defaults to transaction_id
  sortOrder?: string;           // Optional: Sort direction (asc | desc), defaults to desc
}

/**
 * Graded Donation Record (displayed in Graded Donations tab) - UI MODEL
 * This matches the original UI structure
 */
export interface GradedDonationRecord {
  unitDeferId: string;          // Unit or deferral ID number (maps from unitIdWithCheckDigit or unitId)
  lastName: string;             // Donor's last name
  firstName: string;            // Donor's first name
  dateOfBirth: string;          // Date of birth (DD-MMM-YYYY format for display)
  sex: string;                  // Sex (M/F) - maps from gender
  status: string;               // Status of pending donor record merge - maps from activeFlag
  insertDate: string;           // Insert date and time (DD-MMM-YYYY HH:MM format)
  insertUser: string;           // Insert user ID
  // Additional fields for holds lookup
  transactionId?: string;       // Transaction ID for unit holds lookup
  donorId?: string;             // Donor ID for donor holds lookup
  driveId?: string;             // Drive ID for searching
}

/**
 * Graded Donor Record (displayed in Graded Donors tab) - UI MODEL
 * This matches the original UI structure
 */
export interface GradedDonorRecord {
  donorId: string;              // Donor ID number
  matchGrade: string;           // Match grade number (maps from grade)
  dgmLocation: string;          // Donor Grading Matrix line location (maps from dgmId)
  lastName: string;             // Last name
  firstName: string;            // First name
  dateOfBirth: string;          // Date of birth (DD-MMM-YYYY format for display)
  sex: string;                  // Sex (M/F) - maps from gender
  mergeFlag: string;            // Merge flag indicator (maps from potentialDuplicateFlag)
  // Additional fields for holds lookup
  unitDeferId?: string;         // Unit/Defer ID for unit holds lookup
}

/**
 * Unit Hold Record (displayed in Unit Holds modal)
 */
export interface UnitHoldRecord {
  type: string;                 // Type of hold
  code: string;                 // Hold code
  description: string;          // Description of hold
  entryDate: string;            // Date and time hold code was entered (DD-MMM-YYYY HH:MM)
  terminationDate?: string;     // Termination date of hold code (DD-MMM-YYYY)
}

/**
 * Donor Hold Record (displayed in Donor Holds modal)
 */
export interface DonorHoldRecord {
  type: string;                 // Type of hold
  code: string;                 // Hold code
  description: string;          // Description of hold
  unitId: string;               // Unit ID hold is attached to
  entryDate: string;            // Date and time hold code was entered (DD-MMM-YYYY HH:MM)
  effectiveDate: string;        // Date hold became effective (DD-MMM-YYYY)
  terminationDate?: string;     // Termination date of hold code (DD-MMM-YYYY)
}

/**
 * API Response for Graded Donations Query (matches backend ReturnResult<T>) - UI RESPONSE
 */
export interface GradedDonationsQueryResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  error?: string;
  data: GradedDonationRecord[];
  total: number;
}

/**
 * API Response for Graded Donors Query (matches backend ReturnResult<T>) - UI RESPONSE
 */
export interface GradedDonorsQueryResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  error?: string;
  data: GradedDonorRecord[];
  total: number;
}

/**
 * API Response for Unit Holds Query (matches backend ReturnResult<T>)
 */
export interface UnitHoldsQueryResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  error?: string;
  data: UnitHoldRecord[];
  total: number;
}

/**
 * API Response for Donor Holds Query (matches backend ReturnResult<T>)
 */
export interface DonorHoldsQueryResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  error?: string;
  data: DonorHoldRecord[];
  total: number;
}

// ==================== NEW API RESPONSE STRUCTURES (PR #1166) ====================

/**
 * NEW API Response from backend GradedDonorsQueryResultDto
 */
export interface NewGradedDonationsApiResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  error?: string;
  data: NewGradedDonationApiResult[];
  total: number;
}

/**
 * NEW API Result for Graded Donation (from backend GradedDonorsQueryResultDto)
 */
export interface NewGradedDonationApiResult {
  transactionId: string;
  unitId: string;
  unitIdWithCheckDigit: string;
  lastName: string;
  firstName: string;
  dateOfBirth: string | null;   // YYYY-MM-DD from API
  gender: string | null;
  ssn: string | null;           // Already masked from API: ***-**-1234
  activeFlag: string | null;
  insertDate: string | null;    // ISO datetime from API
  insertUser: string | null;
  gradedDonors: NewGradedDonorApiResult[]; // Nested matched donors
}

/**
 * NEW API Result for Graded Donor (from backend GradedDonorDetailDto)
 */
export interface NewGradedDonorApiResult {
  donorId: string;
  grade: number | null;         // Numeric grade (lower = better match)
  dgmId: number;
  lastName: string | null;
  firstName: string | null;
  dateOfBirth: string | null;   // YYYY-MM-DD from API
  gender: string | null;
  potentialDuplicateFlag: string | null;
}

/**
 * API Response for Last Names LOV (matches backend ReturnResult<string[]>)
 */
export interface LastNamesLovResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  error?: string;
  data: string[];
  total: number;
}

/**
 * API Result for Unit ID LOV (from backend UnitIdLovDto)
 */
export interface UnitIdLovDto {
  unitId: string;
  lastName: string;
}

/**
 * API Response for Unit IDs LOV (matches backend ReturnResult<UnitIdLovDto[]>)
 */
export interface UnitIdsLovResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  error?: string;
  data: UnitIdLovDto[];
  total: number;
}

/**
 * Dialog Data for Unit Holds Dialog
 */
export interface UnitHoldsDialogData {
  transactionId: string;        // Transaction ID (required for backend API)
  unitDeferId: string;          // Unit or deferral ID (for display only)
  lastName: string;             // Donor's last name
  firstName: string;            // Donor's first name
  dateOfBirth: string;          // Date of birth (DD-MMM-YYYY format)
  sex: string;                  // Sex (M/F)
}

/**
 * Dialog Data for Donor Holds Dialog
 */
export interface DonorHoldsDialogData {
  donorId: string;              // Donor ID
  lastName: string;             // Donor's last name
  firstName: string;            // Donor's first name
  unitDeferId: string;          // Unit or deferral ID
  dateOfBirth: string;          // Date of birth (DD-MMM-YYYY format)
  sex: string;                  // Sex (M/F)
}

/**
 * Request DTO for Unit Holds Query (matches backend DonationHoldDetailsQueryDto)
 */
export interface UnitHoldsQueryRequest {
  transactionId: string;        // Required: Transaction ID
  holds?: string;               // Optional: Hold filter
  sortDir?: string;             // Optional: Sort direction
}

/**
 * Request DTO for Donor Holds Query (matches backend DonationHoldDetailsQueryDto)
 */
export interface DonorHoldsQueryRequest {
  donorId: string;              // Required: Donor ID
  holds?: string;               // Optional: Hold filter
  sortDir?: string;             // Optional: Sort direction
}

/**
 * Validation Error Messages (Oracle Forms error codes from dpqgrdon_fmb.xml)
 *
 * Oracle Forms triggers and their error messages:
 * - WHEN-VALIDATE-ITEM on UNIT_ID: show_error('16214') and show_error('16213')
 * - WHEN-VALIDATE-ITEM on FROM_DATE/TO_DATE: show_error('11065')
 * - NO_OF_DONATIONS procedure: show_error('2331')
 * - RETRIEVE_DATA procedure: show_error('16001')
 *
 * Auto-fill behavior (Oracle Forms):
 * - If TO_DATE is provided but FROM_DATE is null: FROM_DATE = TO_DATE - 21 days
 */
export const GRADED_DONORS_VALIDATION_MESSAGES = {
  // Field-level validations
  REQUIRED_FIELD: 'Please enter at least one search criterion',
  INVALID_LAST_NAME: 'Last Name can only contain letters, apostrophe (\'), and hyphen (-)',
  MUTUALLY_EXCLUSIVE: 'Please use only ONE search criterion: Unit/Deferral ID, Last Name, OR Date Range',
  FROM_DATE_FUTURE: 'From Date cannot be in the future',
  TO_DATE_FUTURE: 'To Date cannot be in the future',
  INVALID_DATE_RANGE: 'From Date must be on or before To Date',
  TO_DATE_BEFORE_FROM: 'To Date must be on or after From Date',
  INVALID_FROM_DATE: 'From Date is invalid',
  INVALID_TO_DATE: 'To Date is invalid',

  // Oracle Forms error codes (exact messages from show_error calls)
  ERROR_2331: 'No records found matching the search criteria',      // NO_OF_DONATIONS: IF :ctrl_block.no_records = 0
  ERROR_11065: 'From Date must be on or before To Date',            // WHEN-VALIDATE-ITEM: IF :ctrl_block.from_date > :ctrl_block.to_date
  ERROR_16001: 'No graded donations or donors found',               // RETRIEVE_DATA: No results
  ERROR_16213: 'Unit/Deferral ID not found in graded donations',    // WHEN-VALIDATE-ITEM: when no_data_found
  ERROR_16214: 'Invalid Unit/Deferral ID. Must be 7, 8, 13, or 15 characters', // WHEN-VALIDATE-ITEM: Length validation
  ERROR_16220: 'Query returned more than 500 records. Please refine your search criteria', // Backend limit

  // General errors
  API_ERROR: 'An error occurred while retrieving data. Please try again',
  UNIT_ID_LENGTH_ERROR: 'Unit/Deferral ID must be 7, 8, 13, or 15 characters',
  UNIT_ID_FORMAT_ERROR: 'Invalid Unit/Deferral ID format'
};