/**
 * Release Audit Holds Models
 * Defines data structures for audit hold records and API requests/responses
 */

/**
 * Represents a single audit hold record
 */
export interface AuditHoldRecord {
  unitId: string;
  collectionDate: string | Date;
  name: string;
  dateOfBirth: string | Date;
  sex: string;
  donorId: string;
  donationType: string;
  donationProcedure: string;
  hold: string;
  origin: string;
  reason: string;
  removed: string | null;
  transactionId: string;
  interDescription: string;
  groupId: string;
  groupMode: string;
  sourceCode: string;
  holdSource: string;
  effectiveDate: string | Date;
  insertDate: string | Date;
  termDate: string | null;
  releaseUser: string | null;
}

/**
 * Search criteria for retrieving audit holds
 */
export interface AuditHoldSearchCriteria {
  fromCollectionDate?: string;
  toCollectionDate?: string;
  unitId?: string;
}

/**
 * Filter values for audit holds
 */
export interface AuditHoldFilterValue {
  donationType?: string;
  donationProcedure?: string;
  auditHoldType?: string;
  collectionDate?: string;
}

/**
 * API request parameters for querying audit holds
 */
export interface AuditHoldsParamsDto extends AuditHoldSearchCriteria {
  searchKeyword?: string;
  sort?: string;
  donationType?: string;
  donationProcedure?: string;
  auditHoldType?: string;
  collectionDate?: string;
}

/**
 * Paginated API response for audit holds
 */
export interface AuditHoldsResponse {
  data: AuditHoldRecord[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
}

/**
 * Hold detail record (for hold details dialog)
 */
export interface HoldDetailRecord {
  type: string;
  code: string;
  description: string;
  unitId: string | null;
  displayUnitId: string | null;
  entryDate: string | Date;
  effectiveDate: string | Date;
  terminationDate: string | Date | null;
  insUser: string | null;
  relDate: string | Date | null;
  relUser: string | null;
  comments: string | null;
}

/**
 * Hold details for a unit (includes both unit holds and donor holds)
 */
export interface HoldDetails {
  unitHolds: {
    unitId: string;
    collectionDate: string | Date;
    holds: HoldDetailRecord[];
  };
  donorHolds: {
    unitId: string;
    collectionDate: string | Date;
    holds: HoldDetailRecord[];
  };
}

/**
 * Request payload for removing a hold (OK or NFT)
 */
export interface RemoveHoldWithOkRequest {
  unitId: string;
  collectionDate: string | Date;
  code: string;
  description: string;
  reason: string;
  terminationDate: string | Date;
  deferDonor: string;
  effectiveDate: string | Date;
  deferThrough: Date | null;
  comments: string;
  acknowledged: boolean;
}

export type RemoveHoldWithNftRequest = RemoveHoldWithOkRequest;

/**
 * Filter values for hold details panel
 */
export interface HoldDetailsFilterValue {
  holds?: string;
  entryDatePeriod?: string;
  entryDate?: string | Date;
  terminationDatePeriod?: string;
  terminationDate?: string | Date;
}

/**
 * Dropdown option for filters
 */
export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * Response for hold reason
 */
export interface HoldReasonResponse {
  reason: string;
}

/**
 * Request payload for getting hold comments
 */
export interface GetHoldCommentsRequest {
  transactionId: string;
  interCode: string;
  donorId: string;
  originatedFrom: string;
  reasonCode: string;
  groupId: string;
  groupMode: string;
}

/**
 * Response for hold comments
 */
export interface HoldCommentsResponse {
  comments: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

/**
 * Generic backend API response structure
 */
export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error?: string;
  errorCode?: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
}

/**
 * Request payload for fetching unit holds or donor holds
 */
export interface HoldDetailsRequest {
  transactionId: string;
  donorId: string;
  holds?: string;
  entryDatePeriod?: string;
  entryDateFrom?: string | null;
  entryDateTo?: string | null;
  terminationDatePeriod?: string;
  terminationDateFrom?: string | null;
  terminationDateTo?: string | null;
  sortColumn?: string;
  sortDir?: string;
}

/**
 * Single hold detail record from the unit-holds / donor-holds API response
 */
export interface HoldDetailApiRecord {
  interType: string;
  interCode: string;
  description: string;
  unitId: string | null;
  displayUnitId: string | null;
  entryDate: string | null;
  effDate: string | null;
  terminationDate: string | null;
  insertUser: string;
  releaseDate: string | null;
  releaseUser: string;
  comments: string | null;
}

/**
 * API response wrapper for unit-holds / donor-holds endpoints
 */
export interface HoldDetailApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: HoldDetailApiRecord[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Donation unit details (GET /unit/{unitId})
 */
export interface DonationUnit {
  unitId: string;
  collDate: string;
  donorId: string;
  transactionId: string;
  donationType: string;
  procedureCode: string;
  chapterId: string;
}

/**
 * Request for getting holds (POST /holds)
 */
export interface GetHoldsRequest {
  startDate: string;
  endDate: string;
  unitId?: string;
  donationType?: string;
  procedureCode?: string;
  auditHoldType?: string;
  collectionDate?: string;
  searchText?: string;
  sortDirection?: string;
}

/**
 * Single hold record from GET holds endpoint
 */
export interface HoldRecord {
  transactionId: string;
  unitId: string;
  collDate: string;
  interCode: string;
  interDescription: string;
  originatedFrom: string;
  reasonCode: string;
  groupId: string;
  groupMode: string;
  effectiveDate: string;
  insertDate: string;
  termDate: string | null;
  donorId: string;
  donorName: string;
  dateOfBirth: string;
  gender: string;
  donationType: string;
  procedureCode: string;
  sourceCode: string;
  holdSource: string;
  releaseUser: string | null;
}

/**
 * Request for placing a hold (POST /unit/{unitId}/hold)
 */
export interface PlaceHoldRequest {
  interCode: string;
  effectiveDate: string;
  dateThrough?: string;
  placeNft?: string;
  originatedFrom?: string;
  reasonCode?: string;
  sourceCode?: string;
  groupMode?: string;
  groupId?: string;
  transactionId?: string;
  collDate?: string;
  comments?: string | null;
}

/**
 * Request for removing a hold (POST /unit/{unitId}/hold/remove)
 */
export interface RemoveHoldRequest {
  interCode: string;
  transactionId: string;
  placeNft: string;
  reasonCode?: string | null;
  termDate?: string | null;
  deferDonor?: string | null;
  effDate?: string | null;
  dateThrough?: string | null;
  comments?: string | null;
  originatedFrom?: string | null;
  groupMode?: string | null;
  groupId?: string | null;
  donorId?: string | null;
  collDate?: string | null;
  sourceCode?: string | null;
  removeReasonCode?: string | null;
}

/**
 * Interdiction code (LOV)
 */
export interface InterdictionCode {
  code: string;
  description: string;
}

/**
 * Defer donor configuration returned by GET /defer-donor-config
 */
export interface DeferDonorConfig {
  isDeferDonorEnabled: boolean;
  options: DropdownOption[];
  defaultTermDate: string;
  defaultEffDateOk: string;
  defaultEffDateNft: string;
}
