import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  TestBatchDto,
  TestForReconciliationDto,
  ReconciliationUnitDto,
  ValidTestResultDto,
  ReconcileResultsRequestDto,
  ReconciliationSummaryDto,
  ApiResponse
} from '../models/test-result-reconciliation.model';

/**
 * Test Result Reconciliation API Service
 * Handles all HTTP requests for test result reconciliation operations
 */
@Injectable({
  providedIn: 'root',
})
export class TestResultReconciliationApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get open test batches with units needing reconciliation (last 21 days)
   * GET /api/v1/test-result-reconciliation/batches
   * @returns Observable with array of test batches
   */
  getOpenBatches(): Observable<TestBatchDto[]> {
    return this.apiService
      .get<ApiResponse<TestBatchDto[]>>(API.TEST_RESULT_RECONCILIATION.BATCHES)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getOpenBatches failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get tests within a batch that need reconciliation
   * GET /api/v1/test-result-reconciliation/batches/{tbId}/tests
   * @param tbId Test Batch ID
   * @returns Observable with array of tests needing reconciliation
   */
  getTestsInBatch(tbId: string): Observable<TestForReconciliationDto[]> {
    return this.apiService
      .get<ApiResponse<TestForReconciliationDto[]>>(
        API.TEST_RESULT_RECONCILIATION.TESTS_IN_BATCH(tbId)
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getTestsInBatch failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get units needing reconciliation for a specific batch and test
   * GET /api/v1/test-result-reconciliation/units?tbId={tbId}&testId={testId}
   * @param tbId Test Batch ID
   * @param testId Test identifier
   * @returns Observable with array of units needing reconciliation
   */
  getUnitsForReconciliation(
    tbId: string,
    testId: string
  ): Observable<ReconciliationUnitDto[]> {
    return this.apiService
      .get<ApiResponse<ReconciliationUnitDto[]>>(
        API.TEST_RESULT_RECONCILIATION.UNITS(tbId, testId)
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getUnitsForReconciliation failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get valid result codes for a test (for dropdown/LOV)
   * GET /api/v1/test-result-reconciliation/valid-results/{testId}
   * @param testId Test identifier
   * @param antigenFlag Antigen flag from the selected test ('Y' or 'N')
   * @returns Observable with array of valid result codes
   */
  getValidResults(testId: string, antigenFlag: string = 'N'): Observable<ValidTestResultDto[]> {
    const params = new HttpParams().set('antigenFlag', antigenFlag);
    return this.apiService
      .get<ApiResponse<ValidTestResultDto[]>>(
        API.TEST_RESULT_RECONCILIATION.VALID_RESULTS(testId),
        { params }
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getValidResults failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Submit supervisor reconciliation results for all units
   * POST /api/v1/test-result-reconciliation/reconcile
   * @param request Reconciliation request containing tbId, testId, and units with supervisor results
   * @returns Observable with reconciliation summary
   */
  reconcileResults(
    request: ReconcileResultsRequestDto
  ): Observable<ReconciliationSummaryDto> {
    return this.apiService
      .post<ApiResponse<ReconciliationSummaryDto[]>>(
        API.TEST_RESULT_RECONCILIATION.RECONCILE,
        request
      )
      .pipe(
        map((response) => response?.data?.[0] as ReconciliationSummaryDto),
        catchError((error) => {
          console.error('reconcileResults failed:', error);
          return throwError(() => error);
        })
      );
  }
}
