export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  total: number;
  error: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface DeferralHoldModel {
  deferralId: string;
  transactionId: string;
  batchId: string;
  driveId: string;
  donorId: string;
  collDate: string;
  donorName: string;
  donationType: string;
  procedureCode: string;
  user: string;
  dateTimeOfRegistration: string;
  auditComplete: string;
}

export interface DeferralHoldQueryDto {
  driveDateFrom?: string;
  driveDateTo?: string;
  driveId?: string;
  batchId?: string;
  deferralId?: string;
  transactionId?: string;
  userId?: string;
  interdictionCode?: string;
  sortBy?: string;
  sortDirection?: string;
}

export interface HoldReasonDialogData {
  deferralId: string;
  transactionId: string;
  donorId: string;
  donorName: string;
}

export interface DonorInterdictionModel {
  type: string;
  code: string;
  description: string;
  originatedFrom: string;
  entryDate: string;
  effectiveDate: string;
  terminationDate: string;
}

export interface DonationInterdictionModel {
  type: string;
  code: string;
  description: string;
  entryDate: string;
  terminationDate: string;
  comment: string;
}

export interface LookupDto {
  code: string;
  description: string;
}

export interface ApiDeferralHoldSearchParamDto {
  searchKeyword?: string;
  fromDate?: string;
  toDate?: string;
  driveId?: string;
  setId?: string;
  deferralId?: string;
  transactionId?: string;
  userId?: string;
  interCode?: string;
  sort?: string;
  sortColumn?: string;
}

export interface ApiDeferralHoldDto {
  deferralId: string;
  transactionId: string;
  setId: string | null;
  driveId: string;
  donorId: string;
  donorName: string;
  collDate: string | null;
  donationType: string;
  procedureCode: string;
  insertUser: string;
  insertUserName: string;
  insertDate: string | null;
  nAuditFlag: string;
}

export interface ApiDonorInterdictionDto {
  interType: string;
  interCode: string;
  interDescription: string;
  originatedFrom: string;
  effDate: string | null;
  termDate: string | null;
  insertDate: string | null;
  donorId: string;
  donorName: string;
}

export interface ApiDonationInterdictionDto {
  interType: string;
  interCode: string;
  reason: string;
  transactionId: string;
  unitId: string;
  insertDate: string | null;
  termDate: string | null;
  comments: string;
}

export interface ApiDriveLovDto {
  driveId: string;
  driveDate: string;
  sponsorName: string;
}

export interface ApiUserLovDto {
  userId: string;
  userName: string;
}

export interface ApiTransactionLovDto {
  transactionId: string;
  collDate: string;
}

export interface ApiInterdictionCodeLovDto {
  interCode: string;
  interDesc: string;
}

export interface ApiDeferralLovDto {
  deferralId: string;
}

export interface ApiSetLovDto {
  setId: string;
  collDate: string;
}


