import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  UnitDonorTestedAntigenResponse,
  UnitTestedAntigensApiResponse,
  UnitTestedAntigensQueryRequest,
  ScheduledTest,
  UnscheduledTest,
  DonorTest
} from '../models/antql-query.model';

@Injectable({
  providedIn: 'root'
})
export class AntqlQueryService {
  private readonly http = inject(HttpClient);

  /**
   * Query tested antigens for a unit using POST endpoint
   * @param unitId - Blood unit identifier
   * @returns Combined test results from UTRS, UNIT_TEST_BASE, and DONOR_TESTED_UNITS
   *
   * Backend Response Structure (ReturnResult<UnitTestedAntigensQueryResponseDto>):
   * - success: boolean
   * - data: UnitTestedAntigensQueryResponseDto[] (array)
   * - item: UnitTestedAntigensQueryResponseDto (single object - USE THIS)
   * - message: string
   * - statusCode: number
   */
  queryTestedAntigens(unitId: string): Observable<UnitDonorTestedAntigenResponse> {
    const url = API.UNIT_TESTED_ANTIGENS.QUERY;
    const request: UnitTestedAntigensQueryRequest = { unitId };

    return this.http.post<UnitTestedAntigensApiResponse>(`${environment.apiUrl}${url}`, request)
      .pipe(
        map(response => {
          // Backend returns both 'item' (single object) and 'data' (array)
          // Prefer 'item' as it's the primary response object
          if (response.item) {
            return response.item;
          }

          // Fallback: Try data array if item is null
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0];
          }

          // Last resort: throw error if no data found
          throw new Error('No data returned from API');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get all tested antigens for a unit from all three data sources
   * @param unitId - Blood unit identifier
   * @returns Combined test results from UTRS, UNIT_TEST_BASE, and DONOR_TESTED_UNITS
   * @deprecated Use queryTestedAntigens instead
   */
  getAllTestedAntigens(unitId: string): Observable<UnitDonorTestedAntigenResponse> {
    return this.queryTestedAntigens(unitId);
  }

  /**
   * Handle HTTP errors from the API
   * @param error - HTTP error response
   * @returns Observable that throws formatted error
   */
  private handleError(error: HttpErrorResponse | Error): Observable<never> {
    if (!(error instanceof HttpErrorResponse)) {
      return throwError(() => error);
    }

    let errorMessage = 'An unexpected error occurred';
    let errorCode: string | undefined;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response
      const backendError = error.error as UnitTestedAntigensApiResponse;

      if (backendError?.error) {
        errorMessage = backendError.error;
        errorCode = backendError.errorCode || undefined;
      } else if (backendError?.message) {
        errorMessage = backendError.message;
      } else {
        // Fallback error messages based on status code
        switch (error.status) {
          case 404:
            errorMessage = 'Unit not found or no test data available';
            break;
          case 400:
            errorMessage = 'Invalid request - please check the Unit ID';
            break;
          case 500:
            errorMessage = 'Server error occurred while retrieving test results';
            break;
          default:
            errorMessage = `Error: ${error.status} - ${error.statusText}`;
        }
      }
    }

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      errorCode: errorCode,
      originalError: error
    }));
  }
}
