// Response models
export interface EligiblePlasmaCellLossRecord {
  cellType: string;
  description: string;
  minWeight: number | null;
  maxWeight: number | null;
  auditKey: string;
  maxLoss: number;
  period: number;
  effectiveDate: string;
  terminationDate: string | null;
}

export interface EligiblePlasmaCellLossRecordDetail {
  cellType: string;
  description: string;
  minWeight: number | null;
  maxWeight: number | null;
  auditKey: string;
  maxLoss: number;
  period: number;
  effectiveDate: string;
  terminationDate: string | null;
}

// Request models
export interface AddEligiblePlasmaCellLossRequest {
  cellType: string;
  fromWeight: number;
  toWeight: number;
  maximumLoss: number;
  daysBetween: number;
  effDate: string;
  termDate: string | null;
  chapterId: string;
  programId: string;
}

export interface UpdateEligiblePlasmaCellLossRequest {
  cellType: string;
  fromWeight: number;
  toWeight: number;
  maximumLoss: number;
  daysBetween: number;
  effDate: string;
  termDate: string | null;
  chapterId: string;
  programId: string;
}

export interface ValidateDuplicateRequest {
  cellType: string;
  effDate: string;
  chapterId: string;
  excludeAuditKey?: string;
}

export interface ValidateDuplicateResponse {
  isDuplicate: boolean;
  message: string;
}

export interface ApiResponse {
  message: string;
}

// Lookup models
export interface CellType {
  code: string;
  description: string;
}

// Filter options models
export interface CellTypeOption {
  value: string;
  label: string;
}

export interface StatusOption {
  value: string;
  label: string;
}

export interface FilterOptions {
  cellTypes: CellTypeOption[];
  statusOptions: StatusOption[];
}

// Paginated response model
export interface PaginatedResponse<T> {
  records: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
}

// Query parameters for get-records
export interface GetRecordsParams {
  cellType?: string | null;
  status?: string;
  searchText?: string | null;
  chapterId?: string | null;
  sort?: string | null;
  skip?: number | null;
  take?: number | null;
}
