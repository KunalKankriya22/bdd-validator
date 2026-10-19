import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import {
  ApiResponse,
  DriveProjectionSummary,
  DriveDetail,
  DonationType,
  DriveProjectionRequest
} from '../models/draw-query.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';

@Injectable({
  providedIn: 'root'
})
export class DrawQueryService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);
  private readonly BASE_URL = '/api/v1/drive-projections';

  /**
   * Get HTTP headers with chapterId
   */
  private getHeaders(): HttpHeaders {
    const chapterId = this.headerService.chapterId();
    return new HttpHeaders({
      'X-Chapter-Id': chapterId
    });
  }

  /**
   * Get drive projection summary grouped by date
   * POST /api/v1/drive-projections
   * @param params - Filter parameters
   * @returns Observable with projection data
   */
  getDriveProjections(
    params: DriveProjectionRequest
  ): Observable<DriveProjectionSummary[]> {
    return this.apiService.post<ApiResponse<DriveProjectionSummary>>(
      this.BASE_URL,
      params,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        // Handle 404 as empty result when API indicates success
        if (error.status === 404 && error.error?.success === true) {
          return of([]);
        }

        console.error('Error fetching drive projections:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get donation type lookup values
   * GET /api/v1/drive-projections/lookups/donation-types
   * @returns Observable with donation types
   */
  getDonationTypes(): Observable<DonationType[]> {
    const endpoint = `${this.BASE_URL}/lookups/donation-types`;
    return this.apiService.get<ApiResponse<DonationType>>(
      endpoint,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching donation types:', error);
        return of([]);
      })
    );
  }

  /**
   * Get detailed drive information for a specific date
   * GET /api/v1/drive-projections/details/{driveDate}
   * @param driveDate - Date in YYYY-MM-DD format
   * @param driveType - Drive type code (FIX, MOB, BOTH)
   * @returns Observable with drive details
   */
  getDriveDetails(driveDate: string, driveType: string): Observable<DriveDetail[]> {
    // Format date to YYYY-MM-DD (no time)
    const dateOnly = driveDate.split('T')[0];
    const chapterId = this.headerService.chapterId();
    const endpoint = `${this.BASE_URL}/details/${encodeURIComponent(dateOnly)}`;
    const params = new HttpParams()
      .set('driveType', driveType)
      .set('chapterId', chapterId);
    return this.apiService.get<ApiResponse<DriveDetail>>(
      endpoint,
      {
        headers: this.getHeaders(),
        params
      }
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching drive details:', error);
        return throwError(() => error);
      })
    );
  }
}
