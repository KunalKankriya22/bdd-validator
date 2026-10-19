import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  TemporaryDrive,
  TemporaryDriveDetail,
  TemporaryDriveQueryRequest,
  RecruiterOption,
  SponsorOption,
  FilterNameOption
} from '../models/temporary-drive-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

/**
 * Service for Temporary Drive Query API operations
 * Backend endpoints: /api/v1/temporary-drive-query
 */
@Injectable({
  providedIn: 'root'
})
export class TemporaryDriveQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Search temporary drives
   * POST /api/v1/temporary-drive-query
   */
  searchTemporaryDrives(
    params: TemporaryDriveQueryRequest
  ): Observable<{ data: TemporaryDrive[]; totalRecords: number; message: string }> {
    const endpoint = API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY;

    return this.apiService.post<ReturnResult<TemporaryDrive>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0,
        message: response.message || ''
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get detail for Overview Details panel
   * GET /api/v1/temporary-drive-query/details/{tempdrId}
   */
  getDetail(tempdrId: string): Observable<{ data: TemporaryDriveDetail }> {
    const endpoint = API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY_DETAIL(tempdrId);

    return this.apiService.get<ReturnResult<TemporaryDriveDetail>>(endpoint).pipe(
      map(response => ({
        data: response.item || (response.data && response.data[0]) || ({} as TemporaryDriveDetail)
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get recruiters for dropdown
   * GET /api/v1/temporary-drive-query/lookups/recruiters
   */
  getRecruiters(): Observable<{ data: RecruiterOption[] }> {
    const endpoint = API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY_RECRUITERS;

    return this.apiService.get<ReturnResult<RecruiterOption>>(endpoint).pipe(
      map(response => ({
        data: response.data || []
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get sponsors for dropdown (scoped to date range per FMB LOV_SPONSOR)
   * GET /api/v1/temporary-drive-query/lookups/sponsors?fromDate=&toDate=
   */
  getSponsors(fromDate: string, toDate: string): Observable<{ data: SponsorOption[] }> {
    const endpoint = API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY_SPONSORS;
    const params = new HttpParams()
      .set('fromDate', fromDate)
      .set('toDate', toDate);

    return this.apiService.get<ReturnResult<SponsorOption>>(endpoint, { params }).pipe(
      map(response => ({
        data: response.data || []
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get distinct recruiter names from actual temp drive data (for filter panel)
   */
  getFilterRecruiters(): Observable<{ data: FilterNameOption[] }> {
    const endpoint = API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY_FILTER_RECRUITERS;

    return this.apiService.get<ReturnResult<FilterNameOption>>(endpoint).pipe(
      map(response => ({ data: response.data || [] })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get distinct sponsor names from actual temp drive sponsor data (for filter panel)
   */
  getFilterSponsors(): Observable<{ data: FilterNameOption[] }> {
    const endpoint = API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY_FILTER_SPONSORS;

    return this.apiService.get<ReturnResult<FilterNameOption>>(endpoint).pipe(
      map(response => ({ data: response.data || [] })),
      catchError(error => throwError(() => error))
    );
  }
}
