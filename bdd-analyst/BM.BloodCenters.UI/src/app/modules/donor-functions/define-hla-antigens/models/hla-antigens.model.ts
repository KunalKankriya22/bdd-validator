import { Moment } from 'moment';

/**
 * Core data model for HLA Antigens from API
 * Maps to VALID_HLA_LOCUS table
 */
export interface HlaAntigenModel {
  locus: string;                       // CHAR(2) - Primary Key
  locusDescription?: string;           // From VALID_MASTER_CODES lookup (display only)
  epitopeId: string;                   // CHAR(6) - Primary Key (Antigen)
  epitopeSuperI?: string | null;       // CHAR(6) - Associated Antigen (optional)
  effDate: string | Date;              // DATE - Effective Date (required)
  termDate?: string | Date | null;     // DATE - Termination Date (optional)
  // Audit fields
  insertDate?: string | Date | null;
  insertUser?: string;
  chapterId?: string;
  programId?: string;
  auditKey?: number;
}

/**
 * API Response wrapper for list endpoint
 * Matches actual API response structure
 */
export interface HlaAntigenResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: HlaAntigenModel[];
  total: number;
}

/**
 * API Response wrapper for single item (GET_BY_ID)
 */
export interface HlaAntigenItemResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: HlaAntigenModel;
  error?: string;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * API request parameters for list endpoint
 * Used for pagination, sorting, and server-side filtering
 */
export interface HlaAntigenParamsDto {
  searchKeyword?: string;                     // Search keyword for locus or description
  epitopeId?: string | null;                  // Filter by antigen (epitope ID)
  epitopeSuperI?: string | null;              // Filter by associated antigen (epitope super I)
  effectivePeriod?: string | null;            // Period type: Before/After/On/Between
  effectiveDate?: string | null;              // Effective date (ISO format YYYY-MM-DD)
  terminationPeriod?: string | null;          // Period type: Before/After/On/Between
  terminationDate?: string | null;            // Termination date (ISO format YYYY-MM-DD)
  sortOrder?: 'ASC' | 'DESC';                 // Sort direction: ASC = Ascending, DESC = Descending
  sortColumn?: string;                        // Column to sort by
}

/**
 * Filter form values
 * Represents the structure of the filter panel form
 */
export interface HlaAntigenFilterValue {
  antigen: string | null;                     // Filter by antigen (epitopeId)
  associatedAntigen: string | null;           // Filter by associated antigen (epitopeSuperI)
  effectiveDatePeriod: string | null;         // Period type: Before/After/On/Between
  effectiveDate: Moment | null;               // Effective date (Moment object)
  terminationDatePeriod: string | null;       // Period type: Before/After/On/Between
  terminationDate: Moment | null;             // Termination date (Moment object)
}

/**
 * DTO for creating new HLA Antigen record
 * Matches API contract for POST /valid-hla-locus
 */
export interface CreateHlaAntigenDto {
  locus: string;                       // CHAR(2) - Required
  epitopeId: string;                   // CHAR(6) - Required (Antigen)
  epitopeSuperI?: string | null;       // CHAR(6) - Optional (Associated Antigen)
  effDate: string;                     // ISO date string (YYYY-MM-DD) - Required
  termDate?: string | null;            // ISO date string (YYYY-MM-DD) - Optional
}

/**
 * DTO for updating existing HLA Antigen record
 * Matches API contract for PUT /valid-hla-locus/{locus}/{epitopeId}
 */
export interface UpdateHlaAntigenDto {
  locus: string;
  epitopeId: string;
  epitopeSuperI?: string | null;
  effDate: string;
  termDate?: string | null;
}

/**
 * Dialog data for Add/Edit Antigen dialog
 */
export interface AddEditAntigenDialogData {
  mode: 'add' | 'edit';
  locus?: string;
  locusDescription?: string;
  epitopeId?: string;
  epitopeSuperI?: string | null;
  effDate?: string | Date;
  termDate?: string | Date | null;
  locusOptions?: LocusCodeModel[];
}

/**
 * Dialog result from Add Antigen dialog
 */
export interface AddEditAntigenDialogResult {
  action: 'save' | 'cancel';
  data?: CreateHlaAntigenDto;
}

/**
 * Locus code lookup item
 */
export interface LocusCodeModel {
  code: string;           // e.g., "A", "B", "C"
  description: string;    // e.g., "HLA-A", "HLA-B", "HLA-C"
}

/**
 * API Response for locus codes lookup
 */
export interface LocusCodesResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: LocusCodeModel[];
}
