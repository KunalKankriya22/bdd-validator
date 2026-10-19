import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  IdTypesResponse,
  SourceIdsResponse,
  TemporaryIdsResponse,
  PermanentIdsResponse,
  ApiTempDataQueryResponse,
  IdTypeOption,
  SourceIdOption,
  TemporaryIdOption,
  PermanentIdOption,
  ApiTempDataRecord,
  ApiTempDataQueryFilterRequest
} from '../models/api-temp-data-query.model';

@Injectable({
  providedIn: 'root'
})
export class ApiTempDataQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Get valid ID types for dropdown/LOV
   * Returns list of valid ID type codes from VALID_MASTER_CODES where CODE_TYPE='APITY'
   * GET /api/v1/api-conversion/id-types
   */
  getIdTypes(): Observable<IdTypeOption[]> {
    return this.apiService.get<IdTypesResponse>(API.APPLICATION_ADMIN.API_TEMP_DATA_QUERY_ID_TYPES).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error fetching ID types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get distinct source IDs for dropdown/LOV
   * Returns source IDs from recent conversion records
   * GET /api/v1/api-conversion/source-ids
   */
  getSourceIds(): Observable<SourceIdOption[]> {
    return this.apiService.get<SourceIdsResponse>(API.APPLICATION_ADMIN.API_TEMP_DATA_QUERY_SOURCE_IDS).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error fetching source IDs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get distinct temporary IDs for dropdown/LOV
   * Returns temporary IDs from recent conversion records (last 14 days)
   * Optionally filtered by ID type
   * GET /api/v1/api-conversion/temporary-ids?idType=
   */
  getTemporaryIds(idType?: string): Observable<TemporaryIdOption[]> {
    let params = new HttpParams();
    if (idType) {
      params = params.set('idType', idType);
    }
    return this.apiService.get<TemporaryIdsResponse>(API.APPLICATION_ADMIN.API_TEMP_DATA_QUERY_TEMPORARY_IDS, { params }).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error fetching temporary IDs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get distinct permanent IDs for dropdown/LOV
   * Returns permanent IDs from recent conversion records (last 14 days)
   * Optionally filtered by ID type
   * GET /api/v1/api-conversion/permanent-ids?idType=
   */
  getPermanentIds(idType?: string): Observable<PermanentIdOption[]> {
    let params = new HttpParams();
    if (idType) {
      params = params.set('idType', idType);
    }
    return this.apiService.get<PermanentIdsResponse>(API.APPLICATION_ADMIN.API_TEMP_DATA_QUERY_PERMANENT_IDS, { params }).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error fetching permanent IDs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Query API temporary data with filters and pagination
   * POST /api/v1/api-temp-data-query/{take}/{skip}
   */
  queryApiTempData(
    take: number,
    skip: number,
    filters: ApiTempDataQueryFilterRequest
  ): Observable<{ data: ApiTempDataRecord[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.API_TEMP_DATA_QUERY(take, skip);

    return this.apiService.post<ApiTempDataQueryResponse>(endpoint, filters).pipe(
      map(response => ({
        data: response?.data || [],
        total: response?.total || 0
      })),
      catchError(error => {
        console.error('Error querying API temporary data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Export API temporary data to CSV
   * POST /api/v1/api-temp-data-query/export
   */
  exportApiTempData(filters: ApiTempDataQueryFilterRequest): Observable<Blob> {
    const endpoint = API.APPLICATION_ADMIN.API_TEMP_DATA_QUERY_EXPORT;

    return this.apiService.post<Blob>(endpoint, filters, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting API temporary data:', error);
        return throwError(() => error);
      })
    );
  }
}
