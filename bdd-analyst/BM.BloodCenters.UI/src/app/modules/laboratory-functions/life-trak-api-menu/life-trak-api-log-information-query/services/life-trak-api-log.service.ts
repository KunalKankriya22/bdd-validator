import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  SourceCodeDto,
  ApiLogDto,
  ApiLogQueryDto,
  ApiLogSearchResponse,
  SourceCodeResponse,
} from '../models/life-trak-api-log.model';

/**
 * LifeTrak API Log Information Query Service
 *
 * Service for APILOGL mnemonic - manages API calls for LifeTrak API log queries
 *
 * API Endpoints:
 * - POST /lifetrak-api-log/search - Search API logs with filters
 * - GET /lifetrak-api-log/source-codes - Get source codes dropdown
 */
@Injectable({
  providedIn: 'root'
})
export class LifeTrakApiLogService {
  private readonly http = inject(HttpClient);

  /**
   * Get source codes for dropdown
   *
   * @returns Observable of source code list
   */
  getSourceCodes(): Observable<SourceCodeDto[]> {
    return this.http.get<SourceCodeResponse>(API.LIFE_TRAK_API_LOG.SOURCE_CODES).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to retrieve source codes');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Search API logs with filters and pagination
   *
   * @param query Search criteria including source ID, dates, pagination
   * @returns Observable of search response with data and total count
   */
  searchLogs(query: ApiLogQueryDto): Observable<ApiLogSearchResponse> {
    // Convert request format
    const requestBody = {
      sourceId: query.sourceId,
      fromDate: query.fromDate ? this.convertToISOString(query.fromDate) : null,
      toDate: query.toDate ? this.convertToISOString(query.toDate) : null,
      take: query.take ?? 12,
      skip: query.skip ?? 0
    };

    return this.http.post<ApiLogSearchResponse>(
      API.LIFE_TRAK_API_LOG.SEARCH,
      requestBody
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Convert Date or string to ISO 8601 string
   * Handles Date objects, moment objects, and ISO strings
   */
  private convertToISOString(date: Date | string | null | undefined): string | null {
    if (!date) return null;

    // If already a string, assume it's ISO format
    if (typeof date === 'string') {
      return date;
    }

    // If it's a Date object, convert to ISO string
    if (date instanceof Date) {
      return date.toISOString();
    }

    // Handle moment objects (has toISOString method)
    if (typeof (date as any).toISOString === 'function') {
      return (date as any).toISOString();
    }

    return null;
  }

  /**
   * Centralized error handling
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred.';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 400 && error.error?.message) {
        errorMessage = error.error.message; // Validation error
      } else if (error.status === 500) {
        errorMessage = error.error?.message || 'Server error. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Check your network.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    console.error('LifeTrak API Log Error:', error);
    return throwError(() => ({
      ...error,
      userMessage: errorMessage
    }));
  }
}
