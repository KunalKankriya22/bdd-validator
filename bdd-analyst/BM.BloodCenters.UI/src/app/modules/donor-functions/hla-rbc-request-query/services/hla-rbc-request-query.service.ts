import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ApiResponse,
  RequestListParams,
  RequestListItem,
  RequestDetails,
  DonorFilterParams,
  MatchedDonor,
  UnitFilterParams,
  MatchedUnit,
  CreateCallListRequest,
  CreateCallListResult,
  PatientDetailResponse
} from '../models/hla-rbc-request-query.model';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class HlaRbcRequestQueryService {
  private apiService = inject(ApiService);

  getRequestList(params?: RequestListParams): Observable<RequestListItem[]> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.searchText) {
        httpParams = httpParams.set('SearchText', params.searchText);
      }
      if (params.status) {
        httpParams = httpParams.set('Status', params.status);
      }
      if (params.fromDate) {
        httpParams = httpParams.set('FromDate', params.fromDate);
      }
      if (params.toDate) {
        httpParams = httpParams.set('ToDate', params.toDate);
      }
      if (params.sortBy) {
        httpParams = httpParams.set('SortBy', params.sortBy);
      }
      if (params.sortOrder) {
        httpParams = httpParams.set('SortOrder', params.sortOrder);
      }
    }

    return this.apiService.get<ApiResponse<RequestListItem>>(API.HLA_RBC_REQUEST_QUERY.GET_LIST, { params: httpParams })
      .pipe(
        map(response => (response.success && response.data) ? response.data : []),
        catchError(error => {
          console.error('getRequestList failed:', error);
          return throwError(() => error);
        })
      );
  }

  getRequestDetails(requestId: string): Observable<RequestDetails | null> {
    if (!requestId) {
      return throwError(() => new Error('Request ID is required'));
    }

    return this.apiService.get<ApiResponse<RequestDetails>>(API.HLA_RBC_REQUEST_QUERY.GET_DETAILS(requestId))
      .pipe(
        map(response => (response.success && response.data?.length) ? response.data[0] : null),
        catchError(error => {
          console.error('getRequestDetails failed:', error);
          return throwError(() => error);
        })
      );
  }

  getMatchedDonors(requestId: string, filters?: DonorFilterParams): Observable<MatchedDonor[]> {
    if (!requestId) {
      return throwError(() => new Error('Request ID is required'));
    }

    return this.apiService.post<ApiResponse<MatchedDonor>>(API.HLA_RBC_REQUEST_QUERY.GET_DONORS(requestId), filters ?? {})
      .pipe(
        map(response => (response.success && response.data) ? response.data : []),
        catchError(error => {
          console.error('getMatchedDonors failed:', error);
          return throwError(() => error);
        })
      );
  }

  getMatchedUnits(requestId: string, filters?: UnitFilterParams): Observable<MatchedUnit[]> {
    if (!requestId) {
      return throwError(() => new Error('Request ID is required'));
    }

    return this.apiService.post<ApiResponse<MatchedUnit>>(API.HLA_RBC_REQUEST_QUERY.GET_UNITS(requestId), filters ?? {})
      .pipe(
        map(response => (response.success && response.data) ? response.data : []),
        catchError(error => {
          console.error('getMatchedUnits failed:', error);
          return throwError(() => error);
        })
      );
  }

  printDonors(requestId: string): Observable<ApiResponse<string>> {
    return this.apiService.post<ApiResponse<string>>(API.HLA_RBC_REQUEST_QUERY.PRINT_DONORS(requestId), {})
      .pipe(
        catchError(error => {
          console.error('printDonors failed:', error);
          return throwError(() => error);
        })
      );
  }

  printUnits(requestId: string): Observable<ApiResponse<string>> {
    return this.apiService.post<ApiResponse<string>>(API.HLA_RBC_REQUEST_QUERY.PRINT_UNITS(requestId), {})
      .pipe(
        catchError(error => {
          console.error('printUnits failed:', error);
          return throwError(() => error);
        })
      );
  }

  createCallList(requestId: string, payload: CreateCallListRequest): Observable<CreateCallListResult> {
    return this.apiService.post<ApiResponse<CreateCallListResult>>(
      API.HLA_RBC_REQUEST_QUERY.CREATE_CALL_LIST(requestId), payload
    ).pipe(
      map(response => {
        if (response.success && response.data?.length) return response.data[0];
        throw new Error(response.message || 'Failed to create call list');
      }),
      catchError(error => {
        console.error('createCallList failed:', error);
        return throwError(() => error);
      })
    );
  }

  getPatientDetail(patientId: string): Observable<PatientDetailResponse | null> {
    if (!patientId) {
      return throwError(() => new Error('Patient ID is required'));
    }

    return this.apiService.get<{ success: boolean; item?: PatientDetailResponse }>(API.ENTER_HLA_RBC_REQUEST.PATIENT_DETAIL(patientId))
      .pipe(
        map(response => response.success && response.item ? response.item : null),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  closeRequest(requestId: string): Observable<boolean> {
    if (!requestId) {
      return throwError(() => new Error('Request ID is required'));
    }

    return this.apiService.put<ApiResponse<boolean>>(API.HLA_RBC_REQUEST_QUERY.CLOSE_REQUEST(requestId), {})
      .pipe(
        map(response => (response.success && response.data?.length) ? response.data[0] : false),
        catchError(error => {
          console.error('closeRequest failed:', error);
          return throwError(() => error);
        })
      );
  }
}
