import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  TestKitReagentQueryParams,
  TestKitReagentResultDto,
  ReagentDetailDto,
  BatchDetailDto,
  ApiResponseWrapper,
} from '../models/test-kit-reagents-query.model';

/**
 * Test Kit Reagents Query API Service
 *
 * Provides methods to query test kits, reagents, and batches from the laboratory system.
 * Based on API Documentation: test-kit-reagent-query-api-documentation.md
 *
 * Database Tables:
 * - LBTESTS.TEST_KITS
 * - LBTESTS.USABLE_REAGENTS
 * - LBTESTS.TEST_KIT_REAGENTS
 * - LBTESTS.TEST_BATCH_HDR
 */
@Injectable({
  providedIn: 'root',
})
export class TestKitReagentsQueryApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get test kits based on test ID and optional filters
   *
   * GET /api/test-kit-reagents-query
   *
   * Query Parameters:
   * - testId (required): Test ID to query (max 10 chars)
   * - fromDate (optional): Filter kits from this date (inclusive)
   * - toDate (optional): Filter kits until this date (inclusive)
   * - testKitId (optional): Specific test kit ID to filter
   *
   * Validation:
   * - Test ID is required and max 10 characters
   * - Test ID must exist in LBTESTS.TESTS table (Error 1227)
   * - fromDate cannot be in future (Error 7022)
   * - toDate cannot be in future (Error 7022)
   * - toDate must be >= fromDate (Error 7023)
   *
   * @param params Query parameters for filtering test kits
   * @returns Observable with array of test kit results
   */
  getTestKits(params: TestKitReagentQueryParams): Observable<TestKitReagentResultDto[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('testId', params.testId);

    if (params.fromDate) {
      queryParams.append('fromDate', params.fromDate);
    }
    if (params.toDate) {
      queryParams.append('toDate', params.toDate);
    }
    if (params.testKitId) {
      queryParams.append('testKitId', params.testKitId);
    }

    const url = `${API.TEST_KIT_REAGENTS_QUERY.GET_TEST_KITS}?${queryParams.toString()}`;

    return this.apiService
      .get<ApiResponseWrapper<TestKitReagentResultDto[]>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getTestKits failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get reagent details for a specific test kit
   *
   * GET /api/test-kit-reagents-query/{testKitId}/reagents
   *
   * Query Parameters:
   * - testId (required): Test ID associated with the kit
   *
   * Path Parameters:
   * - testKitId (required): Test kit ID
   *
   * Returns detailed reagent information including:
   * - Reagent type (C=Control, R=Reagent, S=Substrate)
   * - Reagent code and description
   * - Lot number and expiry date
   *
   * @param testKitId Test kit identifier
   * @param testId Test ID associated with the kit
   * @returns Observable with array of reagent details
   */
  getReagentDetails(testKitId: string, testId: string): Observable<ReagentDetailDto[]> {
    const url = API.TEST_KIT_REAGENTS_QUERY.GET_REAGENTS(testKitId);
    const queryParams = new URLSearchParams();
    queryParams.append('testId', testId);

    return this.apiService
      .get<ApiResponseWrapper<ReagentDetailDto[]>>(`${url}?${queryParams.toString()}`)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getReagentDetails failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get batch details for a specific test kit
   *
   * GET /api/test-kit-reagents-query/{testKitId}/batches
   *
   * Path Parameters:
   * - testKitId (required): Test kit ID
   *
   * Returns batch information including:
   * - Batch ID
   * - First and last unit IDs in the batch
   * - Batch processing date
   *
   * @param testKitId Test kit identifier
   * @returns Observable with array of batch details
   */
  getBatchDetails(testKitId: string): Observable<BatchDetailDto[]> {
    const url = API.TEST_KIT_REAGENTS_QUERY.GET_BATCHES(testKitId);

    return this.apiService
      .get<ApiResponseWrapper<BatchDetailDto[]>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getBatchDetails failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get list of valid test IDs for dropdown (LOV - List of Values)
   *
   * GET /api/test-kit-reagents-query/test-ids-lov
   *
   * Returns test IDs from the last 21 days that have test kits or usable reagents.
   * The response includes both test ID and testDescription for display in dropdown.
   *
   * @returns Observable with array of test ID options
   */
  getTestIdsLov(): Observable<Array<{testId: string, testDescription: string}>> {
    const url = API.TEST_KIT_REAGENTS_QUERY.GET_TEST_IDS_LOV;

    return this.apiService
      .get<ApiResponseWrapper<Array<{testId: string, testDescription: string}>>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getTestIdsLov failed:', error);
          return throwError(() => error);
        })
      );
  }
}
