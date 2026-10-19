export interface DonationsOnHoldApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  total: number;
  appliedFromDate?: string;
  appliedToDate?: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface DonationOnHold {
  unitId: string;
  displayUnitId: string;
  driveId: string;
  collDate: string;
  donorId: string;
  donationType: string;
  procedureCode: string;
  insertUser: string;
  insertDate: string;
  auditFlag: string;
  transactionId: string;
}

export interface DonationsOnHoldRequest {
  ShowTerminated: boolean;
  FromDate?: string;
  ToDate?: string;
  DriveId?: string;
  UserId?: string;
  UnitId?: string;
  DonationType?: string;
  ProcedureCode?: string;
  HoldCodes?: string[];
  SortColumn?: string;
  SortOrder?: string;
  ChapterId?: string;
  LoggedInUserName?: string;
}

export interface DonationHoldDetail {
  interType: string;
  holdCode: string;
  description: string;
  effectiveDate: string;
  terminationDate: string;
  comments: string;
  status: string;
  createdBy: string;
  createdDate: string;
}

export interface DonorHoldDetail {
  interType: string;
  holdCode: string;
  description: string;
  effectiveDate: string;
  terminationDate: string;
  status: string;
  interdictionCode: string;
  donorId: string;
  createdBy: string;
  createdDate: string;
}

export interface HoldReasonDialogData {
  unitId: string;
  collDate: string;
  donorId: string;
  donorName: string;
  transactionId: string;
}

export interface LookupsApiResponse {
  item?: LookupsData;
  data?: LookupsData;
  drives?: LookupItem[];
  users?: LookupItem[];
  donationTypes?: LookupItem[];
  procedureCodes?: LookupItem[];
  holdCodes?: LookupItem[];
}

export interface LookupsData {
  drives: LookupItem[];
  users: LookupItem[];
  donationTypes: LookupItem[];
  procedureCodes: LookupItem[];
  holdCodes: LookupItem[];
}

export interface LookupItem {
  code: string;
  description: string;
}

export interface LookupOption {
  code: string;
  description: string;
}

export interface DonationsOnHoldLookups {
  showTerms: LookupOption[];
  drives: LookupOption[];
  users: LookupOption[];
  donationTypes: LookupOption[];
  procedureCodes: LookupOption[];
  holds: LookupOption[];
}
