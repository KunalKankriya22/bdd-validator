/**
 * Master Service Code Models
 * Based on API documentation: master-service-codes-api-documentation.md
 */

/**
 * Response DTO for Master Service Code
 */
export interface MasterServiceCodeDto {
  billingCode: string;
  codeDesc: string;
  effDate: string;
  termDate?: string | null;
  lastModifiedDate?: string | null;
  auditKey?: number | null;
  programId?: string | null;
}

/**
 * Request DTO for creating a new Master Service Code
 */
export interface CreateMasterServiceCodeDto {
  billingCode: string;      // Max 12 chars, will be uppercased
  codeDesc: string;          // Max 50 chars, required
  effDate: string;           // >= chapter local date for new records
  termDate?: string | null;  // >= effDate if provided
}

/**
 * Request DTO for updating an existing Master Service Code
 */
export interface UpdateMasterServiceCodeDto {
  codeDesc: string;          // Max 50 chars, required
  effDate: string;           // Required (no past date check for updates)
  termDate?: string | null;  // >= effDate if provided
}

/**
 * Request DTO for querying/filtering Master Service Codes
 */
export interface MasterServiceCodeQueryDto {
  billingCode?: string | null;      // Filter by billing code (partial, case-insensitive)
  codeDesc?: string | null;          // Filter by description (partial, case-insensitive)
  effDateFrom?: string | null;       // Filter from effective date
  effDateTo?: string | null;         // Filter to effective date
  termDateFrom?: string | null;      // Filter from termination date
  termDateTo?: string | null;        // Filter to termination date
  searchKeyword?: string | null;     // Search across billing code AND description
  sortColumn?: string | null;        // Column to sort by
  sortOrder?: 'ASC' | 'DESC' | null; // Sort order
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  total?: number;
  errorCode?: string | null;
  error?: string | null;
  item?: boolean;
}

/**
 * Filter options for the UI
 */
export interface MasterServiceCodeFilterOptions {
  effectiveDatePeriod: 'After' | 'Before' | null;
  effectiveDate: Date | null;
  terminationDatePeriod: 'After' | 'Before' | null;
  terminationDate: Date | null;
}

/**
 * Table display model
 */
export interface MasterServiceCodeTableRow {
  billingCode: string;
  codeDesc: string;
  effDate: string;
  termDate: string | null;
  lastModifiedDate?: string | null;
}
