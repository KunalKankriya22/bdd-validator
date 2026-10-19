export interface ReviewCategory {
  isChecked: string | null;
  reviewUser: string | null;
  reviewUserName: string | null;
  reviewDate: string | null;
}

export interface MatchFlags {
  lastName: string | null;
  ssn: string | null;
  dob: string | null;
  sex: string | null;
}

/** Matches backend: PotentialDuplicateBatchDto */
export interface PotentialDuplicateBatch {
  batchId: string;
  status: BatchStatus;
  foundOn: string;
  donorCount: number;
}

/** Matches backend: DuplicateDonorDto (after gap fixes) */
export interface DuplicateDonor {
  donorId: string;
  setId: string;
  name: string;
  dateOfBirth: string;
  ssn: string | null;
  sex: string;
  mergeFlag: string;
  address: string | null;
  workPhone: string | null;
  homePhone: string | null;
  mobilePhone: string | null;
  resolvedByUser: string | null;
  resolvedByUserName: string | null;
  dateResolved: string | null;
  programId: string;
  chapterId: string | null;
  transactionId: string | null;
  comments: string | null;
  insertDate: string | null;
  insertUser: string | null;
  demographics: ReviewCategory;
  keydata: ReviewCategory;
  interdictions: ReviewCategory;
  donations: ReviewCategory;
  attributes: ReviewCategory;
  matchFlags: MatchFlags;
}

/** Matches backend: DuplicatePairDto */
export interface DuplicatePair {
  pairId: string;
  batchId: string;
  primaryDonor: DuplicateDonor | null;
  secondaryDonor: DuplicateDonor | null;
}

/** Batch details with flat donor records for table display */
export interface BatchDetails {
  batch: PotentialDuplicateBatch;
  donors: DuplicateDonor[];
  duplicatePairs: DuplicatePair[];
  totalPairs: number;
}

/** Matches backend: CheckDonorDto */
export interface CheckDonorRequest {
  donorId: string;
  batchId: string;
  sectionsChecked: string[];
}

/** Matches backend: ResolveDuplicateDto */
export interface ResolveDuplicateRequest {
  pairId: string;
  batchId: string;
  resolution: 'Merge' | 'NotDuplicate' | 'Skip';
  primaryDonorId?: string;
  secondaryDonorId?: string;
}

/** Flattened row for DataTable display */
export interface DuplicateDonorRow {
  mergeFlag: string;
  donorId: string;
  donorName: string;
  ssn: string;
  dateOfBirth: string;
  sex: string;
  workNumber: string;
  homeNumber: string;
  mobileNumber: string;
  address: string;
  matchFlags: MatchFlags;
  highlightDonorName: boolean;
  highlightSsn: boolean;
  highlightDob: boolean;
  highlightSex: boolean;
  highlightWorkNumber: boolean;
  highlightHomeNumber: boolean;
  highlightMobileNumber: boolean;
  highlightAddress: boolean;
}

/** Last Name LOV — per-set rows (GAP-05) */
export interface LastNameOption {
  lastName: string;
  setId: string;
  foundOn: string | null;
  setStatusCode: string;
  source: string | null;
}

/** Set ID LOV — includes Source (GAP-04) */
export interface SetIdOption {
  setId: string;
  setStatusCode: string | null;
  insertDate: string | null;
  donorCount: number;
  source: string | null;
}

/** Update request matches simplified backend DTO (GAP-17) */
export interface UpdateDonorRequest {
  demographicsCheck?: string | null;
  keydataCheck?: string | null;
  interdictionsCheck?: string | null;
  donationsCheck?: string | null;
  attributesCheck?: string | null;
  mergeFlag?: string | null;
  comments?: string | null;
}

/** Status change request (GAP-06) */
export interface UpdateSetStatusRequest {
  statusCode: BatchStatus;
}

/** Create set request (GAP-07) */
export interface CreateSetRequest {
  donorId: string;
}

/** Batch status options - Hardcoded as per FMB (dpqinvst) */
export type BatchStatus = 'PENDG' | 'INVAL' | 'RESOL';

export const BATCH_STATUS_OPTIONS: { value: BatchStatus; label: string }[] = [
  { value: 'PENDG', label: 'Pending' },
  { value: 'INVAL', label: 'Invalid' },
  { value: 'RESOL', label: 'Resolved' }
];

export type CheckSection = 'demographics' | 'keydata' | 'interdictions' | 'donations' | 'attributes';

/** Validation constants */
export const PDMQ_VALIDATION = {
  MAX_BATCH_ID: 10,
  MAX_LAST_NAME: 30,
} as const;

/** Error messages */
export const PDMQ_ERROR_MESSAGES = {
  NO_BATCH_SELECTED: 'Please select a Batch ID',
  BATCH_NOT_FOUND: 'Batch not found',
  NO_DUPLICATES: 'No duplicate pairs found for this batch',
  LOAD_ERROR: 'Failed to load data. Please try again later.',
  CHECK_DONOR_ERROR: 'Failed to check donor. Please try again.',
  RESOLVE_ERROR: 'Failed to resolve duplicate. Please try again.',
  STATUS_CHANGE_ERROR: 'Failed to change set status. Please try again.',
  CREATE_SET_ERROR: 'Failed to create duplicate set. Please try again.',
  NO_FILTER_SELECTED: 'Please select a Last Name or Batch ID before retrieving.',
} as const;

export const EMPTY_REVIEW_CATEGORY: ReviewCategory = {
  isChecked: null,
  reviewUser: null,
  reviewUserName: null,
  reviewDate: null,
};

export const EMPTY_MATCH_FLAGS: MatchFlags = {
  lastName: null,
  ssn: null,
  dob: null,
  sex: null,
};
