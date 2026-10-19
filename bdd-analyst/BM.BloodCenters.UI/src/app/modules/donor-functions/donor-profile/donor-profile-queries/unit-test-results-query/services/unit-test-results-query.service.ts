import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import moment, { Moment } from 'moment';

import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import {
  UnitTestResultQueryDto,
  UnitTestResultsApiResponse,
  UnitTestResultResponseDto,
  CollectionDatesApiResponse
} from '../models/unit-test-results-query.model';

@Injectable({
  providedIn: 'root'
})
export class UnitTestResultsQueryService {
  private readonly http = inject(HttpClient);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/unit-test-results`;

  // Accepts Moment directly — no Moment→Date→Moment round-trip that
  // would re-interpret the date in the browser's local timezone.
  queryUnitTestResults(unitId: string, collDate?: Moment): Observable<UnitTestResultsApiResponse> {
    const requestBody: UnitTestResultQueryDto = {
      unitId: unitId.trim(),
      collDate: collDate?.isValid() ? collDate.format('YYYY-MM-DD') : undefined
    };

    return this.http.post<UnitTestResultsApiResponse>(`${this.baseUrl}/query`, requestBody)
      .pipe(
        map(response => {
          if (response.data && response.data.length > 0) {
            response.data = response.data.map(result => this.formatResponseDates(result));
          }
          return response;
        }),
        catchError(error => throwError(() => error))
      );
  }

  getUnitTestResultsByUnitId(unitId: string): Observable<UnitTestResultsApiResponse> {
    const encodedUnitId = encodeURIComponent(unitId.trim());

    return this.http.get<UnitTestResultsApiResponse>(`${this.baseUrl}/${encodedUnitId}`)
      .pipe(
        map(response => {
          if (response.data && response.data.length > 0) {
            response.data = response.data.map(result => this.formatResponseDates(result));
          }
          return response;
        }),
        catchError(error => throwError(() => error))
      );
  }

  getCollectionDates(unitId: string): Observable<CollectionDatesApiResponse> {
    const encodedUnitId = encodeURIComponent(unitId.trim());

    return this.http.get<CollectionDatesApiResponse>(`${this.baseUrl}/${encodedUnitId}/collection-dates`)
      .pipe(
        map(response => {
          if (response.data && response.data.length > 0) {
            response.data = response.data.map(d => ({
              ...d,
              collDate: d.collDate ? this.formatCollDateForDisplay(d.collDate) : d.collDate
            }));
          }
          return response;
        }),
        catchError(error => throwError(() => error))
      );
  }

  private formatResponseDates(result: UnitTestResultResponseDto): UnitTestResultResponseDto {
    return {
      ...result,
      collDate: result.collDate ? this.formatCollDateForDisplay(result.collDate) : null,
      dateOfBirth: result.dateOfBirth ? this.formatDateForDisplay(result.dateOfBirth) : null
    };
  }

  private formatCollDateForDisplay(date: string): string {
    const m = moment(date);
    if (!m.isValid()) return date;
    return this.chapterTimezoneService.convertGmtToLocal(m).format('DD-MMM-YYYY').toUpperCase();
  }

  private formatDateForDisplay(date: string): string {
    // Parse as UTC so a DOB stored as "1990-01-01T00:00:00Z" renders as
    // "01-JAN-1990" regardless of the browser's local timezone offset.
    const m = moment.utc(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  }
}
