/**
 * Regional Testing Contract Models
 * Based on API documentation: rgicntct-api-documentation.md
 */

/**
 * Response DTO for Regional Testing Contract
 */
export interface RegionalTestingContractDto {
  contractId: string;
  chapterId: string;
  contractType: string; // R, T, S
  customerName: string;
  customerId: string;
  exportCode: string;
  agreementDate?: string | null;
  effDate: string;
  termDate?: string | null;
  addressId?: number | null;
  contactName: string;
  lastModifiedDate: string;
  programId: string;
  auditKey: number;
}

/**
 * Request DTO for creating a new Regional Testing Contract
 */
export interface CreateRegionalTestingContractDto {
  contractType: string; // R, T, or S
  customerName: string;
  customerId: string;
  exportCode: string;
  agreementDate?: string | null;
  effDate: string; // Required, cannot be in past (create only)
  termDate?: string | null; // Must be >= effDate if provided
  addressId?: number | null;
}

/**
 * Request DTO for updating an existing Regional Testing Contract
 */
export interface UpdateRegionalTestingContractDto {
  contractType: string; // R, T, or S
  customerName: string;
  customerId: string;
  exportCode: string;
  agreementDate?: string | null;
  effDate: string; // Required (past dates allowed on update)
  termDate?: string | null; // Must be >= effDate if provided
  addressId?: number | null;
}

/**
 * Request DTO for querying/filtering Regional Testing Contracts
 */
export interface RegionalTestingContractQueryDto {
  contractType?: string | null; // R, T, or S
  searchKeyword?: string | null; // Search across customer names
  showTerminated?: boolean; // Include terminated contracts (default: false)
  sortColumn?: string | null; // Column to sort by
  sortOrder?: 'ASC' | 'DESC' | null; // Sort order
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T[];
  totalCount?: number;
  errorCode?: string | null;
}

/**
 * Contract type options
 */
export interface ContractTypeOption {
  value: string;
  label: string;
}

/**
 * Table display model
 */
export interface RegionalTestingContractTableRow {
  contractId: string;
  contractType: string;
  customerName: string;
  customerId: string;
  exportCode: string;
  effDate: string;
  termDate: string | null;
}
