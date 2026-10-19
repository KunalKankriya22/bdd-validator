import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import { ApiResponse } from '@shared/interfaces/api-response.interface';
import {
  AllTestsForUnitQueryDto,
  AllTestsForUnitResultDto,
  UtrsTestDto,
  UnitTestBaseDto,
} from '../models/testq.model';

@Injectable({ providedIn: 'root' })
export class TestqApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.ALL_TESTS_FOR_UNIT.BASE}`;

  searchAllTestsForUnit(request: AllTestsForUnitQueryDto): Observable<AllTestsForUnitResultDto> {
    const url = `${environment.apiUrl}${API.ALL_TESTS_FOR_UNIT.SEARCH}`;
    return this.http
      .post<ApiResponse<UtrsTestDto[]> & { totalCount?: number }>(url, request)
      .pipe(map((response) => {
        const tests = response.data || [];
        return { utrsTests: tests, unitTestBaseTests: [], totalCount: response.totalCount ?? tests.length };
      }));
  }

  searchUnscheduledTestsForUnit(request: AllTestsForUnitQueryDto): Observable<AllTestsForUnitResultDto> {
    const url = `${environment.apiUrl}${API.ALL_TESTS_FOR_UNIT.UNSCHEDULED_SEARCH}`;
    const { collDate: _omit, ...unscheduledRequest } = request;
    return this.http
      .post<ApiResponse<UnitTestBaseDto[]> & { totalCount?: number }>(url, unscheduledRequest)
      .pipe(map((response) => {
        const tests = response.data || [];
        return { utrsTests: [], unitTestBaseTests: tests, totalCount: response.totalCount ?? tests.length };
      }));
  }

  getCollectionDates(unitId: string): Observable<{ collDate: string }[]> {
    const encodedUnitId = encodeURIComponent(unitId.trim());
    return this.http
      .get<ApiResponse<{ collDate: string }[]>>(`${environment.apiUrl}/api/v1/unit-test-results/${encodedUnitId}/collection-dates`)
      .pipe(map((response) => response.data || []));
  }
}
