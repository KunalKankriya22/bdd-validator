export interface ReturnResult<T> {
  success: boolean | null;
  message: string | null;
  error: string | null;
  errorCode: string | null;
  statusCode: number | null;
  data: T[] | null;
  item: T | null;
  total: number | null;
  errorResponse: ValidErrorModel;
}

export interface ValidErrorModel {
  errorCode: string | null;
  error: string | null;
}

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

export interface ReviewProgress {
  demographics: number;
  keydata: number;
  interdictions: number;
  donations: number;
  attributes: number;
}

export interface DuplicateSet {
  setId: string;
  setStatusCode: string;
  insertDate: string;
  source: string;
  programId: string;
  duplicateCount: number;
  reviewProgress: ReviewProgress;
}

export interface InvestigateBatch {
  batchId: string;
  setStatusCode: BatchStatus;
  foundOn: string;
  source: string;
  programId: string;
  duplicateCount: number;
  reviewProgress: ReviewProgress;
}

export interface InvestigateDonor {
  donorId: string;
  setId: string;
  setStatusCode: string;
  mergeFlag: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string | null;
  altAddress: string | null;
  workPhone: string | null;
  homePhone: string | null;
  demographics: ReviewCategory;
  keydata: ReviewCategory;
  interdictions: ReviewCategory;
  donations: ReviewCategory;
  attributes: ReviewCategory;
  matchFlags: MatchFlags;
  resolveUser: string | null;
  resolveUserName: string | null;
  resolveDate: string | null;
  programId: string;
  chapterId: string;
}

export interface InvestigateBatchDetails {
  batch: InvestigateBatch;
  donors: InvestigateDonor[];
}

export interface InvestigateDonorRow {
  mergeFlag: string;
  donorId: string;
  donorName: string;
  dateOfBirth: string;
  sex: string;
  workNumber: string;
  homeNumber: string;
  address: string;
  altAddress: string;
  isPrimary: boolean;
  highlightDonorName: boolean;
  highlightHomeNumber: boolean;
  highlightAddress: boolean;
}

export type InvestCheckSection = 'demographics' | 'keydata' | 'interdictions' | 'donations' | 'attributes';

export type ReviewCategoryType = 'Demographics' | 'Keydata' | 'Interdictions' | 'Donations' | 'Attributes';

export type BatchStatus = 'PENDG' | 'INVAL' | 'RESOL';

export type MergeFlag = 'PRIMR' | 'SECON' | 'FALSE' | 'NOMER';

export const MERGE_FLAG_LABELS: Record<string, string> = {
  PRIMR: 'Primary',
  SECON: 'Secondary',
  FALSE: 'False Duplicate',
  NOMER: 'No Merge'
};

export interface DuplicateSetQuery {
  setId?: string;
  statusCode?: string;
}

export interface UpdateReviewRequest {
  category: ReviewCategoryType;
  isChecked: boolean;
}

export interface UpdateMergeFlagRequest {
  mergeFlag: MergeFlag;
}

export interface UpdateSetStatusRequest {
  statusCode: 'PENDG' | 'INVAL';
}

export interface ResolveSetResult {
  setId: string;
  resolveUser: string;
  resolveDate: string;
  resolvedDonors: number;
}

export interface StatusCode {
  statusCode: string;
  description: string;
}

export const INVEST_ERROR_MESSAGES = {
  NO_BATCH_SELECTED: 'Please select a Batch ID',
  BATCH_NOT_FOUND: 'Batch not found',
  NO_DONORS: 'No duplicate donors found for this batch',
  LOAD_ERROR: 'Failed to load data. Please try again later.',
  SAVE_ERROR: 'Failed to save changes. Please try again.',
  COMMIT_ERROR: 'Failed to commit investigation. Please try again.',
  INVALIDATE_ERROR: 'Failed to invalidate batch. Please try again.',
  REVIEW_UPDATE_ERROR: 'Failed to update review status. Please try again.',
  MERGE_FLAG_ERROR: 'Failed to update merge flag. Please try again.',
  RESOLVE_ERROR: 'Failed to resolve duplicate set. Please try again.',
} as const;

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  PENDG: 'Pending',
  INVAL: 'Invalid',
  RESOL: 'Resolved'
};

export const CHECK_SECTION_CONFIG: { key: InvestCheckSection; label: string; buttonLabel: string; category: ReviewCategoryType; disabled?: boolean }[] = [
  { key: 'demographics', label: 'Demographics', buttonLabel: 'OPEN DEMOGRAPHICS', category: 'Demographics' },
  { key: 'keydata', label: 'Modify Key Details', buttonLabel: 'OPEN MODIFY KEY DETAILS', category: 'Keydata' },
  { key: 'interdictions', label: 'Interdictions', buttonLabel: 'OPEN INTERDICTIONS', category: 'Interdictions' },
  { key: 'donations', label: 'Donations', buttonLabel: 'OPEN DONATIONS', category: 'Donations' },
  { key: 'attributes', label: 'Attributes', buttonLabel: 'OPEN ATTRIBUTES', category: 'Attributes' },
];

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

export const SECTION_TO_CATEGORY: Record<InvestCheckSection, ReviewCategoryType> = {
  demographics: 'Demographics',
  keydata: 'Keydata',
  interdictions: 'Interdictions',
  donations: 'Donations',
  attributes: 'Attributes',
};

export interface CreateSetDonorData {
  name: string;
  dob: string;
  gender: string;
  address: string;
  workPhone: string;
  homePhone: string;
}

export interface CreateSetRow {
  id: number;
  form: import('@angular/forms').FormGroup;
  donorLoading: boolean;
  donorValid: boolean | null;
  donorData: CreateSetDonorData | null;
  errors?: { [key: string]: string };
}
