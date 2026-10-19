/**
 * Model for HLA Cross-Reactive Groups (Valid HLA Epitopes)
 * Based on API endpoint: POST /valid-hla-epitopes/{take}/{skip}
 */

/**
 * Main data model for HLA Cross-Reactive Group
 */
export interface HlaCrossReactiveGroupModel {
  publicEpitopeId: string;          // VARCHAR2(5) - Part of composite PK
  publicEpitopeDescription?: string; // Description from API (read-only)
  associatedEpitopeId: string;      // VARCHAR2(6) - Part of composite PK
  hlaStandard: string;              // VARCHAR2(5) - Reference (CREG, AABB, PEL)
  effectiveDate: Date | string;     // DATE - Required
  terminationDate?: Date | string | null;  // DATE - Optional
  description?: string;             // Legacy field name (for backward compatibility)
  chapterId?: string;               // VARCHAR2(4)
  programId?: string;               // Program ID
  insertUser?: string;              // Insert user
  insertDate?: Date | string;       // Insert date
  auditKey?: number;                // Audit key
}

/**
 * DTO for creating a new HLA Cross-Reactive Group
 * Request: POST /valid-hla-epitopes
 */
export interface CreateHlaCrossReactiveGroupDto {
  publicEpitopeId: string;
  associatedEpitopeId: string;
  hlaStandard: string;
  effectiveDate: string;            // ISO format: YYYY-MM-DDTHH:mm:ss
  terminationDate?: string | null;  // ISO format: YYYY-MM-DDTHH:mm:ss
  chapterId: string;
}

/**
 * DTO for updating an existing HLA Cross-Reactive Group
 * Request: PUT /valid-hla-epitopes/{publicEpitopeId}/{associatedEpitopeId}
 */
export interface UpdateHlaCrossReactiveGroupDto {
  publicEpitopeId: string;
  associatedEpitopeId: string;
  hlaStandard: string;
  effectiveDate: string;            // ISO format: YYYY-MM-DDTHH:mm:ss
  terminationDate?: string | null;  // ISO format: YYYY-MM-DDTHH:mm:ss
  chapterId: string;
}

/**
 * Request DTO for search/filter/sort
 * Request: POST /valid-hla-epitopes/{take}/{skip}
 */
export interface HlaCrossReactiveGroupParamsDto {
  publicEpitopeId?: string | null;
  effectiveDate?: string | null;         // ISO format for filter
  effectivePeriod?: 'AFTER' | 'BEFORE' | null;
  terminationDate?: string | null;       // ISO format for filter
  terminationPeriod?: 'AFTER' | 'BEFORE' | null;
  searchKeyword?: string | null;
  sortColumn?: string;                   // Default: "PublicEpitopeId"
  sortOrder?: 'ASC' | 'DESC';            // Default: "ASC"
  hlaStandard?: string | null;           // Filter by Reference
}

/**
 * Filter values for the filter panel
 */
export interface HlaCrossReactiveGroupFilterValue {
  hlaStandard?: string;                      // Reference dropdown
  effectivePeriod?: 'AFTER' | 'BEFORE';      // Effective Date Period dropdown
  effectiveDate?: string;                    // Effective Date picker
  terminationPeriod?: 'AFTER' | 'BEFORE';    // Termination Date Period dropdown
  terminationDate?: string;                  // Termination Date picker
}

/**
 * Dropdown options for the filter panel and add/edit form
 */
export interface HlaCrossReactiveGroupDropdowns {
  hlaStandards: { code: string; description: string }[];
  publicEpitopes: PublicEpitopeOption[];
}

/**
 * Public Epitope option with code and description
 * Updated to use code/description instead of value/label for consistency
 */
export interface PublicEpitopeOption {
  code: string;        // Public Epitope ID code
  description: string; // Description text
}

/**
 * Associated Epitope option from GET /valid-hla-epitopes/associated-epitopes
 */
export interface AssociatedEpitopeOption {
  locus: string;
  epitopeId: string;
}

/**
 * HLA Standard code DTO from VALID_MASTER_CODES or VALID_HLA_EPITOPES
 * Used for dropdown options
 */
export interface HlaStandardCodeDto {
  code: string;        // HLA Standard code (e.g., 'AABB', 'CREG')
  description: string; // Description text
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
  error?: string;
  errorCode?: string;
  item?: boolean;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * API Response for list/search endpoints
 */
export interface HlaCrossReactiveGroupResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: HlaCrossReactiveGroupModel[];
  total: number;
}

/**
 * Paginated response data
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
