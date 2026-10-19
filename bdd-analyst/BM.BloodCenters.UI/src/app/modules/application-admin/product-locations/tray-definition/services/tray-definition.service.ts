import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  TrayDto,
  CreateTrayRequestDto,
  UpdateTrayRequestDto,
  TrayQueryDto,
  TrayStatusLovDto,
  ApiResponse
} from '../models/tray-definition.model';

/**
 * Service for Tray Definition API operations
 * Base URL: /api/v1/tray-definition
 */
@Injectable({
  providedIn: 'root'
})
export class TrayDefinitionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.TRAY_DEFINITION.BASE}`;

  /**
   * Get all trays with pagination, filtering, and sorting
   * POST /api/v1/tray-definition/{take}/{skip}
   *
   * @param take Number of records to return
   * @param skip Number of records to skip
   * @param filters Optional filter parameters
   * @returns Observable of trays with total count
   */
  getAllTrays(
    take: number,
    skip: number,
    filters?: TrayQueryDto
  ): Observable<{ data: TrayDto[]; totalRecords: number }> {
    const url = `${this.baseUrl}/${take}/${skip}`;
    const body = filters || {};

    return this.http.post<ApiResponse<TrayDto[]>>(url, body).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Get a single tray by chapter ID and tray number
   * GET /api/v1/tray-definition/{chapterId}/{trayNumber}
   *
   * @param chapterId Chapter identifier
   * @param trayNumber Tray number
   * @returns Observable of tray data
   */
  getTrayById(chapterId: string, trayNumber: string): Observable<TrayDto> {
    const url = `${this.baseUrl}/${chapterId}/${trayNumber}`;

    return this.http.get<ApiResponse<TrayDto>>(url).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get tray status list of values from VSERV_MASTER
   * GET /api/v1/tray-definition/tray-status-lov
   *
   * @returns Observable of status options
   */
  getTrayStatusLov(): Observable<TrayStatusLovDto[]> {
    const url = `${this.baseUrl}/tray-status-lov`;

    return this.http.get<{ data: TrayStatusLovDto[]; total: number }>(url).pipe(
      map(response => {
        const data = response.data;
        if (Array.isArray(data)) {
          return data;
        }
        return [];
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create a new tray definition
   * POST /api/v1/tray-definition
   *
   * @param payload Create tray request data
   * @returns Observable of created tray result
   */
  createTray(payload: CreateTrayRequestDto): Observable<{ chapterId: string; trayNumber: string }> {
    return this.http.post<ApiResponse<{ chapterId: string; trayNumber: string }>>(this.baseUrl, payload).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing tray definition
   * PUT /api/v1/tray-definition/{chapterId}/{trayNumber}
   *
   * @param chapterId Chapter identifier
   * @param trayNumber Tray number
   * @param payload Update tray request data
   * @returns Observable of API response
   */
  updateTray(
    chapterId: string,
    trayNumber: string,
    payload: UpdateTrayRequestDto
  ): Observable<void> {
    const url = `${this.baseUrl}/${chapterId}/${trayNumber}`;

    return this.http.put<ApiResponse<void>>(url, payload).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  /**
   * Soft delete a tray definition (sets TERM_DATE to current date)
   * DELETE /api/v1/tray-definition/{chapterId}/{trayNumber}
   *
   * @param chapterId Chapter identifier
   * @param trayNumber Tray number
   * @returns Observable of API response
   */
  deleteTray(chapterId: string, trayNumber: string): Observable<void> {
    const url = `${this.baseUrl}/${chapterId}/${trayNumber}`;

    return this.http.delete<ApiResponse<void>>(url).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   * @param error HTTP error response
   * @returns Observable error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing your request';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error?.errorResponse?.error) {
        errorMessage = error.error.errorResponse.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
    }

    return throwError(() => ({
      message: errorMessage,
      errorCode: error.error?.errorCode || error.error?.errorResponse?.errorCode || '',
      status: error.status
    }));
  }
}
