/** Matches backend: MultipleDonorsQuerySearchCriteriaDto */
export interface MultipleDonorsSearchRequest {
  lastName?: string;
  firstName?: string;
  searchMode?: 'LIKE' | 'SOUNDEX' | 'EXACT';
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'E';
  phone?: string;
  donorId?: string;
  previousDonorId?: string;
  collectionDate?: string;
  unitId?: string;
  sortColumn?: string;
  sortDirection?: string;
}

/** Matches backend: DonorSearchResultDto */
export interface DonorSearchResult {
  donorId: string;
  donorName: string;
  dateOfBirth: string;
  dobDay: string;
  gender: string;
  bloodType: string;
  totalDonations: number;
  totalCredits: number;
  totalGallons: number;
  lastDonationDate: string | null;
  lastUnitId: string | null;
  homePhoneNo: string | null;
  dayPhoneNo: string | null;
  mobilePhone: string | null;
  donorAddress: string | null;
}

/** Matches backend: ReturnResult<DonorSearchResultDto> */
export interface MultipleDonorsQueryResponse {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: DonorSearchResult[];
  item?: DonorSearchResult;
  total?: number;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

/** Matches backend: ReturnResult<int> for max-rows-limit */
export interface MaxRowsLimitResponse {
  success?: boolean;
  message?: string;
  statusCode?: number;
  item?: number;
  data?: number[];
}

export type DonorRowAction =
  | 'alternateAddress'
  | 'communicationLog'
  | 'attributes'
  | 'interdictions'
  | 'donations'
  | 'eligibility'
  | 'demographics';

export const MDONQ_VALIDATION = {
  MAX_LAST_NAME: 30,
  MAX_FIRST_NAME: 30,
  MAX_PHONE: 10,
  MIN_PHONE: 10,
  MAX_DONOR_ID: 10,
  MAX_PREVIOUS_DONOR_ID: 10,
  MAX_UNIT_ID: 15,
  VALID_UNIT_ID_LENGTHS: [7, 10, 15] as readonly number[],
} as const;

export const MDONQ_ERROR_MESSAGES = {
  NO_CRITERIA: 'Please enter at least one search criteria',
  PHONE_MIN: 'Phone must be at least 10 digits',
  PHONE_MAX: 'Phone cannot exceed 10 digits',
  PHONE_NUMERIC: 'Phone must be numeric',
  DOB_FUTURE: 'Date of birth cannot be in the future',
  COLLECTION_DATE_FUTURE: 'Collection date cannot be in the future',
  DONOR_ID_MAX: 'Donor ID cannot exceed 10 characters',
  UNIT_ID_INVALID: 'Unit ID length must be 7, 10, or 15 characters',
  NO_RESULTS: 'No records found',
  TOO_MANY_RESULTS: 'Search returned too many results. Please refine your search criteria.',
  LOAD_ERROR: 'Failed to load data. Please try again later.',
} as const;
