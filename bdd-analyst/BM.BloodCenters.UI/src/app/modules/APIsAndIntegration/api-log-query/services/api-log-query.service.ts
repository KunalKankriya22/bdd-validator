import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SourceIdsResponse,
  DataSourcesResponse,
  ApiLogQueryResponse,
  SourceIdOption,
  DataSourceOption,
  ApiLogRecord,
  ApiLogQueryFilterRequest
} from '../models/api-log-query.model';

@Injectable({
  providedIn: 'root'
})
export class ApiLogQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Get source IDs for dropdown
   * GET /api/v1/api-log-query/source-ids
   */
  getSourceIds(): Observable<SourceIdOption[]> {
    return this.apiService.get<SourceIdsResponse>(API.APPLICATION_ADMIN.API_LOG_QUERY_SOURCE_IDS).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error fetching source IDs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get data sources for dropdown
   * GET /api/v1/api-log-query/data-sources
   */
  getDataSources(): Observable<DataSourceOption[]> {
    return this.apiService.get<DataSourcesResponse>(API.APPLICATION_ADMIN.API_LOG_QUERY_DATA_SOURCES).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error fetching data sources:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Query API logs with filters and pagination
   * POST /api/v1/api-log-query/{take}/{skip}
   */
  queryApiLogs(
    take: number,
    skip: number,
    filters: ApiLogQueryFilterRequest
  ): Observable<{ data: ApiLogRecord[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.API_LOG_QUERY(take, skip);

    return this.apiService.post<ApiLogQueryResponse>(endpoint, filters).pipe(
      map(response => ({
        data: response?.data || [],
        total: response?.total || 0
      })),
      catchError(error => {
        console.error('Error querying API logs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Export API logs to CSV
   * POST /api/v1/api-log-query/export
   */
  exportApiLogs(filters: ApiLogQueryFilterRequest): Observable<Blob> {
    const endpoint = API.APPLICATION_ADMIN.API_LOG_QUERY_EXPORT;

    return this.apiService.post<Blob>(endpoint, filters, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting API logs:', error);
        return throwError(() => error);
      })
    );
  }
}
