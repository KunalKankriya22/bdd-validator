/**
 * AntigenTestModel
 * Represents an antigen test record
 */
export interface AntigenTestModel {
  code?: string;
  description?: string;
  price?: number | null;
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
  modificationDate?: Date | null;
}

/**
 * API Response for Antigen Tests (New Structure)
 */
export interface AntigenTestApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: AntigenTestModel[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Request DTO for fetching Antigen Test data
 * POST /api/v1/application-administration/antigen-test/details/{take}/{skip}
 * Matches backend: AntigenTestDetailsParamDto
 */
export interface AntigenTestParamsDto {
  searchKeyword?: string;
  price?: number | null;
  priceRange?: string | null;  // 'Over', 'Under' (backend uses 'PriceRange' not 'pricePeriod')
  effectiveDate?: string | null;  // Format: ISO 8601
  effectiveDatePeriod?: string | null;  // 'After', 'Before' (backend uses 'EffectiveDatePeriod' not 'effectivePeriod')
  terminationDate?: string | null;  // Format: ISO 8601
  terminationDatePeriod?: string | null;  // 'After', 'Before' (backend uses 'TerminationDatePeriod' not 'terminationPeriod')
  localChapterId?: string;
  /** Sort direction: 'A' for ascending, 'D' for descending (sorts by code column) */
  sort?: 'A' | 'D';
  /** Number of records to skip (for pagination) - passed in URL, not body */
  skip?: number;
  /** Number of records to return (for pagination) - passed in URL, not body */
  take?: number;
}

export type SortDirection = 'A' | 'D' | 'default';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface AntigenTestFilterValue {
  priceRange: string | null;  // 'Over', 'Under'
  price: number | null;
  effectiveDatePeriod: string | null;  // 'After', 'Before'
  effectiveDate: Date | null;
  terminationDatePeriod: string | null;  // 'After', 'Before'
  terminationDate: Date | null;
}

/**
 * DTO for adding new Antigen Test record
 * POST /api/v1/distribution-master-codes/antigen-test-details
 */
export interface AntigenTestDto {
  code: string;  // Max 10 characters, required
  description: string;  // Max 50 characters, required
  price?: number | null;
  effectiveDate: string;  // Required, format: yyyy-MM-dd
  terminationDate?: string | null;  // Optional, format: yyyy-MM-dd
}

/**
 * DTO for updating existing Antigen Test record
 * PUT /api/v1/distribution-master-codes/antigen-test-details/{code}
 */
export interface UpdateAntigenTestDto {
  description: string;  // Max 50 characters, required
  price?: number | null;
  effectiveDate: string;  // Required, format: yyyy-MM-dd
  terminationDate?: string | null;  // Optional, format: yyyy-MM-dd
}

/**
 * DTO for bulk upsert record (add or update)
 * POST /api/v1/application-administration/antigen-test/details/bulk-upsert
 * Matches backend: AntigenTestUpsertItemDto
 */
export interface BulkUpsertRecordDto {
  addRecord: boolean;  // true for add, false for update
  code: string;
  description: string;
  price: number | null;
  effectiveDate: string;  // format: yyyy-MM-dd - will be converted to DateTime on backend
  terminationDate: string | null;  // format: yyyy-MM-dd or null - will be converted to DateTime on backend
}

/**
 * Request DTO for bulk upsert
 * Matches backend: AntigenTestBulkUpsertDto
 */
export interface BulkUpsertRequestDto {
  records: BulkUpsertRecordDto[];
  programId?: string;  // Optional, defaults to 'VSANTGN' on backend if not provided
}

/**
 * Response DTO for bulk upsert
 */
export interface BulkUpsertResponseDto {
  totalRecords: number;
  createdCount: number;
  updatedCount: number;
  failureCount: number;
  successCount: number;
  errors: any[];
  success: boolean;
  message: string;
  errorCode: string | null;
}
