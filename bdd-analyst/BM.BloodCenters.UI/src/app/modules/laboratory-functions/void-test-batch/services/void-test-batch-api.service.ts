import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  TestBatchDto,
  TestInBatchDto,
  VoidReasonCodeDto,
  UnitInBatchDto,
  VoidTestBatchRequestDto,
  VoidTestBatchResponseDto,
  TechModeDto,
  ApiResponse,
} from '../models/void-test-batch.model';

@Injectable({ providedIn: 'root' })
export class VoidTestBatchApiService {
  private readonly apiService = inject(ApiService);

  getTestBatches(testingLabCode?: string, techMode?: string): Observable<TestBatchDto[]> {
    const url = API.VOID_TEST_BATCH.GET_TEST_BATCHES;
    const params: string[] = [];
    if (testingLabCode) params.push(`testingLabCode=${encodeURIComponent(testingLabCode)}`);
    if (techMode) params.push(`techMode=${encodeURIComponent(techMode)}`);
    const fullUrl = params.length ? `${url}?${params.join('&')}` : url;

    return this.apiService.get<ApiResponse<TestBatchDto[]>>(fullUrl).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  getTestsInBatch(tbId: string, techMode?: string): Observable<TestInBatchDto[]> {
    let url = API.VOID_TEST_BATCH.GET_TESTS(tbId);
    if (techMode) {
      url += `?techMode=${encodeURIComponent(techMode)}`;
    }

    return this.apiService.get<ApiResponse<TestInBatchDto[]>>(url).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  getUnitsInBatch(tbId: string, testId: string): Observable<UnitInBatchDto[]> {
    const url = API.VOID_TEST_BATCH.GET_UNITS(tbId, testId);

    return this.apiService.get<ApiResponse<UnitInBatchDto[]>>(url).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  getTechMode(): Observable<TechModeDto> {
    const url = API.VOID_TEST_BATCH.GET_TECH_MODE;
    return this.apiService.get<ApiResponse<TechModeDto>>(url).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  getVoidReasonCodes(): Observable<VoidReasonCodeDto[]> {
    const url = API.VOID_TEST_BATCH.GET_VOID_REASON_CODES;

    return this.apiService.get<ApiResponse<VoidReasonCodeDto[]>>(url).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  checkQcUnits(tbId: string): Observable<boolean> {
    const url = `${API.VOID_TEST_BATCH.GET_TEST_BATCHES.replace('/test-batches', '')}/qc-check/${encodeURIComponent(tbId)}`;

    return this.apiService.get<ApiResponse<boolean>>(url).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  voidTestBatch(request: VoidTestBatchRequestDto): Observable<VoidTestBatchResponseDto> {
    const url = API.VOID_TEST_BATCH.VOID_BATCH;

    return this.apiService.post<ApiResponse<VoidTestBatchResponseDto>>(url, request).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }
}
