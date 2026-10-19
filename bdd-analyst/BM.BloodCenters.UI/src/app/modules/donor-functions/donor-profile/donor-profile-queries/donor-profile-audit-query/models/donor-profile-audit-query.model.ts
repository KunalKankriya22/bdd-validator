export interface DonorProfileAuditQueryDto {
  donorId?: string;
  lastName?: string;
  firstName?: string;
  dob?: string;
  gender?: string;
  fromDate?: string;
  toDate?: string;
  unitId?: string;
  deferralId?: string;
  collectionDate?: string;
  insertUser?: string;
}

export interface DonorProfileAuditResultDto {
  rowNum: number;
  insertDate: string;
  insertUser: string;
  programId: string;
  tableName: string;
  dataDetails: string;
  recNum: number;
  colNum: number;
  detailsAvailable: boolean;
}

export interface DonorProfileAuditDetailDto {
  recordId: number;
  insertDate: string;
  insertUser: string;
  programId: string;
  tableName: string;
  changes: DonorProfileAuditChangeDto[];
}

export interface DonorProfileAuditChangeDto {
  colNum: number;
  columnName: string;
  oldValue: string | null;
  newValue: string | null;
}

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

export type DonorProfileAuditQueryResponse = ReturnResult<DonorProfileAuditResultDto>;

export interface DonorProfileAuditDetailResponse {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: DonorProfileAuditDetailDto;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

export interface DonorInfo {
  donorId: string;
  lastName: string;
  firstName: string;
  dateOfBirth: string;
  sex: string;
}

export interface DonorSearchRequest {
  lastName?: string;
  firstName?: string;
  dob?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  donorId?: string;
  unitId?: string;
  deferralId?: string;
}

export interface DonorSearchResultDto {
  donorId: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  dateOfBirth: string;
  alternateId?: string;
  sex: string;
  aboRh: string;
  address?: string;
  phoneNumber?: string;
}

export interface AuditFilterCriteria {
  insertedUser?: string;
  fromDate?: string;
  toDate?: string;
  searchText?: string;
}

export interface PrintRange {
  fromRecordNumber?: number;
  toRecordNumber?: number;
}

export const DPAQ_VALIDATION = {
  MAX_DONOR_ID: 20,
  MAX_UNIT_ID: 15,
  MAX_DEFERRAL_ID: 8,
  MAX_LAST_NAME: 30,
  MAX_FIRST_NAME: 30,
  MAX_PHONE: 10,
  MIN_PHONE: 10,
  UNIT_ID_CODABAR_LENGTH: 7,
  UNIT_ID_ISBT_LENGTH: 15,
} as const;

export const DPAQ_ERROR_MESSAGES = {
  NO_DONOR_SELECTED: 'Please select a donor to view audit information',
  DONOR_ID_MAX: 'Donor ID cannot exceed 20 characters',
  UNIT_ID_MAX: 'Unit ID cannot exceed 15 characters',
  UNIT_ID_INVALID_FORMAT: 'Invalid Unit ID format', // Error 16214 - Can be 7, 8-13 (all numeric OR last 5 numeric), or 15 digits
  UNIT_ID_CODABAR_CHECK_DIGIT: 'Invalid check digit for 7-digit Unit ID', // Error 16207
  UNIT_ID_ISBT_FORMAT: 'Invalid ISBT format: must start with "=" and be 15 characters', // Error 16206
  UNIT_ID_ISBT_INVALID_PREFIX: 'Invalid ISBT prefix (positions 2-6)', // Error 16206
  UNIT_ID_ISBT_CHECK_DIGIT: 'Invalid check digit for 15-digit ISBT Unit ID', // ISO 7064 Mod 37,2
  UNIT_ID_ISBT_CORE_NOT_NUMERIC: 'ISBT Unit ID positions 8-13 must be numeric', // Error 16207
  DEFERRAL_ID_MAX: 'Deferral ID cannot exceed 8 characters',
  DEFERRAL_ID_INVALID_FORMAT: 'Deferral ID must contain only letters and numbers',
  PHONE_MIN: 'Phone must be at least 10 digits',
  PHONE_MAX: 'Phone cannot exceed 10 digits',
  PHONE_NUMERIC: 'Phone must be numeric',
  NO_RESULTS: 'No audit records found for the selected criteria',
  LOAD_ERROR: 'Failed to load audit data. Please try again later.',
  DETAIL_LOAD_ERROR: 'Failed to load audit details. Please try again later.',
  DETAIL_NOT_FOUND: 'Audit detail not found',
  DONOR_SEARCH_ERROR: 'Failed to search for donors. Please try again later.',
  NO_DONOR_SEARCH_RESULTS: 'No donors found matching the search criteria',
  PRINT_NO_SELECTION: 'Please select at least one record to print',
  PRINT_INVALID_RANGE: 'Invalid print range. "To" record must be greater than or equal to "From" record',
  // Date validation errors (MLT-11028)
  FROM_DATE_FUTURE: 'From Date cannot be greater than current date', // Error 2137
  TO_DATE_FUTURE: 'To Date cannot be greater than current date', // Error 2138
  FROM_DATE_AFTER_TO_DATE: 'From Date must be less than or equal to To Date', // Error 2102
  TO_DATE_REQUIRES_FROM_DATE: 'From Date is required when To Date is entered', // Error 12116
  UNIT_ID_NOT_FOUND: 'Unit ID not found for this donor', // Error 17003
  DEFERRAL_ID_NOT_FOUND: 'Deferral ID not found for this donor', // Error 16204
  COLLECTION_DATE_NOT_FOUND: 'Collection date not found', // Error 1145
  AT_LEAST_ONE_CRITERIA_REQUIRED: 'At least one search criteria is required', // Error 20028
} as const;
