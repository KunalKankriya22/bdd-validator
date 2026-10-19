import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  ApiResponse,
  AvailableBoxDto,
  BoxScanResultDto,
  CloseBoxDto,
  CloseBoxResultDto
} from '../models/close-box.model';

@Injectable({
  providedIn: 'root'
})
export class CloseBoxService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/distributions/close-box`;

  getBoxDetails(boxId: string): Observable<CloseBoxDto> {
    if (!boxId || boxId.trim().length === 0) {
      return throwError(() => new Error('Box ID is required'));
    }

    if (boxId.length > 10) {
      return throwError(() => new Error('Box ID must not exceed 10 characters'));
    }

    const url = `${this.baseUrl}/${encodeURIComponent(boxId.trim())}`;

    return this.http.get<ApiResponse<CloseBoxDto>>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to retrieve box details');
      }),
      catchError(error => {
        const errorMessage = error.error?.message
          || error.error?.errorResponse?.error
          || error.message
          || 'Failed to retrieve box details';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  closeBox(boxId: string): Observable<CloseBoxResultDto> {
    if (!boxId || boxId.trim().length === 0) {
      return throwError(() => new Error('Box ID is required'));
    }

    const url = `${this.baseUrl}/${encodeURIComponent(boxId.trim())}/close`;

    return this.http.put<ApiResponse<CloseBoxResultDto>>(url, {}).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to close box');
      }),
      catchError(error => {
        const errorMessage = error.error?.message
          || error.error?.errorResponse?.error
          || error.message
          || 'Failed to close box';

        const errorCode = error.error?.errorCode
          || error.error?.errorResponse?.errorCode;

        const err = new Error(errorMessage);
        (err as any).code = errorCode;

        return throwError(() => err);
      })
    );
  }

  getAvailableBoxes(): Observable<AvailableBoxDto[]> {
    const url = `${this.baseUrl}/available`;

    return this.http.get<ApiResponse<AvailableBoxDto[]>>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        const errorMessage = error.error?.message
          || error.message
          || 'Failed to retrieve available boxes';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  validateBoxScan(scanValue: string): Observable<BoxScanResultDto> {
    if (!scanValue || scanValue.trim().length === 0) {
      return throwError(() => new Error('Scan value is required'));
    }

    const url = `${this.baseUrl}/validate-scan`;

    return this.http.post<ApiResponse<BoxScanResultDto>>(url, { scanValue: scanValue.trim() }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to validate box scan');
      }),
      catchError(error => {
        const errorMessage = error.error?.message
          || error.message
          || 'Failed to validate box scan';
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
