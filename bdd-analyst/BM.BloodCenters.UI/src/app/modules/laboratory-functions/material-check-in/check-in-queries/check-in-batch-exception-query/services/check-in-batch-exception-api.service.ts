import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  CheckInBatchExceptionDto,
  UnitAttributeDto,
  ValidBatchDto,
  BatchExceptionResponse,
  UnitAttributesResponse,
  ValidBatchesResponse,
} from '../models/check-in-batch-exception.model';

@Injectable({
  providedIn: 'root',
})
export class CheckInBatchExceptionApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Retrieves all units in a batch that have exceptions (missing data or attribute '14')
   * @param batchId - Batch ID to query (must be CB-type check-in batch)
   * @param unitId - Optional unit ID filter to search for specific unit
   * @returns Observable<CheckInBatchExceptionDto[]>
   */
  getBatchExceptions(batchId: string, unitId?: string): Observable<CheckInBatchExceptionDto[]> {
    const url = API.CHECK_IN_BATCH_EXCEPTION.GET_BATCH_EXCEPTIONS(batchId, unitId);

    return this.apiService.get<BatchExceptionResponse>(url).pipe(
      map((response) => {
        if (response?.success && response?.data) {
          return response.data;
        }
        return [];
      }),
      catchError((error) => {
        const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
        const errorMessage = error?.error?.message || error?.error?.error;

        console.error('Error fetching batch exceptions:', error);

        // Attach error code to error object for component to access
        const enrichedError = {
          ...error,
          extractedErrorCode: errorCode,
          extractedMessage: errorMessage
        };

        return throwError(() => enrichedError);
      })
    );
  }

  /**
   * Retrieves all attributes for a specific unit
   * @param unitId - Unit ID
   * @param collDate - Collection date (ISO 8601 format) - can be null
   * @returns Observable<UnitAttributeDto[]>
   */
  getUnitAttributes(unitId: string, collDate: string | null): Observable<UnitAttributeDto[]> {
    const url = API.CHECK_IN_BATCH_EXCEPTION.GET_UNIT_ATTRIBUTES(unitId, collDate || '');

    return this.apiService.get<UnitAttributesResponse>(url).pipe(
      map((response) => {
        if (response?.success && response?.data) {
          return response.data;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching unit attributes:', error);
        // For 404 responses, return empty array
        if (error?.status === 404) {
          return throwError(() => new Error('No attributes found for this unit.'));
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Retrieves valid check-in batches (CB-type) for autocomplete
   * @param search - Optional search keyword to filter batch IDs
   * @returns Observable<ValidBatchDto[]>
   */
  getValidBatches(search?: string): Observable<ValidBatchDto[]> {
    const url = API.CHECK_IN_BATCH_EXCEPTION.GET_VALID_BATCHES(search || '');

    return this.apiService.get<ValidBatchesResponse>(url).pipe(
      map((response) => {
        if (response?.success && response?.data) {
          return response.data;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching valid batches:', error);
        return throwError(() => error);
      })
    );
  }
}
