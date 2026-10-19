export interface RegisteredDeferralRow {
  deferralId: string;
  transactionId: string;
  setId: string;
  driveId: string;
  donorId: string;
  donationType: string;
  procedureCode: string;
  user: string;
  dateTimeOfRegistration: string;
  auditComplete: string;
  driveDate?: string;
}

export interface RegisteredDeferralsQueryRequest {
  driveDateFrom: string;
  driveDateTo: string;
  driveId: string;
  user: string;
  deferralId: string;
  transactionId: string;
  setId: string;
  chapterId: string;
  sortField: string;
  sortDirection: string;
}

export interface LookupOption {
  code: string;
  description: string;
}

export interface RegisteredDeferralsLookups {
  driveIds: LookupOption[];
  users: LookupOption[];
  deferralIds: LookupOption[];
  transactionIds: LookupOption[];
  setIds: LookupOption[];
}

export interface ErrorResponse {
  errorCode: string;
  error: string;
}

export interface RegisteredDeferralsLookupsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: RegisteredDeferralsLookups;
  errorResponse: ErrorResponse;
}

export interface RegisteredDeferralsQueryResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: RegisteredDeferralRow[];
  total: number;
  errorResponse: ErrorResponse;
}
