import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import {
  DonationRecordDto,
  TestResultDto,
  TestResultsResponse,
  ConfirmatoryTestDto,
  DonorWithinTestHeaderDto,
  AccessLevelResponse,
  ApiResponse,
  DonationQueryParams
} from '../models/donor-within-test.models';

@Injectable({
  providedIn: 'root'
})
export class DonorWithinTestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAccessLevel(): Observable<number> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.ACCESS_LEVEL}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        const data = response?.data;
        // Backend returns ReturnResult<AccessLevelDto> with data as array: [{ accessLevel: N }]
        if (Array.isArray(data) && data.length > 0 && data[0]?.accessLevel !== undefined) {
          return Number(data[0].accessLevel);
        }
        // Handle { data: { accessLevel: N } }
        if (data?.accessLevel !== undefined && data.accessLevel !== null) {
          return Number(data.accessLevel);
        }
        // Handle { data: N }
        if (typeof data === 'number') {
          return data;
        }
        throw new Error('Access level not returned by server');
      }),
      catchError(error => {
        console.error('Error fetching access level:', error);
        return throwError(() => error);
      })
    );
  }

  getDonorHeader(donorId: string): Observable<DonorWithinTestHeaderDto | null> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.DONOR_HEADER(donorId)}`;
    return this.http.get<ApiResponse<DonorWithinTestHeaderDto[]>>(url).pipe(
      map(response => (response.data && response.data.length > 0) ? response.data[0] : null),
      catchError(() => of(null))
    );
  }

  getDonations(donorId: string, params?: DonationQueryParams): Observable<DonationRecordDto[]> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.DONATIONS(donorId)}`;

    let httpParams = new HttpParams();
    if (params?.take) {
      httpParams = httpParams.set('take', params.take.toString());
    }
    if (params?.skip) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }
    if (params?.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http.get<ApiResponse<DonationRecordDto[]>>(url, { params: httpParams }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching donations:', error);
        return throwError(() => error);
      })
    );
  }

  getTestResults(unitId: string, collDate: string, accessLevel?: number): Observable<TestResultsResponse> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.TEST_RESULTS(unitId, collDate)}`;

    let params = new HttpParams();
    if (accessLevel !== undefined && accessLevel !== null) {
      params = params.set('accessLevel', accessLevel.toString());
    }

    return this.http.get<any>(url, { params }).pipe(
      map(response => {
        // Backend returns ReturnResult<TestResultsResponseDto>: { data: [{ testResults, hasHiddenTests, hasValidTests }] }
        const wrapper = Array.isArray(response?.data) ? response.data[0] : response?.data;
        return {
          data: wrapper?.testResults || [],
          hasHiddenTests: wrapper?.hasHiddenTests ?? false,
          hasValidTests: wrapper?.hasValidTests ?? false
        };
      }),
      catchError(error => {
        console.error('Error fetching test results:', error);
        return throwError(() => error);
      })
    );
  }

  getConfirmatoryTests(
    unitId: string,
    collDate: string,
    accessLevel?: number
  ): Observable<ConfirmatoryTestDto[]> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.CONFIRMATORY_TESTS(unitId, collDate)}`;

    let params = new HttpParams();
    if (accessLevel !== undefined && accessLevel !== null) {
      params = params.set('accessLevel', accessLevel.toString());
    }

    return this.http.get<ApiResponse<ConfirmatoryTestDto[]>>(url, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching confirmatory tests:', error);
        return throwError(() => error);
      })
    );
  }
}
