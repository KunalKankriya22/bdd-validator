import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import {
  ResourceStatRecord,
  ResourceStatusQueryFilterRequest,
  ResourceOption
} from '../models/resource-status-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
}

/**
 * Service for Resource Status Query API operations
 * Backend endpoints: /api/v1/resource-status-query
 */
@Injectable({
  providedIn: 'root'
})
export class ResourceStatusQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Search resource status with pagination and filters
   * POST /api/v1/resource-status-query/{take}/{skip}
   */
  searchResourceStatus(
    take: number,
    skip: number,
    params: ResourceStatusQueryFilterRequest
  ): Observable<{ data: ResourceStatRecord[]; totalRecords: number; message: string }> {
    const endpoint = API.DONOR.RESOURCE_STATUS_QUERY(take, skip);

    return this.apiService.post<ReturnResult<ResourceStatRecord>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0,
        message: response.message || ''
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get available resources for dropdown (date-filtered)
   * GET /api/v1/resource-status-query/resources?startDate=xxx&endDate=xxx
   * ChapterId is sent automatically via X-ChapterId header by authInterceptor
   */
  getResources(startDate: string, endDate: string): Observable<{ data: ResourceOption[] }> {
    const endpoint = API.DONOR.RESOURCE_STATUS_QUERY_RESOURCES;

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.apiService.get<ReturnResult<ResourceOption>>(endpoint, { params }).pipe(
      map(response => ({
        data: response.data || []
      })),
      catchError(error => throwError(() => error))
    );
  }
}
