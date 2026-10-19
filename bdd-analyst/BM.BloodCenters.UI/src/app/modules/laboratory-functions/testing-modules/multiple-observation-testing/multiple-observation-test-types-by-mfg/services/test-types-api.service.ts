import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';

import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  MultipleObservationTestTypeDto,
  CreateMultipleObservationTestTypeDto,
  UpdateMultipleObservationTestTypeDto,
  TestLookupDto,
  DefaultControlValueLookupDto,
  ApiResponse,
  GetTestTypesParams
} from '../models/test-types.model';

@Injectable({
  providedIn: 'root'
})
export class TestTypesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private extractArray<T>(response: T[] | ApiResponse<T[]>): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response?.data || [];
  }

  getTestTypes(
    testId: string,
    params?: GetTestTypesParams
  ): Observable<MultipleObservationTestTypeDto[]> {
    let httpParams = new HttpParams();
    if (params?.includeInactive) {
      httpParams = httpParams.set('includeInactive', 'true');
    }
    if (params?.take) {
      httpParams = httpParams.set('take', params.take.toString());
    }
    if (params?.skip) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }

    const url = `${this.baseUrl}${API.TEST_TYPES.GET_ALL(testId)}`;

    return this.http
      .get<MultipleObservationTestTypeDto[] | ApiResponse<MultipleObservationTestTypeDto[]>>(url, { params: httpParams })
      .pipe(map(response => this.extractArray(response)));
  }

  getTestTypesCount(testId: string, includeInactive = false): Observable<number> {
    let httpParams = new HttpParams()
      .set('includeInactive', includeInactive.toString())
      .set('take', '1')
      .set('skip', '0');

    const url = `${this.baseUrl}${API.TEST_TYPES.GET_ALL(testId)}`;

    return this.http
      .get<MultipleObservationTestTypeDto[] | ApiResponse<MultipleObservationTestTypeDto[]>>(url, { params: httpParams })
      .pipe(map(response => {
        if (Array.isArray(response)) {
          return response.length;
        }
        return response.total || 0;
      }));
  }

  getTestTypeById(
    testId: string,
    testType: string
  ): Observable<MultipleObservationTestTypeDto | null> {
    const url = `${this.baseUrl}${API.TEST_TYPES.GET_BY_ID(testId, testType)}`;

    return this.http
      .get<MultipleObservationTestTypeDto[] | ApiResponse<MultipleObservationTestTypeDto[]>>(url, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, [404])
      })
      .pipe(map(response => {
        const data = this.extractArray(response);
        return data.length > 0 ? data[0] : null;
      }));
  }

  createTestType(
    dto: CreateMultipleObservationTestTypeDto
  ): Observable<any> {
    const url = `${this.baseUrl}${API.TEST_TYPES.CREATE}`;
    return this.http.post<any>(url, dto);
  }

  updateTestType(
    testId: string,
    testType: string,
    dto: UpdateMultipleObservationTestTypeDto
  ): Observable<any> {
    const url = `${this.baseUrl}${API.TEST_TYPES.UPDATE(testId, testType)}`;
    return this.http.put<any>(url, dto);
  }

  deleteTestType(testId: string, testType: string): Observable<any> {
    const url = `${this.baseUrl}${API.TEST_TYPES.DELETE(testId, testType)}`;
    return this.http.delete<any>(url);
  }

  getTestsLookup(): Observable<TestLookupDto[]> {
    const url = `${this.baseUrl}${API.TEST_TYPES.LOOKUP_TESTS}`;

    return this.http
      .get<TestLookupDto[] | ApiResponse<TestLookupDto[]>>(url)
      .pipe(map(response => this.extractArray(response)));
  }

  getTestDescription(testId: string): Observable<string> {
    const url = `${this.baseUrl}${API.TEST_TYPES.LOOKUP_TEST_DESC(testId)}`;

    return this.http
      .get<string | ApiResponse<string>>(url)
      .pipe(map(response => {
        if (typeof response === 'string') {
          return response;
        }
        return response?.data || '';
      }));
  }

  getControlValues(testId: string): Observable<DefaultControlValueLookupDto[]> {
    const url = `${this.baseUrl}${API.TEST_TYPES.LOOKUP_CONTROL_VALUES(testId)}`;

    return this.http
      .get<DefaultControlValueLookupDto[] | ApiResponse<DefaultControlValueLookupDto[]>>(url)
      .pipe(map(response => this.extractArray(response)));
  }
}
