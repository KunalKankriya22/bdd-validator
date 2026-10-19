import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  ContractLookupDto,
  TestLookupDto,
  BatchLookupDto,
  InterimCodeLookupDto,
  QueryUnitsRequestDto,
  UnitInterimResultDto,
  SaveInterimResultsRequestDto,
  SaveInterimResultsResponseDto,
  ApiResponse
} from '../models/interim-result.model';

/**
 * Service for Enter Interim Result Code API operations
 * Handles all HTTP calls to /api/v1/enter-interim-result-code endpoints
 *
 * Base URL: /api/v1/enter-interim-result-code
 * Program ID: RGIQCINT
 *
 * API Documentation: enter-interim-result-code-api-documentation.md
 */
@Injectable({
  providedIn: 'root'
})
export class InterimResultApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/enter-interim-result-code`;

  // ===========================
  // LOV (List of Values) Endpoints
  // ===========================

  /**
   * Get active regional contracts for Contract ID dropdown
   * Endpoint: GET /enter-interim-result-code/contracts
   *
   * Business Rules:
   * - Only active regional contracts (CONTRACT_TYPE='RG')
   * - LAB_COMMON.CHECK_CONTRACT_CHAPTER = 'Y'
   * - Filtered by chapter local date for EFF_DATE/TERM_DATE
   *
   * @param searchText Optional search filter for contract ID or company name
   * @returns Observable of contract lookup DTOs
   */
  getContracts(searchText?: string): Observable<ContractLookupDto[]> {
    let params = new HttpParams();
    if (searchText && searchText.trim()) {
      params = params.set('searchText', searchText.trim());
    }

    return this.http.get<ApiResponse<ContractLookupDto[]>>(`${this.baseUrl}/contracts`, { params }).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get valid tests for a contract based on profile set rules
   * Endpoint: GET /enter-interim-result-code/tests/{contractId}
   *
   * Business Rules:
   * - Validates profile_set_id from RGT_TUBES matches RGT_CONTRACT_PROFILE
   * - Only active tests (EFF_DATE <= ChapterLocalDate AND TERM_DATE > ChapterLocalDate)
   * - Contract must exist
   *
   * @param contractId Contract identifier (max 9 chars)
   * @returns Observable of test lookup DTOs
   */
  getTests(contractId: string): Observable<TestLookupDto[]> {
    const url = `${this.baseUrl}/tests/${encodeURIComponent(contractId)}`;
    return this.http.get<ApiResponse<TestLookupDto[]>>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get batches with eligible units for a contract
   * Endpoint: GET /enter-interim-result-code/batches/{contractId}
   *
   * Business Rules:
   * - Only batches with at least one unit that doesn't have interim results
   * - Uses EXISTS subquery to check for eligible units
   *
   * @param contractId Contract identifier (max 9 chars)
   * @returns Observable of batch lookup DTOs
   */
  getBatches(contractId: string): Observable<BatchLookupDto[]> {
    const url = `${this.baseUrl}/batches/${encodeURIComponent(contractId)}`;
    return this.http.get<ApiResponse<BatchLookupDto[]>>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get valid interim result codes from MASTER_CODES
   * Endpoint: GET /enter-interim-result-code/interim-codes
   *
   * Business Rules:
   * - CODE_TYPE = 'QCIRM' (QC Interim Result codes)
   * - Active codes only (EFF_DATE <= ChapterLocalDate AND TERM_DATE > ChapterLocalDate)
   *
   * @returns Observable of interim code lookup DTOs
   */
  getInterimCodes(): Observable<InterimCodeLookupDto[]> {
    return this.http.get<ApiResponse<InterimCodeLookupDto[]>>(`${this.baseUrl}/interim-codes`).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  // ===========================
  // Query Units (POST)
  // ===========================

  /**
   * Query units in a batch that need interim results
   * Endpoint: POST /enter-interim-result-code/query-units
   *
   * Business Rules:
   * - Only returns units that do NOT have interim results (NOT EXISTS in RGT_INTERIM_RESULTS)
   * - Contract must be active regional contract (CONTRACT_TYPE='RG')
   * - Batch must exist and have eligible units
   * - If testId provided, must be valid for contract based on profile sets
   * - Check digit calculated via Oracle function CHK_DIGIT_QUERY
   *
   * Error Codes:
   * - 1147: Contract not found or inactive
   * - 1227: Test not valid for contract
   * - 1097: Batch not found
   * - 1061: Batch has no eligible units
   *
   * @param request Query units request DTO
   * @returns Observable of unit interim result DTOs (resultCode and resultDescription are empty)
   */
  queryUnits(request: QueryUnitsRequestDto): Observable<UnitInterimResultDto[]> {
    return this.http.post<ApiResponse<UnitInterimResultDto[]>>(`${this.baseUrl}/query-units`, request).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  // ===========================
  // Save Interim Results (POST)
  // ===========================

  /**
   * Bulk save interim results for multiple units
   * Endpoint: POST /enter-interim-result-code/save-results
   *
   * Business Rules:
   * - Validates all result codes exist in MASTER_CODES (CODE_TYPE='QCIRM')
   * - Uses lt_user_session.set_userid and set_chapter_id for audit trail
   * - InsertUserId from user context
   * - InsertDate from dbOperationsDetails
   * - ProgramId = "RGIQCINT"
   * - Each result inserted individually, returns count of successful inserts
   *
   * Error Codes:
   * - 1062: Invalid interim code (not in MASTER_CODES)
   * - 400: Missing required fields or validation errors
   *
   * @param request Save interim results request DTO
   * @returns Observable of save response (insertedCount)
   */
  saveInterimResults(request: SaveInterimResultsRequestDto): Observable<{ message: string; insertedCount: number }> {
    return this.http.post<ApiResponse<SaveInterimResultsResponseDto[]>>(`${this.baseUrl}/save-results`, request).pipe(
      map(response => ({
        message: response.message || '',
        insertedCount: response.data?.[0]?.insertedCount ?? 0
      })),
      catchError(this.handleError)
    );
  }

  // ===========================
  // Error Handling
  // ===========================

  /**
   * Handle HTTP errors and extract error messages
   * Supports both ErrorStore error codes and validation errors
   *
   * @param error HttpErrorResponse from Angular
   * @returns Observable that throws structured error object
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing your request.';

    if (error.error instanceof ErrorEvent) {
      // Client-side error (network issue, etc.)
      errorMessage = error.error.message;
    } else {
      // Server-side error - extract from standardized API response format
      const apiError = error.error;

      if (apiError?.errorResponse?.error) {
        // ErrorStore error response (e.g., error code 1147, 1227, 1097, 1061, 1062)
        errorMessage = apiError.errorResponse.error;
      } else if (apiError?.message) {
        // Standard API error message (validation errors)
        errorMessage = apiError.message;
      } else if (error.status === 400) {
        errorMessage = 'Invalid request. Please check your input and try again.';
      } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please contact support if the issue persists.';
      } else if (error.message) {
        errorMessage = error.message;
      }
    }

    // Return structured error with message and original error object
    return throwError(() => ({ message: errorMessage, error }));
  }
}
