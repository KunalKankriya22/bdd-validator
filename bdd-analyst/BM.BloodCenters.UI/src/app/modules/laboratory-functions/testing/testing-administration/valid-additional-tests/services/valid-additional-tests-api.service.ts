import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidAdditionalTestDto,
  CreateValidAdditionalTestRequestDto,
  UpdateValidAdditionalTestRequestDto,
  ValidAdditionalTestQueryDto,
  ValidAdditionalTestResponseDto,
  ValidTestDropdownDto,
} from '../models/valid-additional-tests.model';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  item?: T;
  message?: string;
  statusCode?: number;
  totalCount?: number;
  errorCode?: string;
  error?: string;
  errorResponse?: { errorCode: string; error: string };
}

@Injectable({
  providedIn: 'root',
})
export class ValidAdditionalTestsApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all valid additional tests with pagination, filtering, and sorting
   * @param take Number of records to retrieve
   * @param skip Number of records to skip
   * @param params Query parameters for filtering/sorting
   */
  getAll(
    take: number,
    skip: number,
    params: ValidAdditionalTestQueryDto
  ): Observable<ValidAdditionalTestResponseDto> {
    const url = API.VALID_ADDITIONAL_TESTS.LIST(take, skip);
    const payload: Record<string, unknown> = {};

    if (params.testId) payload['testId'] = params.testId;
    if (params.effDatePeriod) payload['effDatePeriod'] = params.effDatePeriod;
    if (params.effectiveDate) payload['effectiveDate'] = params.effectiveDate;
    if (params.termDatePeriod) payload['termDatePeriod'] = params.termDatePeriod;
    if (params.terminationDate) payload['terminationDate'] = params.terminationDate;
    if (params.searchKeyword) payload['searchKeyword'] = params.searchKeyword;
    if (params.sortColumn) payload['sortColumn'] = params.sortColumn;
    if (params.sortOrder) payload['sortOrder'] = params.sortOrder;

    return this.apiService
      .post<ApiResponse<ValidAdditionalTestDto[]>>(url, payload)
      .pipe(
        map((response) => {
          const data = response?.data || [];
          const totalCount = response?.totalCount ?? data.length;
          return { data, totalCount };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Get a single valid additional test by test ID
   * @param testId Test identifier
   */
  getById(testId: string): Observable<ValidAdditionalTestDto> {
    const url = API.VALID_ADDITIONAL_TESTS.GET_BY_ID(testId);
    return this.apiService
      .get<ApiResponse<ValidAdditionalTestDto>>(url)
      .pipe(
        map((response) => response.item || response.data),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Get active tests for dropdown (LOV)
   * Returns only tests that are currently active based on EFF_DATE and TERM_DATE
   */
  getTestsDropdown(): Observable<ValidTestDropdownDto[]> {
    return this.apiService
      .get<ApiResponse<ValidTestDropdownDto[]>>(API.VALID_ADDITIONAL_TESTS.TESTS_DROPDOWN)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Create a new valid additional test
   * @param dto Create request DTO
   */
  create(dto: CreateValidAdditionalTestRequestDto): Observable<ApiResponse<ValidAdditionalTestDto>> {
    return this.apiService
      .post<ApiResponse<ValidAdditionalTestDto>>(
        API.VALID_ADDITIONAL_TESTS.CREATE,
        dto
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Update an existing valid additional test
   * @param testId Test identifier
   * @param dto Update request DTO
   */
  update(
    testId: string,
    dto: UpdateValidAdditionalTestRequestDto
  ): Observable<ApiResponse<ValidAdditionalTestDto>> {
    const url = API.VALID_ADDITIONAL_TESTS.UPDATE(testId);
    return this.apiService
      .put<ApiResponse<ValidAdditionalTestDto>>(url, dto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Delete (soft delete) a valid additional test by setting TERM_DATE
   * @param testId Test identifier
   */
  delete(testId: string): Observable<ApiResponse<boolean>> {
    const url = API.VALID_ADDITIONAL_TESTS.DELETE(testId);
    return this.apiService
      .delete<ApiResponse<boolean>>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }
}
