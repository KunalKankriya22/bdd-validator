import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  TestSeriesConfigDto,
  CreateTestSeriesConfigDto,
  UpdateTestSeriesConfigDto,
  TestSeriesConfigQueryDto,
  TestSeriesConfigCompositeKey,
  TestSeriesDropdownItem,
  ValidTestItem,
  ResultCodeOption,
  NotationCodeOption,
  ApiResponse,
  PaginatedResponse,
} from '../models/test-series-configuration.model';

/**
 * API Service for Test Series/Test Configuration
 * Handles all HTTP requests to /api/v1/test-series-config endpoints
 *
 * @see API Documentation: test-series-config-api-documentation.md
 */
@Injectable({
  providedIn: 'root',
})
export class TestSeriesConfigApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all test configurations with filtering, sorting, and pagination
   * POST /api/v1/test-series-config/{take}/{skip}
   *
   * @param take Number of records to return (max 100)
   * @param skip Number of records to skip for pagination
   * @param query Query filters
   * @returns Observable of paginated response
   */
  getAll(
    take: number,
    skip: number,
    query: TestSeriesConfigQueryDto,
  ): Observable<PaginatedResponse<TestSeriesConfigDto>> {
    const url = API.TEST_SERIES_CONFIG.LIST(take, skip);
    const payload: Record<string, unknown> = {};

    // Only include non-null/undefined query parameters
    if (query.testSeriesId) payload['testSeriesId'] = query.testSeriesId;
    if (query.testId) payload['testId'] = query.testId;
    if (query.levelCode !== null && query.levelCode !== undefined) {
      payload['levelCode'] = query.levelCode;
    }
    if (query.resultCode) payload['resultCode'] = query.resultCode;
    if (query.finalFlag) payload['finalFlag'] = query.finalFlag;
    if (query.effDateFrom) payload['effDateFrom'] = query.effDateFrom;
    if (query.effDateTo) payload['effDateTo'] = query.effDateTo;
    if (query.includeInactive !== undefined) {
      payload['includeInactive'] = query.includeInactive;
    }
    if (query.sortColumn) payload['sortColumn'] = query.sortColumn;
    if (query.sortOrder) payload['sortOrder'] = query.sortOrder;

    return this.apiService
      .post<ApiResponse<TestSeriesConfigDto>>(url, payload)
      .pipe(
        map((response) => {
          const data = response?.data || [];
          const totalRecords = response?.total ?? data.length;
          return { items: data, totalRecords };
        }),
        catchError((error) => {
          console.error('Error fetching test series configurations:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Get a single configuration by composite key
   * GET /api/v1/test-series-config?testSeriesId={id}&levelCode={level}&setNo={set}&testId={testId}
   *
   * @param params Composite key parameters
   * @returns Observable of single configuration
   */
  getById(
    params: TestSeriesConfigCompositeKey,
  ): Observable<TestSeriesConfigDto> {
    const queryParams = new URLSearchParams();

    if (params.testSeriesId) {
      queryParams.append('testSeriesId', params.testSeriesId);
    }
    if (params.levelCode !== null && params.levelCode !== undefined) {
      queryParams.append('levelCode', params.levelCode.toString());
    }
    if (params.setNo !== null && params.setNo !== undefined) {
      queryParams.append('setNo', params.setNo.toString());
    }
    if (params.testId) {
      queryParams.append('testId', params.testId);
    }

    const url = `${API.TEST_SERIES_CONFIG.GET_BY_ID}?${queryParams.toString()}`;

    return this.apiService
      .get<ApiResponse<TestSeriesConfigDto>>(url)
      .pipe(
        map((response) => response.data?.[0]!),
        catchError((error) => {
          console.error('Error fetching test series configuration:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Create a new test series or test configuration
   * POST /api/v1/test-series-config
   *
   * @param dto Create request DTO
   * @returns Observable of API response
   */
  create(dto: CreateTestSeriesConfigDto): Observable<ApiResponse> {
    return this.apiService
      .post<ApiResponse>(API.TEST_SERIES_CONFIG.CREATE, dto)
      .pipe(
        catchError((error) => {
          console.error('Error creating test series configuration:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Update an existing configuration
   * PUT /api/v1/test-series-config?testSeriesId={id}&levelCode={level}&setNo={set}&testId={testId}
   *
   * @param params Composite key parameters
   * @param dto Update request DTO
   * @returns Observable of API response
   */
  update(
    params: TestSeriesConfigCompositeKey,
    dto: UpdateTestSeriesConfigDto,
  ): Observable<ApiResponse> {
    const queryParams = new URLSearchParams();

    if (params.testSeriesId) {
      queryParams.append('testSeriesId', params.testSeriesId);
    }
    if (params.levelCode !== null && params.levelCode !== undefined) {
      queryParams.append('levelCode', params.levelCode.toString());
    }
    if (params.setNo !== null && params.setNo !== undefined) {
      queryParams.append('setNo', params.setNo.toString());
    }
    if (params.testId) {
      queryParams.append('testId', params.testId);
    }

    const url = `${API.TEST_SERIES_CONFIG.UPDATE}?${queryParams.toString()}`;

    return this.apiService.put<ApiResponse>(url, dto).pipe(
      catchError((error) => {
        console.error('Error updating test series configuration:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Soft delete a configuration (sets TERM_DATE to current date)
   * DELETE /api/v1/test-series-config?testSeriesId={id}&levelCode={level}&setNo={set}&testId={testId}
   *
   * @param params Composite key parameters
   * @returns Observable of API response
   */
  delete(params: TestSeriesConfigCompositeKey): Observable<ApiResponse> {
    const queryParams = new URLSearchParams();

    if (params.testSeriesId) {
      queryParams.append('testSeriesId', params.testSeriesId);
    }
    if (params.levelCode !== null && params.levelCode !== undefined) {
      queryParams.append('levelCode', params.levelCode.toString());
    }
    if (params.setNo !== null && params.setNo !== undefined) {
      queryParams.append('setNo', params.setNo.toString());
    }
    if (params.testId) {
      queryParams.append('testId', params.testId);
    }

    const url = `${API.TEST_SERIES_CONFIG.DELETE}?${queryParams.toString()}`;

    return this.apiService.delete<ApiResponse>(url).pipe(
      catchError((error) => {
        console.error('Error deleting test series configuration:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Get test series dropdown options
   * GET /api/v1/test-series-config/test-series-dropdown
   *
   * @returns Observable of test series dropdown items
   */
  getTestSeriesDropdown(): Observable<TestSeriesDropdownItem[]> {
    return this.apiService
      .get<ApiResponse<TestSeriesDropdownItem>>(
        API.TEST_SERIES_CONFIG.TEST_SERIES_DROPDOWN,
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching test series dropdown:', error);
          return of([]);
        }),
      );
  }

  /**
   * Get valid tests for scheduling/cancellation
   * GET /api/v1/test-series-config/valid-tests?testGroup={group}
   *
   * @param testGroup Optional test group filter (CNFRM, SUPP)
   * @returns Observable of valid test items
   */
  getValidTests(testGroup?: string): Observable<ValidTestItem[]> {
    const url = testGroup
      ? `${API.TEST_SERIES_CONFIG.VALID_TESTS}?testGroup=${encodeURIComponent(testGroup)}`
      : API.TEST_SERIES_CONFIG.VALID_TESTS;

    return this.apiService
      .get<ApiResponse<ValidTestItem>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching valid tests:', error);
          return of([]);
        }),
      );
  }

  getResultCodes(testId?: string): Observable<ResultCodeOption[]> {
    const url = testId
      ? `${API.TEST_SERIES_CONFIG.RESULT_CODES}?testId=${encodeURIComponent(testId)}`
      : API.TEST_SERIES_CONFIG.RESULT_CODES;

    return this.apiService
      .get<ApiResponse<ResultCodeOption>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching result codes:', error);
          return of([]);
        }),
      );
  }

  getNotationCodes(): Observable<NotationCodeOption[]> {
    return this.apiService
      .get<ApiResponse<NotationCodeOption>>(API.TEST_SERIES_CONFIG.NOTATION_CODES)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching notation codes:', error);
          return of([]);
        }),
      );
  }
}
