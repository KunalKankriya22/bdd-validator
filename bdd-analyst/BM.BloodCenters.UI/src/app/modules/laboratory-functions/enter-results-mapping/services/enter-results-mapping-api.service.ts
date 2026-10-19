import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  RgtResultsMatrixDto,
  CreateRgtResultsMatrixRequestDto,
  UpdateRgtResultsMatrixRequestDto,
  RgtResultsMatrixQueryDto,
  ContractDropdownDto,
  TestDropdownDto,
  ResultStatusDropdownDto,
  ApiResponse
} from '../models/enter-results-mapping.model';

/**
 * API Service for Enter Results Mapping (RMAP/RGVRESLT)
 * Manages mappings between local laboratory test results and CBC test results
 * Base URL: /api/v1/rgt-results-matrix
 */
@Injectable({
  providedIn: 'root'
})
export class EnterResultsMappingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.RGT_RESULTS_MATRIX.BASE}`;

  /**
   * Get all result mappings with optional filtering
   * Endpoint: POST /rgt-results-matrix/{take}/{skip}
   *
   * @param take Number of records to return (max 100)
   * @param skip Number of records to skip for pagination
   * @param query Filter criteria (contractId is required)
   * @returns Observable of result mappings with total count
   */
  getAll(
    take: number,
    skip: number,
    query: RgtResultsMatrixQueryDto
  ): Observable<{ data: RgtResultsMatrixDto[]; totalCount: number }> {
    const url = `${this.baseUrl}/${take}/${skip}`;

    return this.http.post<ApiResponse<RgtResultsMatrixDto[]>>(url, query).pipe(
      map(response => ({
        data: response.data,
        totalCount: response.totalCount || 0
      }))
    );
  }

  /**
   * Get a single result mapping by composite primary key
   * Endpoint: GET /rgt-results-matrix/{testId}/{resultStatus}/{contractId}
   *
   * @param testId Test identifier (max 8 chars)
   * @param resultStatus Result status code (max 10 chars)
   * @param contractId Contract identifier (max 15 chars)
   * @returns Observable of single result mapping
   */
  getByCompositeId(
    testId: string,
    resultStatus: string,
    contractId: string
  ): Observable<RgtResultsMatrixDto> {
    const url = `${this.baseUrl}/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}/${encodeURIComponent(contractId)}`;

    return this.http.get<ApiResponse<RgtResultsMatrixDto>>(url).pipe(
      map(response => response.data)
    );
  }

  /**
   * Create a new result mapping
   * Endpoint: POST /rgt-results-matrix
   * Note: CBC Test ID is auto-populated from RGT_TEST_MATRIX if not provided
   *
   * @param request Create request DTO
   * @returns Observable of created result mapping
   */
  create(request: CreateRgtResultsMatrixRequestDto): Observable<RgtResultsMatrixDto> {
    return this.http.post<ApiResponse<RgtResultsMatrixDto>>(this.baseUrl, request).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update an existing result mapping
   * Endpoint: PUT /rgt-results-matrix/{testId}/{resultStatus}/{contractId}
   * Note: Only CBC fields are editable; composite key fields are immutable
   *
   * @param testId Test identifier (immutable)
   * @param resultStatus Result status code (immutable)
   * @param contractId Contract identifier (immutable)
   * @param request Update request DTO
   * @returns Observable of updated result mapping
   */
  update(
    testId: string,
    resultStatus: string,
    contractId: string,
    request: UpdateRgtResultsMatrixRequestDto
  ): Observable<RgtResultsMatrixDto> {
    const url = `${this.baseUrl}/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}/${encodeURIComponent(contractId)}`;

    return this.http.put<ApiResponse<RgtResultsMatrixDto>>(url, request).pipe(
      map(response => response.data)
    );
  }

  /**
   * Delete a result mapping
   * Endpoint: DELETE /rgt-results-matrix/{testId}/{resultStatus}/{contractId}
   * Note: Implementation depends on database schema (soft delete vs physical delete)
   *
   * @param testId Test identifier
   * @param resultStatus Result status code
   * @param contractId Contract identifier
   * @returns Observable of void (success/failure determined by HTTP status)
   */
  delete(
    testId: string,
    resultStatus: string,
    contractId: string
  ): Observable<void> {
    const url = `${this.baseUrl}/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}/${encodeURIComponent(contractId)}`;

    return this.http.delete<ApiResponse<void>>(url).pipe(
      map(() => void 0)
    );
  }

  /**
   * Get active regional sample tracking contracts for dropdown
   * Endpoint: GET /rgt-results-matrix/dropdowns/contracts
   * Filters contracts where type='RG' and chapter local date is between eff_date and term_date
   *
   * @returns Observable of contract dropdown options
   */
  getContractsDropdown(): Observable<ContractDropdownDto[]> {
    const url = `${this.baseUrl}/dropdowns/contracts`;

    return this.http.get<ApiResponse<ContractDropdownDto[]>>(url).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get active tests for dropdown
   * Endpoint: GET /rgt-results-matrix/dropdowns/tests
   * Filters tests where chapter local date is between eff_date and term_date
   *
   * @returns Observable of test dropdown options
   */
  getTestsDropdown(): Observable<TestDropdownDto[]> {
    const url = `${this.baseUrl}/dropdowns/tests`;

    return this.http.get<ApiResponse<TestDropdownDto[]>>(url).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get active result statuses for dropdown
   * Endpoint: GET /rgt-results-matrix/dropdowns/result-statuses
   * Retrieves from VALID_TEST_RESULTS and MASTER_CODES
   * Optionally filters by testId and contractId to exclude already-mapped statuses
   *
   * @param testId Optional test ID to filter result statuses
   * @param contractId Optional contract ID to filter result statuses
   * @returns Observable of result status dropdown options
   */
  getResultStatusesDropdown(testId?: string, contractId?: string): Observable<ResultStatusDropdownDto[]> {
    const url = `${this.baseUrl}/dropdowns/result-statuses`;
    let params = new HttpParams();

    if (testId) {
      params = params.set('testId', testId);
    }
    if (contractId) {
      params = params.set('contractId', contractId);
    }

    return this.http.get<ApiResponse<ResultStatusDropdownDto[]>>(url, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get CBC Test ID for a given test ID and contract ID (Gap #3 fix)
   * Endpoint: GET /rgt-results-matrix/cbc-test-id/{testId}/{contractId}
   * Queries RGT_TEST_MATRIX table matching Oracle Forms VALIDATE_FIELD logic
   *
   * @param testId Test identifier
   * @param contractId Contract identifier
   * @returns Observable of CBC Test ID (null if not found)
   */
  getCbcTestId(testId: string, contractId: string): Observable<string | null> {
    const url = `${this.baseUrl}/cbc-test-id/${encodeURIComponent(testId)}/${encodeURIComponent(contractId)}`;

    return this.http.get<ApiResponse<{ cbcTestId: string | null }>>(url).pipe(
      map(response => response.data?.cbcTestId || null)
    );
  }

  /**
   * Batch create multiple result mappings
   * Helper method for creating multiple mappings at once
   *
   * @param requests Array of create request DTOs
   * @returns Observable array of created mappings
   */
  batchCreate(requests: CreateRgtResultsMatrixRequestDto[]): Observable<RgtResultsMatrixDto[]> {
    // Since API doesn't have batch endpoint, create sequentially
    // TODO: Replace with batch endpoint if/when available
    const creates = requests.map(req => this.create(req));
    return this.http.post<ApiResponse<RgtResultsMatrixDto[]>>(
      `${this.baseUrl}/batch`,
      requests
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Batch update multiple result mappings
   * Helper method for updating multiple mappings at once
   *
   * @param updates Array of updates with composite keys and update data
   * @returns Observable array of updated mappings
   */
  batchUpdate(
    updates: Array<{
      testId: string;
      resultStatus: string;
      contractId: string;
      data: UpdateRgtResultsMatrixRequestDto;
    }>
  ): Observable<RgtResultsMatrixDto[]> {
    // TODO: Replace with batch endpoint if/when available
    const updateRequests = updates.map(u =>
      this.update(u.testId, u.resultStatus, u.contractId, u.data)
    );

    // For now, return empty array - implement with batch endpoint
    return this.http.put<ApiResponse<RgtResultsMatrixDto[]>>(
      `${this.baseUrl}/batch`,
      updates
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Batch delete multiple result mappings
   * Helper method for deleting multiple mappings at once
   *
   * @param items Array of composite keys to delete
   * @returns Observable of void
   */
  batchDelete(
    items: Array<{
      testId: string;
      resultStatus: string;
      contractId: string;
    }>
  ): Observable<void> {
    // TODO: Replace with batch endpoint if/when available
    const deleteRequests = items.map(item =>
      this.delete(item.testId, item.resultStatus, item.contractId)
    );

    return this.http.request<ApiResponse<void>>('DELETE', `${this.baseUrl}/batch`, {
      body: items
    }).pipe(
      map(() => void 0)
    );
  }
}
