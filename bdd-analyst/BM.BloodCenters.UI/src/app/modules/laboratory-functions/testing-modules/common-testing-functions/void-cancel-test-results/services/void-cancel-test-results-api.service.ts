import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ActionTypeDto,
  ActiveTestDto,
  TestGroupDto,
  VoidReasonCodeDto,
  TestResultForVoidDto,
  VoidTestResultRequest,
  CancelTestResultRequest,
  TestResultDetailDto,
  ApiResponse,
} from '../models/void-cancel-test-results.model';

@Injectable({ providedIn: 'root' })
export class VoidCancelTestResultsApiService {
  private readonly apiService = inject(ApiService);

  getActions(): Observable<ActionTypeDto[]> {
    const url = API.VOID_CANCEL_TEST_RESULTS.GET_ACTIONS;

    return this.apiService.get<ApiResponse<ActionTypeDto[]>>(url).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  getTests(): Observable<ActiveTestDto[]> {
    const url = API.VOID_CANCEL_TEST_RESULTS.GET_TESTS;

    return this.apiService.get<ApiResponse<ActiveTestDto[]>>(url).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  getTestGroups(): Observable<TestGroupDto[]> {
    const url = API.VOID_CANCEL_TEST_RESULTS.GET_TEST_GROUPS;

    return this.apiService.get<ApiResponse<TestGroupDto[]>>(url).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  getVoidReasonCodes(): Observable<VoidReasonCodeDto[]> {
    const url = API.VOID_CANCEL_TEST_RESULTS.GET_VOID_REASON_CODES;

    return this.apiService.get<ApiResponse<VoidReasonCodeDto[]>>(url).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  getTestResults(unitId: string, testId: string, action: string = 'VOID'): Observable<TestResultForVoidDto[]> {
    const url = `${API.VOID_CANCEL_TEST_RESULTS.GET_TEST_RESULTS(unitId, testId)}?action=${action}`;

    return this.apiService.get<ApiResponse<TestResultForVoidDto[]>>(url).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  getTestResultsByUnit(unitId: string, testIds: string | null, action: string = 'VOID'): Observable<TestResultForVoidDto[]> {
    let url = API.VOID_CANCEL_TEST_RESULTS.GET_TEST_RESULTS_BY_UNIT(unitId);
    const params: string[] = [`action=${action}`];
    if (testIds) params.push(`testIds=${encodeURIComponent(testIds)}`);
    url += '?' + params.join('&');

    return this.apiService.get<ApiResponse<TestResultForVoidDto[]>>(url).pipe(
      map((response) => response.data ?? []),
      catchError((error) => throwError(() => error))
    );
  }

  getTestResultDetails(unitId: string, testIds: string | null, action: string = 'VOID'): Observable<TestResultDetailDto[]> {
    let url = API.VOID_CANCEL_TEST_RESULTS.GET_TEST_RESULT_DETAILS(unitId);
    const params: string[] = [`action=${action}`];
    if (testIds) params.push(`testIds=${encodeURIComponent(testIds)}`);
    url += '?' + params.join('&');

    return this.apiService.get<ApiResponse<TestResultDetailDto[]>>(url).pipe(
      map((response) => response.data ?? []),
      catchError((error) => throwError(() => error))
    );
  }

  voidTestResults(request: VoidTestResultRequest, isSupervisor: boolean = false): Observable<any> {
    const url = `${API.VOID_CANCEL_TEST_RESULTS.VOID}?isSupervisor=${isSupervisor}`;

    return this.apiService.put<ApiResponse<any>>(url, request).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  cancelTestResults(request: CancelTestResultRequest): Observable<any> {
    const url = API.VOID_CANCEL_TEST_RESULTS.CANCEL;

    return this.apiService.put<ApiResponse<any>>(url, request).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }
}
