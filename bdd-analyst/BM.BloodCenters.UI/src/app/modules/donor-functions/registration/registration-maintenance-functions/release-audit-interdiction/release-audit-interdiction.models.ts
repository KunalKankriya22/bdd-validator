export type SearchOption = 'donation' | 'deferral';

export interface SearchRequest {
  option: SearchOption;
  unitId?: string;
  deferralId?: string;
  collDate?: string;
}

export interface DonationInfo {
  donationType: string;
  procedureType: string;
  driveId: string;
  donorCue: string;
  numberOfOtherInterdictions: number;
  collectionDate: string;
}

export interface DonorInfo {
  name: string;
  aboType: string;
  dateOfBirth: string;
  sex: string;
  donorIdNumber: string;
}

export interface Interdiction {
  interCode: string;
  interType: string;
  effectiveDate: string;
  terminationDate: string;
  releaseDate: string | null;
  releasedUser: string;
  insertedUser: string;
  originated: string;
  reason: string;
  groupMode: string;
  groupId: string;
  interDescription: string;
  reasonRequired: boolean;
  isPermanentDeferral: boolean;
  canRelease: boolean;
  canRemove: boolean;
}

export interface SearchResponseData {
  donationInfo: DonationInfo;
  donorInfo: DonorInfo;
  interdictions: Interdiction[];
  transactionId: string;
  donorId: string;
  hasHiddenInterdictions: boolean;
}

export interface ErrorResponse {
  errorCode: string;
  error: string;
}

export interface SearchResponse {
  success: boolean;
  message?: string;
  statusCode: number;
  item?: SearchResponseData;
  data?: SearchResponseData[];
  error?: string;
  errorCode?: string;
  errorResponse?: ErrorResponse;
  total?: number;
}

export interface ReleaseRequest {
  transactionId: string;
  interCode: string;
  interType: string;
  terminationDate: string | null;
  originatedFrom: string | null;
  reasonCode: string | null;
  groupId: string | null;
  groupMode: string | null;
}

export interface ReleaseResponse {
  success: boolean;
  message?: string;
  statusCode: number;
  item?: unknown;
  data?: unknown[];
  error?: string;
  errorCode?: string;
  errorResponse?: ErrorResponse;
  total?: number;
}

export interface RemovalReason {
  code: string;
  description: string;
}

export interface RemovalReasonsResponse {
  success: boolean;
  item?: RemovalReason[];
  error?: string;
  errorCode?: string;
  errorResponse?: ErrorResponse;
}

export interface RemoveRequest {
  transactionId: string;
  interCode: string;
  originatedFrom: string | null;
  reasonCode: string | null;
  groupMode: string | null;
  groupId: string | null;
  unitId: string | null;
  deferralId: string | null;
  collDate: string | null;
  termDate: string;
  removalReasonCode: string | null;
}

export interface TerminatedInterdictionsResponse {
  success: boolean;
  item?: Interdiction[];
  error?: string;
  errorCode?: string;
  errorResponse?: ErrorResponse;
}
