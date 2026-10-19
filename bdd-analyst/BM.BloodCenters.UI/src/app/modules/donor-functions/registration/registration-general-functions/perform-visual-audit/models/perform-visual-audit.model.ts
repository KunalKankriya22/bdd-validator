export type AuditOption = 'Donation' | 'Deferral';
export type AuditDecision = 'OK' | 'HOLD';
export type DeferralDecision = 'NODEF' | 'TDEF' | 'PDEF';

export interface HoldReason {
  code: string;
  description: string;
}

export interface ResetOption {
  code: string;
  description: string;
}

export interface AuditUnit {
  unitId?: string;
  deferralId?: string;
  transactionId?: string;
  audit: AuditDecision;
  deferralDecision?: DeferralDecision;
  auditStatus?: string;
  collectionDate: string;
  donationType: string;
  procedureCode: string;
  holdReason?: string;
  deferralReason?: string;
  deferralType?: string;
  deferralCode?: string;
  deferredThrough?: string;
  deferredThroughDate?: string;
  deferredTill?: string;
  donorId?: string;
  isModified?: boolean;
  __isInputRow?: boolean;
}

export interface DonorDetails {
  donorId: string;
  name: string;
  dateOfBirth: string;
  sex: string;
}

export interface SearchUnitRequest {
  option: AuditOption;
  unitId?: string;
  deferralId?: string;
  chapterId?: string;
  forReset?: boolean;
  collectionDate?: string;
}

export interface SaveAuditRequest {
  option: AuditOption;
  chapterId: string;
  units: SaveAuditUnit[];
}

export interface SaveAuditUnit {
  unitId?: string;
  deferralId?: string;
  transactionId?: string;
  audit?: AuditDecision;
  deferralType?: DeferralDecision;
  holdReason?: string;
  deferredTill?: string | null;
  collectionDate: string;
  donationType?: string;
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T;
  item?: T;
}

export interface SearchUnitResponse {
  donorDetails: DonorDetails;
  units: AuditUnit[];
  multipleCollectionDates?: boolean;
}

export interface AuditCounts {
  totalDonations: number;
  totalHolds: number;
  totalOks: number;
}

export interface DeferralCounts {
  noDef: number;
  tempDef: number;
  indDef: number;
}

export interface ResetAuditForm {
  option: AuditOption;
  id: string;
  donorId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  currentAuditStatus: string;
  currentReason: string;
  newAuditStatus: string;
  holdReason: string;
}

export interface ResetAuditRequest {
  option: AuditOption;
  unitId?: string;
  deferralId?: string;
  newStatus: string | null;
  holdReason?: string | null;
  chapterId?: string;
}
