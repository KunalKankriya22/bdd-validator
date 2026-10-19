import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidRemoteTestingLabDto,
  CreateValidRemoteTestingLabRequestDto,
  UpdateValidRemoteTestingLabRequestDto,
  ValidRemoteTestingLabQueryDto,
  ValidRemoteTestingLabResponseDto,
  TestingLabLookupDto,
} from '../models/valid-remote-testing-labs.model';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  item?: T;
  message?: string;
  statusCode?: number;
  total?: number;
  totalCount?: number;
  errorCode?: string;
  error?: string;
  errorResponse?: { errorCode: string; error: string };
}

@Injectable({
  providedIn: 'root',
})
export class ValidRemoteTestingLabsApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all valid remote testing labs with pagination, filtering, and sorting
   * @param take Number of records to retrieve
   * @param skip Number of records to skip
   * @param params Query parameters for filtering/sorting
   */
  getAll(
    take: number,
    skip: number,
    params: ValidRemoteTestingLabQueryDto
  ): Observable<ValidRemoteTestingLabResponseDto> {
    const url = API.VALID_REMOTE_TESTING_LABS.LIST(take, skip);
    const payload: Record<string, unknown> = {};

    if (params.testingLabId) payload['testingLabId'] = params.testingLabId;
    if (params.testingLabName) payload['testingLabName'] = params.testingLabName;
    if (params.contractId) payload['contractId'] = params.contractId;
    if (params.city) payload['city'] = params.city;
    if (params.stateCode) payload['stateCode'] = params.stateCode;
    if (params.effDateFrom) payload['effDateFrom'] = params.effDateFrom;
    if (params.effDateTo) payload['effDateTo'] = params.effDateTo;
    if (params.termDateFrom) payload['termDateFrom'] = params.termDateFrom;
    if (params.termDateTo) payload['termDateTo'] = params.termDateTo;
    if (params.searchKeyword) payload['searchKeyword'] = params.searchKeyword;
    if (params.sortColumn) payload['sortColumn'] = params.sortColumn;
    if (params.sortOrder) payload['sortOrder'] = params.sortOrder;

    return this.apiService
      .post<ApiResponse<ValidRemoteTestingLabDto[]>>(url, payload)
      .pipe(
        map((response) => {
          const data = response?.data || [];
          const totalCount = response?.total ?? response?.totalCount ?? data.length;
          return { data, totalCount };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Get a single valid remote testing lab by testing lab ID
   * @param testingLabId Testing lab identifier
   */
  getById(testingLabId: string): Observable<ValidRemoteTestingLabDto> {
    const url = API.VALID_REMOTE_TESTING_LABS.GET_BY_ID(testingLabId);
    return this.apiService
      .get<ApiResponse<ValidRemoteTestingLabDto>>(url)
      .pipe(
        map((response) => {
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0];
          }
          return response.item || response.data;
        }),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Create a new valid remote testing lab
   * @param dto Create request DTO
   */
  create(dto: CreateValidRemoteTestingLabRequestDto): Observable<ApiResponse<ValidRemoteTestingLabDto>> {
    return this.apiService
      .post<ApiResponse<ValidRemoteTestingLabDto>>(
        API.VALID_REMOTE_TESTING_LABS.CREATE,
        dto
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Update an existing valid remote testing lab
   * @param testingLabId Testing lab identifier
   * @param dto Update request DTO
   */
  update(
    testingLabId: string,
    dto: UpdateValidRemoteTestingLabRequestDto
  ): Observable<ApiResponse<ValidRemoteTestingLabDto>> {
    const url = API.VALID_REMOTE_TESTING_LABS.UPDATE(testingLabId);
    return this.apiService
      .put<ApiResponse<ValidRemoteTestingLabDto>>(url, dto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Delete (soft delete) a valid remote testing lab by setting TERM_DATE
   * @param testingLabId Testing lab identifier
   */
  delete(testingLabId: string): Observable<ApiResponse<boolean>> {
    const url = API.VALID_REMOTE_TESTING_LABS.DELETE(testingLabId);
    return this.apiService
      .delete<ApiResponse<boolean>>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Get testing lab lookup data for autocomplete/search
   * Matches Oracle Forms TEST_LAB_ID_LOV1 functionality exactly
   * Returns ALL testing labs from ALL chapters with no filtering or search
   */
  getLookup(): Observable<TestingLabLookupDto[]> {
    const url = API.VALID_REMOTE_TESTING_LABS.LOOKUP;

    // Oracle Forms: No parameters, returns all records
    return this.apiService
      .get<ApiResponse<TestingLabLookupDto[]>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }
}
