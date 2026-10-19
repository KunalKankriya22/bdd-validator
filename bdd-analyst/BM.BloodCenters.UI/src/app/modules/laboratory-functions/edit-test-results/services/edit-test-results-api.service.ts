import { Injectable, inject } from '@angular/core';
import { HttpParams, HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';

import {
  UnitValidationDto,
  UnitTestResultDto,
  EditableTestDropdownDto,
  UpdateTestResultDto,
  ApiResponse,
  EditReasonCodeDto,
  ValidTestResultDto,
  CollectionDateDto,
  AltResultDto,
  ValidationWithTestsResponse
} from '../models/edit-test-results.model';

/**
 * API Service for Edit Test Results
 * Implements all endpoints from edit-test-results-api-documentation.md
 * JIRA Ticket: MLT-12750
 */
@Injectable({
  providedIn: 'root'
})
export class EditTestResultsApiService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  /**
   * Get current chapter ID from header service
   */
  private getChapterId(): string {
    return this.headerService.getCurrentChapterId() || '';
  }

  /**
   * Validate Unit and Get Tests
   * Endpoint: GET /edit-test-results/validation/unit/{unitId}?chapterId=XXX
   * Returns both validation data and editable tests in a single response
   */
  validateUnitAndGetTests(unitId: string): Observable<ValidationWithTestsResponse> {
    const chapterId = this.getChapterId();
    const params = new URLSearchParams({ chapterId });
    const endpoint = `${API.EDIT_TEST_RESULTS.VALIDATE_UNIT(unitId)}?${params.toString()}`;

    return this.apiService.get<ValidationWithTestsResponse>(endpoint, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Failed to validate unit');
      }),
      catchError(error => {
        const errorMessage = error?.error?.message || error?.error?.error || error?.message || 'Failed to validate unit';
        const errorCode = error?.error?.errorCode || '';

        const enhancedError = new Error(errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage);
        (enhancedError as any).errorCode = errorCode;
        (enhancedError as any).statusCode = error?.status || 500;

        return throwError(() => enhancedError);
      })
    );
  }

  /**
   * Get Editable Tests
   * Endpoint: GET /edit-test-results/editable-tests/{unitId}?chapterId=XXX&testId=YYY
   */
  getEditableTests(unitId: string, testId?: string): Observable<UnitTestResultDto[]> {
    const chapterId = this.getChapterId();
    const params = new URLSearchParams({ chapterId });
    if (testId) {
      params.set('testId', testId);
    }
    const endpoint = `${API.EDIT_TEST_RESULTS.BASE}/editable-tests/${encodeURIComponent(unitId)}?${params.toString()}`;

    return this.apiService.get<ApiResponse<UnitTestResultDto>>(endpoint).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error loading editable tests:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Editable Tests Dropdown
   * Endpoint: GET /edit-test-results/editable-tests-dropdown/{unitId}?chapterId=XXX
   */
  getEditableTestsDropdown(unitId: string): Observable<EditableTestDropdownDto[]> {
    const chapterId = this.getChapterId();
    const params = new URLSearchParams({ chapterId });
    const endpoint = `${API.EDIT_TEST_RESULTS.EDITABLE_TESTS_DROPDOWN(unitId)}?${params.toString()}`;

    return this.apiService.get<ApiResponse<EditableTestDropdownDto>>(endpoint).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error loading dropdown data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update Test Result
   * Endpoint: PUT /edit-test-results/unit/{unitId}/test/{testId}?chapterId=XXX
   */
  updateTestResult(
    unitId: string,
    testId: string,
    dto: UpdateTestResultDto
  ): Observable<boolean> {
    const chapterId = this.getChapterId();
    const params = new URLSearchParams({ chapterId });
    const endpoint = `${API.EDIT_TEST_RESULTS.UPDATE_TEST_RESULT(unitId, testId)}?${params.toString()}`;

    return this.apiService.put<ApiResponse<boolean>>(endpoint, dto).pipe(
      map(response => {
        if (response.success && response.data && response.data.length > 0) {
          return response.data[0];
        }
        return false;
      }),
      catchError(error => {
        const errorMessage = error?.error?.message || error?.error?.error || error?.message || 'Failed to update test result';
        const errorCode = error?.error?.errorCode || '';

        const enhancedError = new Error(errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage);
        (enhancedError as any).errorCode = errorCode;
        (enhancedError as any).statusCode = error?.status || 500;

        return throwError(() => enhancedError);
      })
    );
  }

  /**
   * Get Edit Reason Codes
   * Endpoint: GET /edit-test-results/edit-reason-codes
   */
  getEditReasonCodes(): Observable<EditReasonCodeDto[]> {
    return this.apiService.get<ApiResponse<EditReasonCodeDto>>(API.EDIT_TEST_RESULTS.EDIT_REASON_CODES).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error loading edit reason codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Valid Test Results
   * Endpoint: GET /edit-test-results/valid-results/{testId}?testMode=A&antigenFlag=N
   */
  getValidTestResults(testId: string, testMode = 'A', antigenFlag = 'N'): Observable<ValidTestResultDto[]> {
    const endpoint = API.EDIT_TEST_RESULTS.VALID_RESULTS(testId);

    const params = new HttpParams()
      .set('testMode', testMode)
      .set('antigenFlag', antigenFlag);

    return this.apiService.get<ApiResponse<ValidTestResultDto>>(endpoint, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error loading valid test results:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Collection Dates
   * Endpoint: GET /edit-test-results/collection-dates/{unitId}?chapterId=XXX
   */
  getCollectionDates(unitId: string): Observable<CollectionDateDto[]> {
    const chapterId = this.getChapterId();
    const params = new URLSearchParams({ chapterId });
    const endpoint = `${API.EDIT_TEST_RESULTS.COLLECTION_DATES(unitId)}?${params.toString()}`;

    return this.apiService.get<ApiResponse<CollectionDateDto>>(endpoint).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error loading collection dates:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Calculate ALT Result
   * Endpoint: GET /edit-test-results/calculate-alt-result?absorbance={value}
   */
  calculateAltResult(absorbance: number): Observable<AltResultDto | null> {
    const params = new HttpParams().set('absorbance', absorbance.toString());

    return this.apiService.get<ApiResponse<AltResultDto>>(API.EDIT_TEST_RESULTS.CALCULATE_ALT_RESULT, { params }).pipe(
      map(response => {
        if (response.success && response.data && response.data.length > 0) {
          return response.data[0];
        }
        return null;
      }),
      catchError(error => {
        console.error('Error calculating ALT result:', error);
        return throwError(() => error);
      })
    );
  }
}
