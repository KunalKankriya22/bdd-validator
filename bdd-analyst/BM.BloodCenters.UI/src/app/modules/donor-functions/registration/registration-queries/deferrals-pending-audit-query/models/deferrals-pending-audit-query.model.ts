// Request DTO for searching deferrals pending audit
export interface DeferralsPendingAuditQueryDto {
  fromDate?: string | null;
  toDate?: string | null;
  driveId?: string | null;
  status: string;
  donationType?: string | null;
  procedureCode?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string;
  take?: number;
  skip?: number;
}

// Response DTO for individual deferral pending audit record
export interface DeferralsPendingAuditDto {
  driveId: string;
  deferralId: string;
  transactionId: string;
  driveDate: string;
  donorId: string | null;
  donationType: string | null;
  procedureCode: string | null;
  user: string;
  insertedDate: string;
}

// Search response wrapper
export interface DeferralsPendingAuditSearchResponse {
  resp: DeferralsPendingAuditDto[];
  donationType: DonationTypeOption[];
  procedureCode: ProcedureCodeOption[];
}

// API response wrapper
export interface DeferralsPendingAuditApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DeferralsPendingAuditSearchResponse;
  totalCount: number;
}

export interface DriveOption {
  driveId: string;
  driveDate?: string;
  sponsorName?: string;
}

export interface StatusOption {
  code: string;
  description: string;
}

export interface DonationTypeOption {
  value: string;
  label: string;
}

export interface ProcedureCodeOption {
  value: string;
  label: string;
}

export interface FilterOptionsResponse {
  donationTypes: DonationTypeOption[];
  procedureCodes: ProcedureCodeOption[];
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: T[];
  totalCount?: number;
  total?: number;
  item?: T;
}
