// Request DTO for searching donations pending audit
export interface DonationsPendingAuditQueryDto {
  fromDate?: string | null;        // YYYY-MM-DD format
  toDate?: string | null;          // YYYY-MM-DD format
  driveId?: string | null;
  status: string;                  // A (All), R (Ready for Audit), or N (No Donor)
  donationType?: string | null;    // Exact match filter for donation type
  procedureCode?: string | null;   // Exact match filter for procedure code
  searchKeyword?: string | null;   // Partial search in Drive ID or Donor ID
  sortColumn?: string | null;
  sortOrder?: string;              // ASC or DESC
  take?: number;
  skip?: number;
}

// Response DTO for individual donation pending audit record
export interface DonationsPendingAuditDto {
  unitId: string;
  driveId: string;
  collDate: string;                // ISO date string
  donorId: string | null;
  donationType: string | null;
  procedureCode: string | null;
  insertUser: string;
  insertDate: string;              // ISO datetime string
  transactionId: string | null;
}

// Search response wrapper
export interface DonationsPendingAuditSearchResponse {
  resp: DonationsPendingAuditDto[];
  donationType: DonationTypeOption[];
  procedureCode: ProcedureCodeOption[];
}

// API response wrapper
export interface DonationsPendingAuditApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DonationsPendingAuditSearchResponse;
  totalCount: number;
}

// Dropdown options
export interface StatusOption {
  code: string;                    // A, R, N
  description: string;
}

export interface DriveOption {
  driveId: string;
  sponsorName: string | null;
  driveDate: string | null;
}

export interface DonationTypeOption {
  value: string;
  label: string;
}

export interface ProcedureCodeOption {
  value: string;
  label: string;
}

// API Response wrapper (generic)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  totalCount?: number;
}

// Generic return result wrapper used by service
export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: T[];
  totalCount?: number;
  total?: number;
  item?: T;
}
