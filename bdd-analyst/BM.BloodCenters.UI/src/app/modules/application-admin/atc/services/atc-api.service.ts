import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import {
  AdditionalConfirmatoryTestScheduledDto,
  AdditionalConfirmatoryTestScheduledQueryDto,
  AdditionalConfirmatoryTestScheduledListResponse,
  TestGroupLookupDto,
  SampleTypeLookupDto,
  ApiResponse,
  ValidateUnitResponse,
  ExistingTestDto,
  ScheduleTestsRequest,
  ScheduleTestsResponse,
} from '../models/atc.models';

@Injectable({
  providedIn: 'root',
})
export class AtcApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.ADDITIONAL_CONFIRMATORY_TEST_SCHEDULED.BASE}`;

  getAllTests(
    take: number = 10,
    skip: number = 0,
    queryDto: AdditionalConfirmatoryTestScheduledQueryDto = {}
  ): Observable<AdditionalConfirmatoryTestScheduledListResponse> {
    const url = `${this.baseUrl}/${take}/${skip}`;
    return this.http
      .post<ApiResponse<AdditionalConfirmatoryTestScheduledDto[]>>(url, queryDto)
      .pipe(
        map((response) => ({
          data: response.data || [],
          totalCount: response.totalCount || 0,
        }))
      );
  }

  getTestById(testId: string): Observable<AdditionalConfirmatoryTestScheduledDto> {
    const url = `${environment.apiUrl}${API.ADDITIONAL_CONFIRMATORY_TEST_SCHEDULED.GET_BY_ID(testId)}`;
    return this.http
      .get<ApiResponse<AdditionalConfirmatoryTestScheduledDto>>(url)
      .pipe(map((response) => response.data));
  }

  getTestGroups(): Observable<TestGroupLookupDto[]> {
    const url = `${environment.apiUrl}${API.ADDITIONAL_CONFIRMATORY_TEST_SCHEDULED.LOOKUP_TEST_GROUPS}`;
    return this.http
      .get<ApiResponse<TestGroupLookupDto[]>>(url)
      .pipe(map((response) => response.data || []));
  }

  getSampleTypes(): Observable<SampleTypeLookupDto[]> {
    const url = `${environment.apiUrl}${API.ADDITIONAL_CONFIRMATORY_TEST_SCHEDULED.LOOKUP_SAMPLE_TYPES}`;
    return this.http
      .get<ApiResponse<SampleTypeLookupDto[]>>(url)
      .pipe(map((response) => response.data || []));
  }

  validateUnit(unitId: string): Observable<ValidateUnitResponse> {
    const url = `${this.baseUrl}/validate-unit`;
    return this.http
      .post<ApiResponse<ValidateUnitResponse>>(url, { unitId })
      .pipe(map((response) => response.data));
  }

  getExistingTests(unitId: string, collDate: string | null): Observable<ExistingTestDto[]> {
    const url = `${this.baseUrl}/existing-tests`;
    return this.http
      .post<ApiResponse<ExistingTestDto[]>>(url, { unitId, collDate })
      .pipe(map((response) => response.data || []));
  }

  scheduleTests(request: ScheduleTestsRequest): Observable<ScheduleTestsResponse> {
    const url = `${this.baseUrl}/schedule`;
    return this.http
      .post<ApiResponse<ScheduleTestsResponse[]>>(url, request)
      .pipe(map((response) => (response.data && response.data.length > 0) ? response.data[0] : { testsScheduled: 0, unitsProcessed: 0 }));
  }
}
