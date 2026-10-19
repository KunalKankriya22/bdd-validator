import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  CreateLabMasterCodeTypeDto,
  UpdateLabMasterCodeTypeDto,
  LabMasterCodeTypeEditResponse
} from '../models/lab-master-code-type.models';

@Injectable({
  providedIn: 'root'
})
export class LabMasterCodeTypeApiService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/lab-master-code-types`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new Lab Master Code Type
   * POST /api/v1/lab-master-code-types
   */
  createCodeType(dto: CreateLabMasterCodeTypeDto): Observable<void> {
    return this.http.post<void>(this.baseUrl, this.formatDatesForApi(dto))
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Update an existing Lab Master Code Type
   * PUT /api/v1/lab-master-code-types/{codeType}
   */
  updateCodeType(
    codeType: string,
    dto: UpdateLabMasterCodeTypeDto
  ): Observable<void> {
    const url = `${this.baseUrl}/${encodeURIComponent(codeType)}`;
    return this.http.put<void>(url, this.formatDatesForApi(dto))
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get Lab Master Code Type for editing
   * GET /api/v1/lab-master-code-types/{codeType}
   */
  getCodeTypeForEdit(
    codeType: string
  ): Observable<LabMasterCodeTypeEditResponse> {
    const url = `${this.baseUrl}/${encodeURIComponent(codeType)}`;
    return this.http.get<LabMasterCodeTypeEditResponse>(url)
      .pipe(
        map(response => this.parseDatesFromApi(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Format dates to ISO string for API
   */
  private formatDatesForApi(dto: any): any {
    const formatted: any = {};

    // Map all properties
    if (dto.codeType) {
      formatted.codeType = dto.codeType;
    }

    if (dto.description !== undefined) {
      formatted.description = dto.description;
    }

    if (dto.changeControlFlag !== undefined) {
      formatted.changeControlFlag = dto.changeControlFlag;
    }

    // Format dates
    if (dto.effectiveDate instanceof Date) {
      formatted.effectiveDate = dto.effectiveDate.toISOString();
    } else if (dto.effectiveDate) {
      formatted.effectiveDate = dto.effectiveDate;
    }

    if (dto.terminationDate instanceof Date) {
      formatted.terminationDate = dto.terminationDate.toISOString();
    } else if (dto.terminationDate === null) {
      formatted.terminationDate = null;
    } else if (dto.terminationDate) {
      formatted.terminationDate = dto.terminationDate;
    }

    return formatted;
  }

  /**
   * Parse date strings from API to Date objects
   */
  private parseDatesFromApi(response: any): any {
    const parsed = { ...response };

    if (parsed.effectiveDate) {
      parsed.effectiveDate = new Date(parsed.effectiveDate);
    }

    if (parsed.terminationDate) {
      parsed.terminationDate = new Date(parsed.terminationDate);
    }

    if (parsed.modificationDate) {
      parsed.modificationDate = new Date(parsed.modificationDate);
    }

    return parsed;
  }

  /**
   * Handle HTTP errors with specific error messages
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      const eventMessage = error.error.message || '';
      errorMessage = eventMessage.includes('Error')
        ? eventMessage
        : `Network Error: ${eventMessage}`;
    } else {
      // Server-side error
      const serverMessage = error.error?.message;

      switch (error.status) {
        case 400:
          errorMessage = serverMessage || 'Invalid request';
          break;
        case 404:
          errorMessage = serverMessage || 'Resource not found';
          break;
        case 409:
          errorMessage = serverMessage || 'Resource already exists';
          break;
        case 500:
          errorMessage = serverMessage || 'Internal server error';
          break;
        default:
          errorMessage = serverMessage || `HTTP error code ${error.status}`;
          break;
      }
    }

    console.error('API Error:', errorMessage, error);

    return throwError(() => ({ ...error, message: errorMessage }));
  }
}