export interface SearchParams {
  option: string; // N (Donation) or D (Deferral)
  unitId?: string;
  collectionDate?: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss
  deferralId?: string;
  transactionId?: string;
  chapterId: string;
  userId: string;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  statusCode: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
  item?: {
    transactionId: string;
    unitId: string;
    deferralId?: string;
    donationType: string;
    donationTypeDesc: string;
    procedure: string;
    procedureDesc: string;
    driveId: string;
    collectionDate: string; // ISO date
    donorId: string;
    donorName: string;
    dateOfBirth: string; // ISO date
    gender: string;
    bloodType: string;
    bloodTypeDesc: string;
    activeInterdictions: ActiveInterdiction[];
    terminatedInterdictionCount: number;
    otherInterdictionCount: number;
  };
}

export interface ActiveInterdiction {
  interCode: string;
  interDesc: string;
  interType: string;
  insertDate: string; // ISO date
  insertUser: string;
  groupMode: string;
  groupId: string;
  terminationDate?: string;
  terminationReason?: string;
  terminationReasonDesc?: string;
  // Additional fields present in API responses
  termDate?: string; // Alternative field name for terminationDate
  releaseDate?: string;
  releaseUser?: string;
  originatedFrom?: string;
  reasonCode?: string; // Alternative field name for terminationReason
  isTerminated?: boolean;
  isReleased?: boolean;
  canTerminate?: boolean; // Backend determines if terminate action is allowed
  canRelease?: boolean; // Backend determines if release action is allowed
}

export interface DonorInfo {
  donationType: string;
  bloodCollectionType: string;
  plantId: string;
  donorChf: string;
  numberOfOtherInterdictions: number;
  name: string;
  abo: string;
  dateOfBirth: string; // DD-MON-YYYY
  sex: string;
  donorId: string;
}

export interface GetInterdictionsParams {
  transactionId: string;
  includeTerminated: boolean;
  interType?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

export interface GetInterdictionsResponse {
  data: ActiveInterdiction[];
}

export interface UnitInterdiction {
  id: string;
  transactionId: string;
  code: string;
  description: string;
  type: string;
  effectiveDate: string; // ISO date string
  terminationDate?: string; // ISO date string
  releaseDate?: string; // ISO date string
  userId: string;
  releaseUser?: string;
  originated: string;
  reason?: string;
  reasonDescription?: string;
  groupMode?: string;
  groupId?: string;
  comments?: string;
  isTerminated: boolean;
  isReleased: boolean;
  canTerminate: boolean; // Backend determines if terminate action is allowed
  canRelease: boolean; // Backend determines if release action is allowed
}

export interface CreateInterdictionsRequest {
  transactionId: string;
  interdictions: CreateInterdictionDto[];
}

export interface CreateInterdictionDto {
  interCode: string;
  termDate?: string | null; // ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ or null
  comments?: string;
}

export interface TerminateInterdictionRequest {
  transactionId: string;
  interCode: string;
  interType: string;
  insertDate: string; // YYYY-MM-DD (required) - effective date
  terminationDate: string; // YYYY-MM-DD (required)
  reasonCode: string;
  comments?: string;
}

export interface ReleaseInterdictionRequest {
  transactionId: string;
  interCode: string;
  interType: string;
  insertDate: string; // YYYY-MM-DD (required) - effective date
  terminationDate?: string; // YYYY-MM-DD (optional - use existing if available)
  originatedFrom?: string | null; // Required for unique WHERE clause (GAP #0 Fix)
  reasonCode?: string | null; // Required for unique WHERE clause (GAP #0 Fix)
  groupId?: string | null; // Required for unique WHERE clause (GAP #0 Fix)
  groupMode?: string | null; // Required for unique WHERE clause (GAP #0 Fix)
  comments?: string;
}

export interface InterdictionCode {
  code: string;
  description: string;
  type: string;
}

export interface InterdictionCodeApiItem {
  interCode: string;
  interType: string;
  interDesc: string;
  viewLevel: number;
}

export interface InterdictionCodesResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: InterdictionCodeApiItem[];
}

export interface TerminationReason {
  code: string;
  description: string;
}

export interface TerminationReasonsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: TerminationReason[];
}

export interface SearchOption {
  value: string;
  label: string;
}

export interface UnitInterdictionFilterValue {
  codes?: string[];
  types?: string[];
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  terminationDateFrom?: string;
  terminationDateTo?: string;
  userIds?: string[];
  originated?: string[];
  reasons?: string[];
}

export interface UnitInterdictionParamsDto {
  transactionId?: string;
  includeTerminated?: boolean;
  searchText?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  filters?: UnitInterdictionFilterValue;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface SearchOptionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: {
    searchModes: SearchOption[];
  };
}
