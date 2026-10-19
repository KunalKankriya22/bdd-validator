import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  TestMessageMappingModel,
  TestMessageMappingListBody,
  TestMessageMappingCreateDto,
  TestMessageMappingUpdateDto,
  LookupItem
} from '../models/test-message-mapping.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class TestMessageMappingService {
  private readonly apiService = inject(ApiService);

  /**
   * List / filter test message mapping records
   * POST /labeling-test-message-map/list
   * Returns all matching records (no server-side pagination)
   */
  getTestMessageMappings(body: TestMessageMappingListBody): Observable<{ data: TestMessageMappingModel[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.TEST_MESSAGE_LIST;

    return this.apiService.post<any>(endpoint, body).pipe(
      map(response => {
        if (!response) {
          return { data: [], total: 0 };
        }
        const data: TestMessageMappingModel[] = response.data || [];
        const total: number = response.total ?? data.length;
        return { data, total };
      }),
      catchError(error => {
        console.error('Error fetching test message mapping data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get test ID lookup options
   * GET /labeling-test-message-map/lookups/test-ids
   * Response is a plain array: [{ code, description }]
   */
  getTestIdLookups(): Observable<LookupItem[]> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.TEST_MESSAGE_LOOKUP_TEST_IDS;

    return this.apiService.get<LookupItem[]>(endpoint).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching test ID lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get message type lookup options
   * GET /labeling-test-message-map/lookups/message-types
   * Response is a plain array: [{ code, description }]
   */
  getMessageTypeLookups(): Observable<LookupItem[]> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.TEST_MESSAGE_LOOKUP_MESSAGE_TYPES;

    return this.apiService.get<LookupItem[]>(endpoint).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching message type lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get result code lookup options filtered by ltTestId
   * GET /labeling-test-message-map/lookups/result-codes?ltTestId={ltTestId}
   * Response is a plain array: [{ code, description }]
   */
  getResultCodeLookups(ltTestId?: string): Observable<LookupItem[]> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.TEST_MESSAGE_LOOKUP_RESULT_CODES(ltTestId);

    return this.apiService.get<LookupItem[]>(endpoint).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching result code lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new Test Message Mapping record
   * POST /labeling-test-message-map
   */
  createRecord(data: TestMessageMappingCreateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.TEST_MESSAGE_ADD;

    return this.apiService.post<any>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error creating test message mapping:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing Test Message Mapping record
   * PUT /labeling-test-message-map/{ltTestId}/{resultCode}/{displyTestId}
   * Only sends editable fields (messageDesc, effDate, termDate)
   */
  updateRecord(ltTestId: string, resultCode: string, displyTestId: string, data: TestMessageMappingUpdateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.TEST_MESSAGE_UPDATE(ltTestId, resultCode, displyTestId);

    return this.apiService.put<any>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating test message mapping:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a Test Message Mapping record
   * DELETE /labeling-test-message-map/{ltTestId}/{resultCode}/{displyTestId}
   */
  deleteRecord(ltTestId: string, resultCode: string, displyTestId: string): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.TEST_MESSAGE_DELETE(ltTestId, resultCode, displyTestId);

    return this.apiService.delete<any>(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting test message mapping:', error);
        return throwError(() => error);
      })
    );
  }
}
