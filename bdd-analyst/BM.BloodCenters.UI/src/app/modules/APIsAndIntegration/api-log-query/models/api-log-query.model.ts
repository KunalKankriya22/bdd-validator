/**
 * API Log Query Models
 * Models for API log query functionality
 */

/**
 * Source ID option for dropdown
 */
export interface SourceIdOption {
  sourceId: string;
  description: string;
}

/**
 * Data Source option for dropdown
 */
export interface DataSourceOption {
  dataSourceName: string;
}

/**
 * API Log record
 */
export interface ApiLogRecord {
  sourceId: string;
  dataSourceName: string;
  programId: string;
  insertDate: string;
  logText: string;
}

/**
 * Filter request payload
 */
export interface ApiLogQueryFilterRequest {
  sourceId?: string;
  fromDate?: string;
  toDate?: string;
  dataSourceName?: string;
  searchItem?: string;
  sortColumn?: string;
  sortDirection?: string;
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
 * API Response for data sources
 */
export interface DataSourcesResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DataSourceOption[];
}

/**
 * API Response for log query
 */
export interface ApiLogQueryResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ApiLogRecord[];
  total: number;
}
