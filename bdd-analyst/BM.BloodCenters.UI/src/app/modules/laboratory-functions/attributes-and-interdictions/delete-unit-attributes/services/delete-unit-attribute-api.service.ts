import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API } from 'src/app/core/constants/api.constants';
import {
  ApiResponse,
  DuattrUnitValidationResult,
  UnitAttributeRow,
  AttributeToDelete,
  DeleteUnitAttributesRequestBody
} from '../models/delete-unit-attribute.model';

@Injectable({
  providedIn: 'root'
})
export class DeleteUnitAttributeApiService {
  private readonly http = inject(HttpClient);

  validateUnit(unitId: string, codeScheme: string): Observable<DuattrUnitValidationResult> {
    const params = new HttpParams().set('codeScheme', codeScheme);

    return this.http.get<ApiResponse<DuattrUnitValidationResult>>(
      API.DELETE_UNIT_ATTRIBUTE.VALIDATE_UNIT(unitId),
      { params }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || response.error || 'Failed to validate unit');
      }),
      catchError(this.handleError)
    );
  }

  getAttributes(
    unitId: string,
    collDate: string,
    codeScheme: string
  ): Observable<{ data: UnitAttributeRow[]; totalRecords: number }> {
    const params = new HttpParams()
      .set('collDate', collDate)
      .set('codeScheme', codeScheme);

    return this.http.get<ApiResponse<UnitAttributeRow[]>>(
      API.DELETE_UNIT_ATTRIBUTE.GET_ATTRIBUTES(unitId),
      { params }
    ).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(this.handleError)
    );
  }

  deleteAttributes(
    unitId: string,
    collDate: string,
    attributes: AttributeToDelete[],
    codeScheme: string
  ): Observable<unknown> {
    const params = new HttpParams().set('codeScheme', codeScheme);
    const body: DeleteUnitAttributesRequestBody = {
      unitId,
      collDate,
      attributesToDelete: attributes
    };

    return this.http.delete<ApiResponse<unknown>>(
      API.DELETE_UNIT_ATTRIBUTE.DELETE,
      { body, params }
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || response.error || 'Failed to delete attributes');
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing your request.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      const apiError = error.error as ApiResponse<any>;

      if (apiError?.error) {
        errorMessage = apiError.error;
      } else if (apiError?.errorResponse?.error) {
        errorMessage = apiError.errorResponse.error;
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      } else if (error.status === 404) {
        errorMessage = 'Unit not found.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid request. Please check your input.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
    }

    return throwError(() => ({ message: errorMessage, error }));
  }
}
