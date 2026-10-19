export type UnitValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

export interface DonationRecord {
  transactionId: string;
  unitId: string;
  formattedUnitId?: string;
  deferralId?: string;
  collectionDate: string;
  donationType: string;
  deferralReason?: string;
  procedureCode: string;
  auditFlag: string;
  driveId: string;
  chapterId?: string;
  programId?: string;
  setId?: string;
  insertDate?: string;
  isNew?: boolean;
  isDeleted?: boolean;
  isModified?: boolean;
}

export interface BatchInfo {
  createdBy: string;
  driveDate: string;
  driveName: string;
}

export interface DriveOption {
  driveId: string;
  driveDate: string;
  sponsorName: string;
  projectedDraw: number;
}

export interface DonationTypeOption {
  code: string;
  description: string;
}

export interface ProcedureCodeOption {
  code: string;
  description: string;
}

export interface SearchCriteria {
  unitId?: string;
  deferralId?: string;
  newDate?: string;
  newDriveId?: string;
}

export interface RetrieveRequest {
  chapterId: string;
  unitId?: string;
  deferralId?: string;
  newDate?: string;
  newDriveId?: string;
}

export interface RetrieveResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DonationRecord[];
  total: number;
  batchInfo?: BatchInfo;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface UpdateDriveRequest {
  setId?: string;
  unitId?: string;
  deferralId?: string;
  newCollectionDate?: string;
  newDriveId?: string;
  transactionIds: string[];
}

export interface ValidateRequest {
  chapterId: string;
  transactionId: string;
  newCollectionDate?: string;
  newDriveId?: string;
}

export interface ValidateResponse {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface UpdteDrivParam {
  value: number;
  description: string;
}

export interface TableRow {
  unitDeferralId: string;
  collectionDate: string;
  transactionId: string;
  donationType: string;
  procedureCode: string;
  ac: string;
  driveId: string;
  originalData: DonationRecord;
}

export const AC_OPTIONS = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' }
];
