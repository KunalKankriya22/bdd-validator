/**
 * API Temporary Data Query Models
 * Models for API temporary data query functionality
 */

/**
 * ID Type option for dropdown
 */
export interface IdTypeOption {
  code: string;
  description: string;
}

/**
 * Source ID option for dropdown
 */
export interface SourceIdOption {
  sourceId: string;
}

/**
 * Temporary ID option for dropdown
 */
export interface TemporaryIdOption {
  temporaryId: string;
}

/**
 * Permanent ID option for dropdown
 */
export interface PermanentIdOption {
  permanentId: string;
}

/**
 * API Conversion record from backend
 * Matches the response from POST /api/v1/api-conversion/{take}/{skip}
 */
export interface ApiTempDataRecord {
  temporaryId: string;
  permanentId: string;
  idType: string;
  temporaryAuditKey: number;
  permanentAuditKey: number;
  sourceId: string;
  insertDate: string;
}

/**
 * Filter request payload
 */
export interface ApiTempDataQueryFilterRequest {
  fromDate?: string;
  toDate?: string;
  idType?: string;
  temporaryId?: string;
  permanentId?: string;
  temporaryAuditKey?: number;
  permanentAuditKey?: number;
  sourceId?: string;
  searchItem?: string;
  SortDirection?: string; // 'ASC' for ascending, 'DESC' for descending
  FromDate?: string; // For insert date filter - period type 'after'
  ToDate?: string; // For insert date filter - period type 'before'
  period?: string; // 'after' or 'before' from filter panel
  insertDate?: string; // Insert date from filter panel
}

/**
 * API Response for ID types
 */
export interface IdTypesResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: IdTypeOption[];
}

/**
 * API Response for source IDs
 */
export interface SourceIdsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: SourceIdOption[];
}

/**
 * API Response for temporary IDs
 */
export interface TemporaryIdsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: TemporaryIdOption[];
}

/**
 * API Response for permanent IDs
 */
export interface PermanentIdsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: PermanentIdOption[];
}

/**
 * API Response for temp data query
 */
export interface ApiTempDataQueryResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ApiTempDataRecord[];
  total: number;
}
