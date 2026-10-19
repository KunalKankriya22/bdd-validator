import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  EligiblePlasmaCellLossRecord,
  EligiblePlasmaCellLossRecordDetail,
  AddEligiblePlasmaCellLossRequest,
  UpdateEligiblePlasmaCellLossRequest,
  ValidateDuplicateRequest,
  ValidateDuplicateResponse,
  ApiResponse,
  FilterOptions,
  PaginatedResponse,
  GetRecordsParams
} from '../models/eligible-plasma-cell-loss.model';

/**
 * API response wrapper interface
 */
interface ApiResponseWrapper<T> {
  success?: boolean;
  message?: string;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EligiblePlasmaCellLossService {
  private readonly apiService = inject(ApiService);

  /**
   * Get filter options for dropdowns
   * @returns Observable<FilterOptions>
   */
  getFilterOptions(): Observable<FilterOptions> {
    return this.apiService.get<FilterOptions>(
      API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.FILTER_OPTIONS
    ).pipe(
      catchError(error => {
        console.error('Error fetching filter options:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get eligible plasma cell loss records with filters, search, sorting, and pagination
   * @param params - Query parameters for filtering, searching, sorting, and pagination
   * @returns Observable<EligiblePlasmaCellLossRecord[] | PaginatedResponse<EligiblePlasmaCellLossRecord>>
   */
  getRecords(params?: GetRecordsParams): Observable<EligiblePlasmaCellLossRecord[] | PaginatedResponse<EligiblePlasmaCellLossRecord>> {
    let httpParams = new HttpParams();

    if (params) {
      // Add query parameters only if they have values
      if (params.cellType) {
        httpParams = httpParams.set('cellType', params.cellType);
      }
      if (params.status) {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.searchText) {
        httpParams = httpParams.set('searchText', params.searchText);
      }
      if (params.chapterId) {
        httpParams = httpParams.set('chapterId', params.chapterId);
      }
      if (params.sort) {
        httpParams = httpParams.set('sort', params.sort);
      }
      if (params.skip !== null && params.skip !== undefined) {
        httpParams = httpParams.set('skip', params.skip.toString());
      }
      if (params.take !== null && params.take !== undefined) {
        httpParams = httpParams.set('take', params.take.toString());
      }
    }

    return this.apiService.get<any>(
      API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.GET_RECORDS,
      { params: httpParams }
    ).pipe(
      map(response => {
        // Handle paginated response (when skip/take are provided)
        if (response && response.records !== undefined && response.totalCount !== undefined) {
          return response as PaginatedResponse<EligiblePlasmaCellLossRecord>;
        }
        // Handle wrapped response format with total (data + total)
        if (response && response.data && response.total !== undefined) {
          return {
            records: response.data,
            totalCount: response.total
          } as PaginatedResponse<EligiblePlasmaCellLossRecord>;
        }
        // Handle simple array response (when skip/take are not provided)
        if (Array.isArray(response)) {
          return response;
        }
        // Handle wrapped response format without total
        if (response && response.data) {
          return response.data;
        }
        console.warn('Unexpected response format, returning empty array');
        return [];
      }),
      catchError(error => {
        console.error('Error fetching eligible plasma cell loss records:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get eligible plasma cell loss record by audit key
   * @param auditKey - The audit key of the record
   * @returns Observable<EligiblePlasmaCellLossRecordDetail>
   */
  getRecordByAuditKey(auditKey: string): Observable<EligiblePlasmaCellLossRecordDetail> {
    return this.apiService.get<ApiResponseWrapper<EligiblePlasmaCellLossRecordDetail>>(
      API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.GET_BY_AUDIT_KEY(auditKey)
    ).pipe(
      map(response => response.item || response as unknown as EligiblePlasmaCellLossRecordDetail),
      catchError(error => {
        console.error('Error fetching record by audit key:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add a new eligible plasma cell loss record
   * @param request - Add record request payload
   * @returns Observable<ApiResponse>
   */
  addRecord(request: AddEligiblePlasmaCellLossRequest): Observable<ApiResponse> {
    return this.apiService.post<ApiResponse>(
      API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.ADD_RECORD,
      request
    ).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing eligible plasma cell loss record
   * @param auditKey - The audit key of the record to update (route parameter)
   * @param request - Update record request payload
   * @returns Observable<ApiResponse>
   */
  updateRecord(auditKey: string, request: UpdateEligiblePlasmaCellLossRequest): Observable<ApiResponse> {
    return this.apiService.put<ApiResponse>(
      API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.UPDATE_RECORD(auditKey),
      request
    ).pipe(
      catchError(error => {
        console.error('Error updating record:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an eligible plasma cell loss record by audit key
   * @param auditKey - The audit key of the record to delete
   * @returns Observable<ApiResponse>
   */
  deleteRecord(auditKey: string): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(
      API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.DELETE_RECORD(auditKey)
    ).pipe(
      catchError(error => {
        console.error('Error deleting record:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Validate if a duplicate record exists
   * @param request - Validation request payload
   * @returns Observable<ValidateDuplicateResponse>
   */
  validateDuplicate(request: ValidateDuplicateRequest): Observable<ValidateDuplicateResponse> {
    return this.apiService.post<ValidateDuplicateResponse>(
      API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.VALIDATE_DUPLICATE,
      request
    ).pipe(
      catchError(error => {
        console.error('Error validating duplicate:', error);
        return throwError(() => error);
      })
    );
  }

}
